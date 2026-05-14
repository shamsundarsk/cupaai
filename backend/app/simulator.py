"""State-driven plant simulator for UrbanMine Twin AI.

Materials flow through the plant as live tokens. A token only moves to its
next node when:
    1. its current node finished processing it (progress == 100%);
    2. the next node has free capacity;
    3. no critical hazard has been raised for that token.

Telemetry is causally connected — load drives temperature, temperature and
load drive vibration, and overheating drives gas levels — so the twin feels
operationally believable.
"""

from __future__ import annotations

import asyncio
import itertools
import math
import random
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Deque, Dict, List, Optional, Tuple

from .hazard_engine import HazardEngine, HazardInput
from .models import (
    AlertView,
    EventView,
    NodeView,
    RecoveryView,
    Snapshot,
    SustainabilityView,
    TokenView,
)
from .plant_config import (
    CONVEYORS,
    ISOLATION_NODE,
    MATERIAL_TYPES,
    NODES,
    RECOVERY_YIELDS,
    NodeSpec,
    all_nodes,
    node_by_id,
)


TICK_HZ = 4                  # snapshots per second
TICK_DT = 1.0 / TICK_HZ      # seconds per tick
MAX_TOKENS_LIVE = 28         # cap so the floor stays readable
HAZARD_RISK_THRESHOLD = 0.78 # risk score above which we isolate


# --------------------------------------------------------------------------- #
# Internal data classes                                                       #
# --------------------------------------------------------------------------- #
@dataclass
class Token:
    id: str
    type: str
    type_label: str
    color: str
    icon: str
    path: List[str]
    path_idx: int = 0           # index into path
    state: str = "queued"       # queued | processing | transfer | isolated | done
    progress: float = 0.0       # 0..1 within current node
    process_secs: float = 6.0
    process_elapsed: float = 0.0

    # Per-token telemetry (used by the AI hazard engine)
    temperature: float = 38.0
    voltage: float = 12.0
    gas_level: float = 10.0
    risk_score: float = 0.0
    risk_level: str = "LOW"
    isolated: bool = False
    hazard_alerted: bool = False

    @property
    def current_node(self) -> str:
        return self.path[self.path_idx] if self.path_idx < len(self.path) else "storage"

    @property
    def next_node(self) -> Optional[str]:
        if self.path_idx + 1 < len(self.path):
            return self.path[self.path_idx + 1]
        return None


@dataclass
class NodeState:
    spec: NodeSpec
    queue: Deque[Token] = field(default_factory=deque)
    active: List[Token] = field(default_factory=list)
    temperature: float = 0.0
    vibration: float = 0.0
    rpm: float = 0.0
    throughput: float = 0.0
    machine_health: float = 100.0
    risk_score: float = 0.0
    status: str = "idle"          # idle / running / warning / danger
    processed_total: int = 0

    def __post_init__(self) -> None:
        self.temperature = self.spec.base_temp


