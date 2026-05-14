"""AI Hazard Prediction Engine — IsolationForest + rule-based escalation."""
from __future__ import annotations

import numpy as np
import random
from sklearn.ensemble import IsolationForest
import joblib
import os
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "models" / "hazard_model.pkl"


class HazardPredictor:
    """Predicts thermal runaway probability from sensor features."""

    def __init__(self):
        self.model: IsolationForest | None = None
        self._load_or_train()

    def _load_or_train(self):
        """Load existing model or train a new one."""
        if MODEL_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                return
            except Exception:
                pass
        self._train_model()

    def _train_model(self):
        """Train on synthetic normal operating data."""
        np.random.seed(42)
        n_samples = 10000

        # Normal operating conditions
        temperature = np.random.normal(35, 8, n_samples)  # 35°C ± 8
        voltage = np.random.normal(3.7, 0.3, n_samples)   # 3.7V ± 0.3
        gas_ppm = np.random.normal(5, 3, n_samples)       # 5 ppm ± 3
        vibration = np.random.normal(3, 1.5, n_samples)   # 3 Hz ± 1.5
        load = np.random.normal(50, 15, n_samples)        # 50% ± 15

        # Clip to realistic ranges
        temperature = np.clip(temperature, 15, 60)
        voltage = np.clip(voltage, 2.5, 4.2)
        gas_ppm = np.clip(gas_ppm, 0, 20)
        vibration = np.clip(vibration, 0, 8)
        load = np.clip(load, 10, 90)

        X = np.column_stack([temperature, voltage, gas_ppm, vibration, load])

        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
        )
        self.model.fit(X)

        # Save model
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)

    def predict_hazard(
        self,
        temperature: float,
        voltage: float,
        gas_ppm: float,
        vibration: float,
        load: float,
    ) -> dict:
        """
        Predict hazard level for given sensor readings.
        
        Returns:
            dict with keys: anomaly_score, hazard_score, fire_probability, level
        """
        features = np.array([[temperature, voltage, gas_ppm, vibration, load]])

        # IsolationForest anomaly score (-1 = anomaly, 1 = normal)
        raw_score = self.model.score_samples(features)[0]
        # Convert to 0-100 scale (lower raw = more anomalous = higher hazard)
        anomaly_score = max(0, min(100, (1 - raw_score) * 50))

        # Rule-based escalation on top of ML
        rule_score = 0.0
        if temperature > 70:
            rule_score += (temperature - 70) * 2
        if temperature > 85:
            rule_score += (temperature - 85) * 5  # exponential danger
        if gas_ppm > 30:
            rule_score += (gas_ppm - 30) * 1.5
        if vibration > 10:
            rule_score += (vibration - 10) * 3

        # Combined hazard score
        hazard_score = min(100, anomaly_score * 0.4 + rule_score * 0.6)

        # Fire probability (sigmoid-like)
        fire_prob = 1 / (1 + np.exp(-(hazard_score - 60) / 10))

        # Level classification
        if hazard_score < 20:
            level = "none"
        elif hazard_score < 40:
            level = "low"
        elif hazard_score < 60:
            level = "medium"
        elif hazard_score < 80:
            level = "high"
        else:
            level = "critical"

        return {
            "anomaly_score": round(float(anomaly_score), 2),
            "hazard_score": round(float(hazard_score), 2),
            "fire_probability": round(float(fire_prob), 4),
            "level": level,
        }


# Singleton instance
_predictor: HazardPredictor | None = None


def get_predictor() -> HazardPredictor:
    global _predictor
    if _predictor is None:
        _predictor = HazardPredictor()
    return _predictor
