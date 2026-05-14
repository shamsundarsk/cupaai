"""Pydantic models shared across the backend."""
from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import time


# --- Enums ---

class MaterialType(str, Enum):
    LEAD_ACID = "lead_acid"
    LITHIUM_ION = "lithium_ion"
    PCB = "pcb"
    COPPER_HEAVY = "copper_heavy"
    PLASTIC = "plastic"
    HAZARDOUS = "hazardous"
    NON_RECYCLABLE = "non_recyclable"


class StationId(str, Enum):
    INTAKE = "intake"
    INSPECTION = "inspection"
    SORTING = "sorting"
    CONVEYOR_A = "conveyor_a"
    CONVEYOR_B = "conveyor_b"
    SHREDDER = "shredder"
    MAGNETIC_SEP = "magnetic_sep"
    DENSITY_SEP = "density_sep"
    LEAD_FURNACE = "lead_furnace"
    LITHIUM_RECOVERY = "lithium_recovery"
    COPPER_RECOVERY = "copper_recovery"
    PLASTIC_LINE = "plastic_line"
    HAZARD_ISOLATION = "hazard_isolation"
    STORAGE = "storage"


class StationState(str, Enum):
    IDLE = "idle"
    PROCESSING = "processing"
    FAULTED = "faulted"
    MAINTENANCE = "maintenance"


class HazardLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RouteDecision(str, Enum):
    DISMANTLING = "dismantling"
    SHREDDING = "shredding"
    LEAD_FURNACE = "lead_furnace"
    LITHIUM_RECOVERY = "lithium_recovery"
    COPPER_RECOVERY = "copper_recovery"
    PLASTIC_LINE = "plastic_line"
    HAZARD_ISOLATION = "hazard_isolation"
    DISPOSAL = "disposal"


# --- Sensor Data ---

class SensorReading(BaseModel):
    station_id: StationId
    temperature_c: float = 0.0
    vibration_hz: float = 0.0
    gas_ppm: float = 0.0
    conveyor_speed_ms: float = 0.0
    load_percent: float = 0.0
    power_kw: float = 0.0
    timestamp: float = Field(default_factory=time.time)


# --- Battery Object ---

class BatteryItem(BaseModel):
    id: str
    material_type: MaterialType
    weight_kg: float
    health: str = "normal"  # normal, degraded, damaged
    temperature_c: float = 25.0
    voltage_v: float = 3.7
    gas_ppm: float = 0.0
    current_station: StationId = StationId.INTAKE
    route: Optional[RouteDecision] = None
    hazard_score: float = 0.0
    entered_at: float = Field(default_factory=time.time)
    lead_content_kg: float = 0.0
    lithium_content_kg: float = 0.0
    copper_content_kg: float = 0.0
    cobalt_content_kg: float = 0.0
    plastic_content_kg: float = 0.0


# --- Hazard Alert ---

class HazardAlert(BaseModel):
    battery_id: str
    station_id: StationId
    hazard_level: HazardLevel
    hazard_score: float
    message: str
    timestamp: float = Field(default_factory=time.time)


# --- Recovery Record ---

class RecoveryRecord(BaseModel):
    material: str  # lead, lithium, copper, cobalt, aluminum, plastic
    quantity_kg: float
    purity_percent: float
    revenue_usd: float
    timestamp: float = Field(default_factory=time.time)


# --- Plant Telemetry (full state pushed over WS) ---

class PlantTelemetry(BaseModel):
    tick: int
    sim_time: float
    shift_elapsed_s: float
    stations: dict[str, StationState]
    sensors: list[SensorReading]
    batteries_in_system: list[BatteryItem]
    hazard_alerts: list[HazardAlert]
    recovery_totals: dict[str, float]  # material -> kg
    revenue_totals: dict[str, float]  # material -> $
    total_revenue_usd: float
    total_co2_avoided_kg: float
    total_landfill_diverted_kg: float
    total_energy_kwh: float
    plant_risk_score: float
    events: list[str]  # recent event log messages
    total_input_weight_kg: float = 0.0
    total_waste_kg: float = 0.0
    total_items_entered: int = 0
    total_items_completed: int = 0
