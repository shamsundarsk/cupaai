"""Plant topology for the UrbanMine Twin AI digital twin.

Each node represents an operational stage. The simulator uses these as a
state machine: a material token can only advance to the next node when the
current processing finishes, the next node has capacity, and no critical
hazard has been raised.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Tuple


@dataclass
class NodeSpec:
    id: str
    label: str
    short: str
    icon: str          # emoji used by the UI
    # Position on a virtual 100x60 floor plan grid (used by the floor map)
    position: Tuple[float, float]
    capacity: int = 3            # max parallel processing slots
    process_seconds: float = 6.0 # nominal time to process one item
    base_temp: float = 35.0      # nominal machine temperature
    description: str = ""


# The full operational workflow.
# Order matters: this list IS the default routing path.
NODES: List[NodeSpec] = [
    NodeSpec(
        id="intake",
        label="Scrap Intake",
        short="Intake",
        icon="🚚",
        position=(6, 30),
        capacity=6,
        process_seconds=3.0,
        base_temp=28.0,
        description="Incoming EV batteries and e-waste collection bay.",
    ),
    NodeSpec(
        id="inspection",
        label="Battery Inspection",
        short="Inspection",
        icon="🔍",
        position=(20, 30),
        capacity=4,
        process_seconds=5.5,
        base_temp=42.0,
        description="Visual + thermal + voltage inspection and hazard check.",
    ),
    NodeSpec(
        id="discharge",
        label="Battery Discharge",
        short="Discharge",
        icon="🔋",
        position=(33, 18),
        capacity=3,
        process_seconds=6.0,
        base_temp=38.0,
        description="Controlled discharging of cells before dismantling.",
    ),
    NodeSpec(
        id="dismantle",
        label="Dismantling",
        short="Dismantle",
        icon="🧰",
        position=(33, 42),
        capacity=3,
        process_seconds=5.0,
        base_temp=36.0,
        description="Module disassembly and component separation.",
    ),
    NodeSpec(
        id="shredder",
        label="Shredder & Crusher",
        short="Shredder",
        icon="⚙️",
        position=(48, 30),
        capacity=2,
        process_seconds=5.5,
        base_temp=58.0,
        description="High-RPM shredding and crushing line.",
    ),
    NodeSpec(
        id="magnetic",
        label="Magnetic Separation",
        short="Magnetic",
        icon="🧲",
        position=(60, 18),
        capacity=3,
        process_seconds=4.0,
        base_temp=40.0,
        description="Ferrous metals removed by magnetic separator.",
    ),
    NodeSpec(
        id="density",
        label="Density / Air Sep.",
        short="Density",
        icon="🌀",
        position=(60, 42),
        capacity=3,
        process_seconds=4.0,
        base_temp=39.0,
        description="Air-density separation of plastics and light fractions.",
    ),
    NodeSpec(
        id="chemical",
        label="Chemical Separation",
        short="Chem Sep",
        icon="🧪",
        position=(72, 30),
        capacity=2,
        process_seconds=6.5,
        base_temp=72.0,
        description="Hydromet / leaching for non-ferrous fractions.",
    ),
    NodeSpec(
        id="lead",
        label="Lead Furnace",
        short="Lead",
        icon="🏭",
        position=(84, 12),
        capacity=2,
        process_seconds=7.0,
        base_temp=180.0,
        description="Pyrometallurgical lead extraction unit.",
    ),
    NodeSpec(
        id="recovery",
        label="Li / Co / Cu Recovery",
        short="Recovery",
        icon="✨",
        position=(84, 30),
        capacity=2,
        process_seconds=6.0,
        base_temp=68.0,
        description="Lithium, cobalt and copper recovery line.",
    ),
    NodeSpec(
        id="plastic",
        label="Plastic Recycling",
        short="Plastic",
        icon="♻️",
        position=(84, 48),
        capacity=2,
        process_seconds=5.0,
        base_temp=70.0,
        description="Plastic pellet extrusion and recycling line.",
    ),
    NodeSpec(
        id="storage",
        label="Final Storage",
        short="Storage",
        icon="📦",
        position=(94, 30),
        capacity=10,
        process_seconds=2.0,
        base_temp=26.0,
        description="Bagged recovered material ready for dispatch.",
    ),
]


# Isolation node sits off the main loop. Hazardous tokens are rerouted here.
ISOLATION_NODE = NodeSpec(
    id="isolation",
    label="Isolation Bay",
    short="Isolation",
    icon="🛡️",
    position=(20, 56),
    capacity=10,
    process_seconds=10.0,
    base_temp=30.0,
    description="Hazard isolation chamber for thermal-runaway risks.",
)


# Conveyor segments connecting nodes (used to draw the floor map).
CONVEYORS: List[Tuple[str, str]] = [
    ("intake",     "inspection"),
    ("inspection", "discharge"),
    ("inspection", "dismantle"),
    ("discharge",  "shredder"),
    ("dismantle",  "shredder"),
    ("shredder",   "magnetic"),
    ("shredder",   "density"),
    ("magnetic",   "chemical"),
    ("density",    "chemical"),
    ("density",    "plastic"),
    ("chemical",   "lead"),
    ("chemical",   "recovery"),
    ("lead",       "storage"),
    ("recovery",   "storage"),
    ("plastic",    "storage"),
]


# Material-type → routing path through the plant. Hazardous batteries
# always go through inspection + discharge, while plastics skip chemistry.
MATERIAL_TYPES = {
    "li_ion": {
        "label": "Li-Ion Battery",
        "color": "#22d3ee",
        "icon": "🔋",
        "path": [
            "intake", "inspection", "discharge", "dismantle",
            "shredder", "magnetic", "chemical", "recovery", "storage",
        ],
    },
    "lead_acid": {
        "label": "Lead-Acid Battery",
        "color": "#f59e0b",
        "icon": "🔋",
        "path": [
            "intake", "inspection", "discharge", "dismantle",
            "shredder", "chemical", "lead", "storage",
        ],
    },
    "pcb": {
        "label": "PCB / E-Waste",
        "color": "#a78bfa",
        "icon": "💾",
        "path": [
            "intake", "inspection", "dismantle", "shredder",
            "magnetic", "chemical", "recovery", "storage",
        ],
    },
    "copper_scrap": {
        "label": "Copper Scrap",
        "color": "#fb923c",
        "icon": "🟫",
        "path": [
            "intake", "inspection", "shredder", "magnetic",
            "chemical", "recovery", "storage",
        ],
    },
    "plastic": {
        "label": "Plastic Waste",
        "color": "#34d399",
        "icon": "♻️",
        "path": [
            "intake", "inspection", "shredder", "density",
            "plastic", "storage",
        ],
    },
    "hazard_mixed": {
        "label": "Hazardous Mixed",
        "color": "#ef4444",
        "icon": "☣️",
        "path": [
            "intake", "inspection", "discharge", "dismantle",
            "shredder", "chemical", "recovery", "storage",
        ],
    },
}


# Recovery yields per material type (kg of output per processed token at
# 100% efficiency). The simulator scales these by recovery efficiency.
RECOVERY_YIELDS = {
    "li_ion":      {"lithium": 1.6, "cobalt": 0.9, "copper": 1.2, "plastic": 0.4},
    "lead_acid":   {"lead": 8.4, "plastic": 0.6},
    "pcb":         {"copper": 2.4, "lithium": 0.1, "cobalt": 0.2, "plastic": 0.5},
    "copper_scrap":{"copper": 6.5, "plastic": 0.2},
    "plastic":     {"plastic": 4.5},
    "hazard_mixed":{"lead": 1.0, "lithium": 0.3, "cobalt": 0.2, "copper": 0.6, "plastic": 0.3},
}


def node_by_id(node_id: str) -> NodeSpec:
    if node_id == ISOLATION_NODE.id:
        return ISOLATION_NODE
    for n in NODES:
        if n.id == node_id:
            return n
    raise KeyError(f"Unknown node {node_id!r}")


def all_nodes() -> List[NodeSpec]:
    return list(NODES) + [ISOLATION_NODE]
