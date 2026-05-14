"""Revenue calculation engine."""
from __future__ import annotations

from app.economics.prices import get_price


# Energy cost per kWh (industrial rate)
ENERGY_COST_PER_KWH = 0.08  # USD

# CO2 emission factors (kg CO2 avoided per kg recycled vs virgin mining)
CO2_FACTORS = {
    "lead": 2.8,
    "copper": 4.5,
    "aluminum": 9.7,  # aluminum recycling saves massive energy
    "cobalt": 6.2,
    "lithium": 5.1,
    "nickel": 4.8,
    "plastic": 1.5,
}


def calculate_recovery_revenue(material: str, quantity_kg: float, purity: float = 0.95) -> float:
    """Calculate revenue from recovered material."""
    price_per_kg = get_price(material)
    # Purity discount: lower purity = lower price
    purity_factor = 0.7 + (purity * 0.3)  # at 95% purity → 0.985 factor
    return round(quantity_kg * price_per_kg * purity_factor, 2)


def calculate_energy_cost(kwh: float) -> float:
    """Calculate energy cost."""
    return round(kwh * ENERGY_COST_PER_KWH, 2)


def calculate_co2_avoided(material: str, quantity_kg: float) -> float:
    """Calculate CO2 avoided by recycling vs virgin mining."""
    factor = CO2_FACTORS.get(material, 3.0)
    return round(quantity_kg * factor, 2)


def calculate_net_margin(revenue: float, energy_kwh: float, labor_per_hour: float = 45.0, hours: float = 1.0) -> dict:
    """Calculate net margin for a period."""
    energy_cost = calculate_energy_cost(energy_kwh)
    labor_cost = labor_per_hour * hours
    consumables = revenue * 0.05  # 5% of revenue for consumables
    total_cost = energy_cost + labor_cost + consumables
    net = revenue - total_cost
    margin_pct = (net / revenue * 100) if revenue > 0 else 0

    return {
        "gross_revenue": round(revenue, 2),
        "energy_cost": round(energy_cost, 2),
        "labor_cost": round(labor_cost, 2),
        "consumables": round(consumables, 2),
        "total_cost": round(total_cost, 2),
        "net_profit": round(net, 2),
        "margin_percent": round(margin_pct, 1),
    }