# --------------------------------------------------------------------------- #
# Simulator                                                                   #
# --------------------------------------------------------------------------- #
class PlantSimulator:
    def __init__(self) -> None:
        self.engine = HazardEngine()
        self.nodes: Dict[str, NodeState] = {
            n.id: NodeState(spec=n) for n in all_nodes()
        }

        self.tokens: Dict[str, Token] = {}
        self.completed_tokens: List[Token] = []
        self.alerts: Deque[AlertView] = deque(maxlen=40)
        self.events: Deque[EventView] = deque(maxlen=80)

        # Aggregate counters
        self.recovery = {
            "lead_kg": 0.0,
            "lithium_kg": 0.0,
            "copper_kg": 0.0,
            "cobalt_kg": 0.0,
            "plastic_kg": 0.0,
            "total_processed": 0,
            "efficiency": 0.0,
        }
        self.sustainability = {
            "carbon_saved_tons": 0.0,
            "waste_diverted_tons": 0.0,
            "energy_consumption_mwh": 0.0,
            "hazards_prevented": 0,
            "recovery_efficiency": 0.0,
        }

        self.tick = 0
        self._token_seq = itertools.count(1)
        self._intake_accumulator = 0.0
        self._last_intake_at = 0.0
        self._scripted_demo_fired = False

        # Seed a couple of tokens so the dashboard has motion immediately.
        for _ in range(4):
            self._spawn_token()
        self._log_event("Plant cold-started. Operational twin online.", kind="system")

    # ------------------------------------------------------------------ #
    # Public lifecycle                                                   #
    # ------------------------------------------------------------------ #
    async def run_forever(self) -> None:
        """Background tick loop."""
        while True:
            try:
                self.step()
            except Exception as exc:  # pragma: no cover - defensive
                self._log_event(f"Simulator tick error: {exc}", kind="system")
            await asyncio.sleep(TICK_DT)

    def step(self) -> None:
        self.tick += 1
        dt = TICK_DT

        self._maybe_intake(dt)
        self._update_node_telemetry(dt)
        self._update_tokens(dt)
        self._maybe_fire_demo_hazard()
        self._recompute_aggregates()

    def snapshot(self) -> Snapshot:
        node_views = [self._node_view(n) for n in self.nodes.values()]
        token_views = [self._token_view(t) for t in self.tokens.values()]

        plant_status = "nominal"
        if any(n.status == "danger" for n in self.nodes.values()):
            plant_status = "critical"
        elif any(n.status == "warning" for n in self.nodes.values()):
            plant_status = "warning"

        return Snapshot(
            tick=self.tick,
            timestamp=datetime.now(timezone.utc).isoformat(),
            nodes=node_views,
            conveyors=list(CONVEYORS),
            tokens=token_views,
            alerts=list(self.alerts)[-12:][::-1],
            events=list(self.events)[-30:][::-1],
            recovery=RecoveryView(**self.recovery),
            sustainability=SustainabilityView(**self.sustainability),
            plant_status=plant_status,
            isolation_node_id=ISOLATION_NODE.id,
        )

    # ------------------------------------------------------------------ #
    # Intake                                                             #
    # ------------------------------------------------------------------ #
    def _maybe_intake(self, dt: float) -> None:
        # Roughly one new token every 2.2s, jittered.
        self._intake_accumulator += dt
        rate = 2.2 + random.uniform(-0.4, 0.4)
        if self._intake_accumulator >= rate and len(self.tokens) < MAX_TOKENS_LIVE:
            self._intake_accumulator = 0.0
            token = self._spawn_token()
            self._log_event(
                f"Intake received {token.type_label} {token.id}.",
                kind="intake",
            )

    def _spawn_token(self) -> Token:
        type_key = random.choices(
            list(MATERIAL_TYPES.keys()),
            weights=[35, 18, 18, 10, 14, 5],  # li-ion biased; hazards rare
            k=1,
        )[0]
        spec = MATERIAL_TYPES[type_key]
        token_id = f"UM-{next(self._token_seq):04d}"

        # Hazardous-mixed tokens start hot and gassy.
        is_hazard = type_key == "hazard_mixed"
        token = Token(
            id=token_id,
            type=type_key,
            type_label=spec["label"],
            color=spec["color"],
            icon=spec["icon"],
            path=list(spec["path"]),
            temperature=random.uniform(60, 75) if is_hazard else random.uniform(28, 42),
            voltage=random.uniform(10.8, 11.4) if is_hazard else random.uniform(11.7, 12.4),
            gas_level=random.uniform(35, 55) if is_hazard else random.uniform(5, 18),
            process_secs=node_by_id(spec["path"][0]).process_seconds,
        )
        self.tokens[token.id] = token
        self.nodes[token.current_node].queue.append(token)
        return token

    # ------------------------------------------------------------------ #
    # Telemetry                                                          #
    # ------------------------------------------------------------------ #
    def _update_node_telemetry(self, dt: float) -> None:
        for state in self.nodes.values():
            spec = state.spec
            load_pct = 100.0 * len(state.active) / max(spec.capacity, 1)

            # Causal telemetry: load → temperature → vibration; gas tracks heat.
            target_temp = spec.base_temp + 0.55 * load_pct + random.uniform(-1.5, 1.5)
            state.temperature += (target_temp - state.temperature) * 0.18

            target_vib = 0.5 + 0.06 * load_pct + 0.04 * max(0, state.temperature - spec.base_temp)
            state.vibration += (target_vib - state.vibration) * 0.25
            state.vibration = max(0.0, state.vibration + random.uniform(-0.15, 0.15))

            target_rpm = 0.0 if not state.active else 1500 + 30 * load_pct
            state.rpm += (target_rpm - state.rpm) * 0.2

            state.throughput = round(state.processed_total / max(self.tick * TICK_DT, 1.0) * 60.0, 2)

            # Slow drift on machine health when overloaded.
            if load_pct > 90 or state.temperature > spec.base_temp + 60:
                state.machine_health = max(70.0, state.machine_health - 0.05)

            # AI hazard score for the node itself
            machine_voltage = 0.0
            gas_proxy = max(0.0, state.temperature - spec.base_temp - 20) * 1.2
            score = self.engine.score(HazardInput(
                temperature=state.temperature,
                voltage=machine_voltage,
                gas_level=gas_proxy,
                vibration=state.vibration,
                machine_load=load_pct,
            ))
            state.risk_score = round(score.risk_score, 3)
            if score.risk_score >= 0.78:
                state.status = "danger"
            elif score.risk_score >= 0.5 or load_pct > 85:
                state.status = "warning"
            elif state.active:
                state.status = "running"
            else:
                state.status = "idle"

    # ------------------------------------------------------------------ #
    # Tokens                                                             #
    # ------------------------------------------------------------------ #
    def _update_tokens(self, dt: float) -> None:
        # 1. Pull queued tokens into active processing if capacity allows.
        for state in self.nodes.values():
            while state.queue and len(state.active) < state.spec.capacity:
                token = state.queue.popleft()
                token.state = "processing"
                token.progress = 0.0
                token.process_elapsed = 0.0
                token.process_secs = max(2.0, state.spec.process_seconds + random.uniform(-1, 1))
                state.active.append(token)

        # 2. Advance progress + telemetry for every active token.
        for state in list(self.nodes.values()):
            for token in list(state.active):
                token.process_elapsed += dt
                token.progress = min(1.0, token.process_elapsed / token.process_secs)

                self._update_token_telemetry(token, state, dt)

                # 3. Hazard check — possibly reroute to isolation.
                if (
                    not token.isolated
                    and token.risk_score >= HAZARD_RISK_THRESHOLD
                    and token.current_node != ISOLATION_NODE.id
                    and token.current_node in {"intake", "inspection", "discharge", "dismantle"}
                ):
                    self._isolate(token, state)
                    continue

                # 4. Move on completion (state-driven).
                if token.progress >= 1.0:
                    self._advance_token(token, state)

    def _update_token_telemetry(self, token: Token, state: NodeState, dt: float) -> None:
        spec = state.spec

        # Heating profile depends on the stage.
        heat_factor = {
            "intake": 0.05,
            "inspection": 0.15,
            "discharge": -0.25,            # cells cool while discharging
            "dismantle": 0.05,
            "shredder": 0.6,
            "magnetic": 0.1,
            "density": 0.05,
            "chemical": 0.7,
            "lead": 1.2,
            "recovery": 0.4,
            "plastic": 0.5,
            "storage": -0.4,
            "isolation": -0.6,
        }.get(spec.id, 0.1)

        target_temp = spec.base_temp + heat_factor * 60 + random.uniform(-1.5, 1.5)
        # Hazardous tokens spike harder.
        if token.type == "hazard_mixed":
            target_temp += 25
        token.temperature += (target_temp - token.temperature) * 0.22

        # Voltage sags slowly during discharging, recovers in storage.
        if spec.id == "discharge":
            token.voltage = max(0.5, token.voltage - 0.18 * dt)
        elif spec.id == "storage":
            token.voltage = 0.0  # cells fully spent post-recovery

        # Gas level scales with abnormal heat.
        excess = max(0.0, token.temperature - 55)
        token.gas_level = min(100.0, 8 + 1.4 * excess + random.uniform(-2, 2))

        # AI hazard score for the token.
        load_pct = 100.0 * len(state.active) / max(spec.capacity, 1)
        score = self.engine.score(HazardInput(
            temperature=token.temperature,
            voltage=token.voltage if token.voltage > 0 else 0,
            gas_level=token.gas_level,
            vibration=state.vibration,
            machine_load=load_pct,
        ))
        token.risk_score = round(score.risk_score, 3)
        token.risk_level = score.risk_level

    def _advance_token(self, token: Token, state: NodeState) -> None:
        next_id = token.next_node
        # End of pipeline → finalize and book recovery.
        if next_id is None or token.path_idx >= len(token.path) - 1:
            state.active.remove(token)
            state.processed_total += 1
            token.state = "done"
            token.progress = 1.0
            self._book_recovery(token)
            self._log_event(
                f"{token.type_label} {token.id} finished at {state.spec.short}.",
                kind="recovery",
            )
            self.completed_tokens.append(token)
            self.tokens.pop(token.id, None)
            return

        next_state = self.nodes[next_id]
        # State-driven gate: only move when the next node has capacity.
        if len(next_state.active) + len(next_state.queue) >= next_state.spec.capacity * 2:
            token.state = "transfer"
            token.progress = 1.0
            return

        state.active.remove(token)
        state.processed_total += 1
        token.path_idx += 1
        token.progress = 0.0
        token.process_elapsed = 0.0
        token.state = "queued"
        next_state.queue.append(token)

    def _isolate(self, token: Token, state: NodeState) -> None:
        if token in state.active:
            state.active.remove(token)
        elif token in state.queue:
            state.queue.remove(token)

        token.isolated = True
        token.state = "isolated"
        token.progress = 0.0
        token.process_elapsed = 0.0
        token.path = [token.current_node, ISOLATION_NODE.id]
        token.path_idx = 1

        self.nodes[ISOLATION_NODE.id].queue.append(token)
        self.sustainability["hazards_prevented"] += 1

        self._raise_alert(
            severity="danger",
            title="Thermal Runaway Risk",
            message=(
                f"{token.type_label} {token.id} risk score "
                f"{token.risk_score:.2f}. Rerouted to isolation."
            ),
            node_id=ISOLATION_NODE.id,
            token_id=token.id,
        )
        self._log_event(
            f"⚠ {token.id} isolated from {state.spec.short} (risk {token.risk_score:.2f}).",
            kind="isolation",
        )

    def _book_recovery(self, token: Token) -> None:
        if token.isolated:
            # Hazardous tokens contribute to "diverted" mass but no recovery.
            self.sustainability["waste_diverted_tons"] += 0.012
            return

        yields = RECOVERY_YIELDS.get(token.type, {})
        # Efficiency drops a bit with current plant temperature.
        avg_temp = sum(n.temperature for n in self.nodes.values()) / len(self.nodes)
        eff = max(0.78, 0.96 - max(0.0, (avg_temp - 60) / 200))

        self.recovery["lead_kg"]    += yields.get("lead",    0.0) * eff
        self.recovery["lithium_kg"] += yields.get("lithium", 0.0) * eff
        self.recovery["copper_kg"]  += yields.get("copper",  0.0) * eff
        self.recovery["cobalt_kg"]  += yields.get("cobalt",  0.0) * eff
        self.recovery["plastic_kg"] += yields.get("plastic", 0.0) * eff
        self.recovery["total_processed"] += 1
        self.recovery["efficiency"] = round(eff * 100, 1)

        # Sustainability accruals (rough but believable per-token gains).
        self.sustainability["carbon_saved_tons"]    += 0.018
        self.sustainability["waste_diverted_tons"]  += 0.022
        self.sustainability["energy_consumption_mwh"] += 0.004
        self.sustainability["recovery_efficiency"]  = self.recovery["efficiency"]

    # ------------------------------------------------------------------ #
    # Alerts / events / aggregates                                       #
    # ------------------------------------------------------------------ #
    def _raise_alert(
        self,
        *,
        severity: str,
        title: str,
        message: str,
        node_id: Optional[str] = None,
        token_id: Optional[str] = None,
    ) -> None:
        alert = AlertView(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).isoformat(),
            severity=severity,
            title=title,
            message=message,
            node_id=node_id,
            token_id=token_id,
        )
        self.alerts.append(alert)

    def _log_event(self, message: str, *, kind: str = "system") -> None:
        self.events.append(EventView(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).isoformat(),
            message=message,
            kind=kind,
        ))

    def _recompute_aggregates(self) -> None:
        if self.recovery["total_processed"] == 0:
            self.sustainability["recovery_efficiency"] = 0.0

    # Once per session, fire a scripted hazard so the demo story always lands.
    def _maybe_fire_demo_hazard(self) -> None:
        if self._scripted_demo_fired:
            return
        if self.tick < int(8 * TICK_HZ):  # ~8s after start
            return
        self._scripted_demo_fired = True
        # Force a hot battery into inspection so the isolation arc is visible.
        spec = MATERIAL_TYPES["li_ion"]
        token = Token(
            id=f"EV-{random.randint(400, 499):03d}",
            type="li_ion",
            type_label="Li-Ion Battery",
            color=spec["color"],
            icon="🔥",
            path=list(spec["path"]),
            temperature=86.0,
            voltage=11.1,
            gas_level=58.0,
            process_secs=node_by_id(spec["path"][0]).process_seconds,
        )
        self.tokens[token.id] = token
        self.nodes[token.current_node].queue.append(token)
        self._log_event(
            f"Damaged {token.type_label} {token.id} flagged at intake.",
            kind="intake",
        )

    # ------------------------------------------------------------------ #
    # View building                                                      #
    # ------------------------------------------------------------------ #
    def _node_view(self, state: NodeState) -> NodeView:
        progresses = [t.progress for t in state.active]
        avg_progress = round(sum(progresses) / len(progresses) * 100, 1) if progresses else 0.0
        return NodeView(
            id=state.spec.id,
            label=state.spec.label,
            short=state.spec.short,
            icon=state.spec.icon,
            position=state.spec.position,
            capacity=state.spec.capacity,
            queue_length=len(state.queue),
            active_count=len(state.active),
            avg_progress=avg_progress,
            temperature=round(state.temperature, 1),
            vibration=round(state.vibration, 2),
            rpm=round(state.rpm, 0),
            throughput=state.throughput,
            machine_health=round(state.machine_health, 1),
            risk_score=state.risk_score,
            status=state.status,
        )

    def _token_view(self, token: Token) -> TokenView:
        return TokenView(
            id=token.id,
            type=token.type,
            type_label=token.type_label,
            color=token.color,
            icon=token.icon,
            current_node=token.current_node,
            next_node=token.next_node,
            state=token.state,
            progress=round(token.progress * 100, 1),
            temperature=round(token.temperature, 1),
            voltage=round(token.voltage, 2),
            gas_level=round(token.gas_level, 1),
            risk_score=token.risk_score,
            risk_level=token.risk_level,
            isolated=token.isolated,
        )
