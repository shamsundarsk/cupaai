"""Pydantic models for the WebSocket payload schema.

The frontend consumes a single periodic snapshot of the entire twin so the
state-driven simulator can stay simple while still feeling alive.
"""

from __future__ import annotations

from typing import Dict, List, Literal, Optional, Tuple

from pydantic import BaseModel, Field


class NodeView(BaseModel):
    id: str
    label: str
    short: str
    icon: str
    position: Tuple[float, float]
    capacity: int
    queue_length: int = 0
    active_count: int = 0
    avg_progress: float = 0.0
    temperature: float = 0.0
    vibration: float = 0.0
    rpm: float = 0.0
    throughput: float = 0.0
    machine_health: float = 100.0
    risk_score: float = 0.0
    status: Literal["idle", "running", "warning", "danger"] = "idle"


class TokenView(BaseModel):
    id: str
    type: str                 # material type key, e.g. "li_ion"
    type_label: str
    color: str
    icon: str
    current_node: str
    next_node: Optional[str] = None
    state: Literal["queued", "processing", "transfer", "isolated", "done"] = "queued"
    progress: float = 0.0
    temperature: float = 0.0
    voltage: float = 0.0
    gas_level: float = 0.0
    risk_score: float = 0.0
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "LOW"
    isolated: bool = False


class AlertView(BaseModel):
    id: str
    timestamp: str
    severity: Literal["info", "warning", "danger"]
    title: str
    message: str
    node_id: Optional[str] = None
    token_id: Optional[str] = None


class EventView(BaseModel):
    id: str
    timestamp: str
    message: str
    kind: Literal["intake", "process", "hazard", "isolation", "recovery", "system"] = "system"


class RecoveryView(BaseModel):
    lead_kg: float = 0.0
    lithium_kg: float = 0.0
    copper_kg: float = 0.0
    cobalt_kg: float = 0.0
    plastic_kg: float = 0.0
    total_processed: int = 0
    efficiency: float = 0.0


class SustainabilityView(BaseModel):
    carbon_saved_tons: float = 0.0
    waste_diverted_tons: float = 0.0
    energy_consumption_mwh: float = 0.0
    hazards_prevented: int = 0
    recovery_efficiency: float = 0.0


class Snapshot(BaseModel):
    tick: int
    timestamp: str
    nodes: List[NodeView]
    conveyors: List[Tuple[str, str]]
    tokens: List[TokenView]
    alerts: List[AlertView]
    events: List[EventView]
    recovery: RecoveryView
    sustainability: SustainabilityView
    plant_status: Literal["nominal", "warning", "critical"] = "nominal"
    isolation_node_id: str = "isolation"
