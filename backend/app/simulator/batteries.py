"""Battery lifecycle objects with full material composition."""
from __future__ import annotations

import random
import uuid
from app.schemas import BatteryItem, MaterialType, StationId


# Material composition templates (kg per battery type)
COMPOSITION_TEMPLATES = {
    MaterialType.LEAD_ACID: {
        "weight_range": (10.0, 18.0),
        "lead_pct": 0.60,
        "lithium_pct": 0.0,
        "copper_pct": 0.02,
        "cobalt_pct": 0.0,
        "plastic_pct": 0.08,
        "voltage_nominal": 12.6,
        "health_weights": {"normal": 0.70, "degraded": 0.22, "damaged": 0.08},
    },
    MaterialType.LITHIUM_ION: {
        "weight_range": (1.5, 45.0),
        "lead_pct": 0.0,
        "lithium_pct": 0.07,
        "copper_pct": 0.10,
        "cobalt_pct": 0.15,
        "plastic_pct": 0.12,
        "voltage_nominal": 3.7,
        "health_weights": {"normal": 0.60, "degraded": 0.25, "damaged": 0.15},
    },
    MaterialType.PCB: {
        "weight_range": (0.3, 2.0),
        "lead_pct": 0.02,
        "lithium_pct": 0.0,
        "copper_pct": 0.25,
        "cobalt_pct": 0.01,
        "plastic_pct": 0.30,
        "voltage_nominal": 0.0,
        "health_weights": {"normal": 0.85, "degraded": 0.12, "damaged": 0.03},
    },
    MaterialType.COPPER_HEAVY: {
        "weight_range": (2.0, 15.0),
        "lead_pct": 0.01,
        "lithium_pct": 0.0,
        "copper_pct": 0.55,
        "cobalt_pct": 0.0,
        "plastic_pct": 0.15,
        "voltage_nominal": 0.0,
        "health_weights": {"normal": 0.90, "degraded": 0.08, "damaged": 0.02},
    },
    MaterialType.PLASTIC: {
        "weight_range": (0.5, 5.0),
        "lead_pct": 0.0,
        "lithium_pct": 0.0,
        "copper_pct": 0.01,
        "cobalt_pct": 0.0,
        "plastic_pct": 0.85,
        "voltage_nominal": 0.0,
        "health_weights": {"normal": 0.95, "degraded": 0.04, "damaged": 0.01},
    },
    MaterialType.HAZARDOUS: {
        "weight_range": (2.0, 20.0),
        "lead_pct": 0.05,
        "lithium_pct": 0.03,
        "copper_pct": 0.05,
        "cobalt_pct": 0.02,
        "plastic_pct": 0.10,
        "voltage_nominal": 3.2,
        "health_weights": {"normal": 0.10, "degraded": 0.30, "damaged": 0.60},
    },
}

# Intake distribution — what arrives at the plant
INTAKE_DISTRIBUTION = {
    MaterialType.LEAD_ACID: 0.35,
    MaterialType.LITHIUM_ION: 0.25,
    MaterialType.PCB: 0.10,
    MaterialType.COPPER_HEAVY: 0.10,
    MaterialType.PLASTIC: 0.12,
    MaterialType.HAZARDOUS: 0.08,
}


def _weighted_choice(weights: dict) -> str:
    items = list(weights.keys())
    probs = list(weights.values())
    return random.choices(items, weights=probs, k=1)[0]


def spawn_battery(force_type: MaterialType | None = None, force_health: str | None = None) -> BatteryItem:
    """Create a new battery/scrap item entering the plant."""
    mat_type = force_type or _weighted_choice(INTAKE_DISTRIBUTION)
    template = COMPOSITION_TEMPLATES[mat_type]
    
    weight = random.uniform(*template["weight_range"])
    health = force_health or _weighted_choice(template["health_weights"])
    
    # Temperature based on health
    base_temp = 25.0
    if health == "degraded":
        base_temp = random.uniform(30.0, 45.0)
    elif health == "damaged":
        base_temp = random.uniform(40.0, 65.0)
    
    return BatteryItem(
        id=f"B-{uuid.uuid4().hex[:6].upper()}",
        material_type=mat_type,
        weight_kg=round(weight, 2),
        health=health,
        temperature_c=round(base_temp, 1),
        voltage_v=round(template["voltage_nominal"] * random.uniform(0.7, 1.0), 2),
        gas_ppm=round(random.uniform(0, 5), 1),
        current_station=StationId.INTAKE,
        lead_content_kg=round(weight * template["lead_pct"] * random.uniform(0.9, 1.0), 3),
        lithium_content_kg=round(weight * template["lithium_pct"] * random.uniform(0.9, 1.0), 3),
        copper_content_kg=round(weight * template["copper_pct"] * random.uniform(0.9, 1.0), 3),
        cobalt_content_kg=round(weight * template["cobalt_pct"] * random.uniform(0.9, 1.0), 3),
        plastic_content_kg=round(weight * template["plastic_pct"] * random.uniform(0.9, 1.0), 3),
    )


def spawn_batch(size: int = 10) -> list[BatteryItem]:
    """Spawn a batch of incoming scrap items."""
    return [spawn_battery() for _ in range(size)]
