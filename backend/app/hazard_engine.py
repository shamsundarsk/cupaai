"""AI hazard prediction engine.

Combines a scikit-learn IsolationForest anomaly detector (trained on
synthetic normal-operation telemetry at startup) with a deterministic
physics-style rule layer. The blend gives stable, explainable risk scores
that still react to anomalies in the live simulation.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import IsolationForest


@dataclass
class HazardInput:
    temperature: float       # °C
    voltage: float           # V (battery only, 0 for machines)
    gas_level: float         # 0–100
    vibration: float         # 0–10
    machine_load: float      # 0–100 (% capacity used)


@dataclass
class HazardOutput:
    risk_score: float        # 0..1
    risk_level: str          # LOW / MEDIUM / HIGH / CRITICAL
    recommended_action: str


class HazardEngine:
    """Anomaly detection + heuristic safety rules."""

    LEVELS = (
        (0.85, "CRITICAL", "Isolate immediately and trigger shutdown."),
        (0.65, "HIGH",     "Reroute to isolation bay and alert HSE."),
        (0.40, "MEDIUM",   "Slow conveyor and increase cooling."),
        (0.00, "LOW",      "Operating within safe envelope."),
    )

    def __init__(self, seed: int = 42) -> None:
        rng = np.random.default_rng(seed)

        # Generate synthetic "normal operation" samples for unsupervised
        # training. Each row: [temp, voltage, gas, vibration, load].
        n = 4000
        temp = rng.normal(40, 6, n).clip(20, 70)
        volt = rng.normal(12.0, 0.4, n).clip(10.5, 13.5)
        gas = rng.normal(15, 6, n).clip(0, 45)
        vib = rng.normal(2.5, 0.8, n).clip(0, 5)
        load = rng.normal(55, 12, n).clip(10, 85)

        x = np.column_stack([temp, volt, gas, vib, load])

        self.model = IsolationForest(
            n_estimators=120,
            contamination=0.03,
            random_state=seed,
        )
        self.model.fit(x)

    # ------------------------------------------------------------------ #
    # Public API                                                         #
    # ------------------------------------------------------------------ #
    def score(self, h: HazardInput) -> HazardOutput:
        ml_score = self._ml_score(h)
        rule_score = self._rule_score(h)
        # Weighted blend — rules dominate for clear thresholds, ML adds
        # sensitivity to subtle anomalies.
        risk = float(np.clip(0.55 * rule_score + 0.45 * ml_score, 0.0, 1.0))

        for threshold, level, action in self.LEVELS:
            if risk >= threshold:
                return HazardOutput(risk, level, action)
        # Defensive fallback (should never hit because of 0.00 threshold).
        return HazardOutput(risk, "LOW", "Operating within safe envelope.")

    # ------------------------------------------------------------------ #
    # Internals                                                          #
    # ------------------------------------------------------------------ #
    def _ml_score(self, h: HazardInput) -> float:
        x = np.array([[h.temperature, h.voltage, h.gas_level,
                       h.vibration, h.machine_load]])
        # decision_function: higher = more normal.
        df = float(self.model.decision_function(x)[0])
        # Map to 0..1 anomaly score (higher = more anomalous).
        anomaly = 1.0 / (1.0 + np.exp(8.0 * df))
        return float(np.clip(anomaly, 0.0, 1.0))

    def _rule_score(self, h: HazardInput) -> float:
        """Deterministic safety rules. Returns 0..1."""
        parts = []

        # Temperature: safe < 50°C, danger > 80°C, critical > 100°C.
        if h.temperature <= 50:
            parts.append(0.0)
        elif h.temperature >= 100:
            parts.append(1.0)
        else:
            parts.append((h.temperature - 50) / 50.0)

        # Voltage anomaly (only if a battery is present, voltage > 0).
        if h.voltage > 0:
            dev = abs(h.voltage - 12.0)
            parts.append(min(dev / 2.5, 1.0))

        # Gas level: safe < 25, danger > 60.
        if h.gas_level <= 25:
            parts.append(0.0)
        elif h.gas_level >= 80:
            parts.append(1.0)
        else:
            parts.append((h.gas_level - 25) / 55.0)

        # Vibration: safe < 4, danger > 7.
        if h.vibration <= 4:
            parts.append(0.0)
        elif h.vibration >= 9:
            parts.append(1.0)
        else:
            parts.append((h.vibration - 4) / 5.0)

        # Machine load: safe < 80, danger > 95.
        if h.machine_load <= 80:
            parts.append(0.0)
        elif h.machine_load >= 100:
            parts.append(1.0)
        else:
            parts.append((h.machine_load - 80) / 20.0)

        # Combine: emphasis on the worst offending signal.
        max_part = max(parts)
        avg_part = sum(parts) / len(parts)
        return float(np.clip(0.65 * max_part + 0.35 * avg_part, 0.0, 1.0))
