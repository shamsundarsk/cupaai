"""Causal sensor simulation — every number traces to a physical cause."""
from __future__ import annotations

import random
import math
from app.schemas import StationId, SensorReading


# Base operating parameters per station
STATION_DEFAULTS: dict[str, dict] = {
    StationId.INTAKE: {"temp": 28, "vib": 1.0, "gas": 5, "speed": 0.8, "load": 30, "power": 2.0},
    StationId.INSPECTION: {"temp": 26, "vib": 0.5, "gas": 3, "speed": 0.0, "load": 20, "power": 1.5},
    StationId.SORTING: {"temp": 30, "vib": 2.0, "gas": 4, "speed": 1.0, "load": 40, "power": 3.0},
    StationId.CONVEYOR_A: {"temp": 32, "vib": 3.0, "gas": 2, "speed": 1.2, "load": 50, "power": 4.5},
    StationId.CONVEYOR_B: {"temp": 32, "vib": 3.0, "gas": 2, "speed": 1.2, "load": 50, "power": 4.5},
    StationId.SHREDDER: {"temp": 55, "vib": 8.0, "gas": 15, "speed": 0.0, "load": 60, "power": 75.0},
    StationId.MAGNETIC_SEP: {"temp": 35, "vib": 2.5, "gas": 3, "speed": 0.6, "load": 45, "power": 8.0},
    StationId.DENSITY_SEP: {"temp": 33, "vib": 2.0, "gas": 4, "speed": 0.4, "load": 40, "power": 6.0},
    StationId.LEAD_FURNACE: {"temp": 450, "vib": 4.0, "gas": 35, "speed": 0.0, "load": 70, "power": 180.0},
    StationId.LITHIUM_RECOVERY: {"temp": 60, "vib": 1.5, "gas": 20, "speed": 0.0, "load": 55, "power": 45.0},
    StationId.COPPER_RECOVERY: {"temp": 55, "vib": 1.5, "gas": 12, "speed": 0.0, "load": 50, "power": 35.0},
    StationId.PLASTIC_LINE: {"temp": 180, "vib": 5.0, "gas": 25, "speed": 0.3, "load": 45, "power": 55.0},
    StationId.HAZARD_ISOLATION: {"temp": 25, "vib": 0.0, "gas": 2, "speed": 0.0, "load": 0, "power": 0.5},
    StationId.STORAGE: {"temp": 22, "vib": 0.0, "gas": 1, "speed": 0.0, "load": 20, "power": 0.3},
}


def noise(base: float, pct: float = 0.05) -> float:
    """Add realistic noise to a value."""
    return base * (1 + random.uniform(-pct, pct))


def generate_sensor_reading(
    station_id: StationId,
    load_factor: float = 1.0,
    stress_factor: float = 1.0,
    hazard_nearby: bool = False,
) -> SensorReading:
    """
    Generate a causally-linked sensor reading.
    
    load_factor: 0.0-2.0, how loaded the station is (affects temp, vibration)
    stress_factor: 1.0-3.0, abnormal stress (machine wear, overload)
    hazard_nearby: if a hazardous battery is near, gas levels spike
    """
    defaults = STATION_DEFAULTS.get(station_id, STATION_DEFAULTS[StationId.INTAKE])
    
    # Causal chain: load → temperature → vibration → gas
    effective_load = defaults["load"] * load_factor
    temp_rise = (effective_load / 100) * 15 * stress_factor
    temp = noise(defaults["temp"] + temp_rise, 0.03)
    
    vib_base = defaults["vib"] * load_factor * stress_factor
    vib = noise(vib_base, 0.08)
    
    gas_base = defaults["gas"]
    if hazard_nearby:
        gas_base *= 3.5
    if temp > defaults["temp"] * 1.5:
        gas_base *= 1.8  # overheating produces more gas
    gas = noise(gas_base, 0.1)
    
    speed = noise(defaults["speed"] * (0.9 + 0.1 * load_factor), 0.02)
    power = noise(defaults["power"] * load_factor * stress_factor, 0.04)
    
    return SensorReading(
        station_id=station_id,
        temperature_c=round(max(temp, 15.0), 1),
        vibration_hz=round(max(vib, 0.0), 2),
        gas_ppm=round(max(gas, 0.0), 1),
        conveyor_speed_ms=round(max(speed, 0.0), 2),
        load_percent=round(min(max(effective_load, 0.0), 100.0), 1),
        power_kw=round(max(power, 0.0), 2),
    )
