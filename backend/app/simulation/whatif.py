"""What-If Scenario Engine — test parameter changes before applying them."""
from __future__ import annotations

import copy
from app.simulator.plant import PlantSimulator


def run_whatif_scenario(
    plant: PlantSimulator,
    modifications: dict,
    ticks_ahead: int = 120,
) -> dict:
    """
    Clone plant, apply modifications, simulate forward, compare to baseline.
    
    Args:
        plant: Current live plant
        modifications: Dict of changes to apply, e.g.:
            - conveyor_speed_factor: 0.5 to 2.0 (multiplier)
            - intake_rate_factor: 0.5 to 2.0
            - furnace_temp_factor: 0.8 to 1.2
            - shredder_load_limit: 50 to 100 (%)
            - shutdown_station: station_id to disable
        ticks_ahead: Simulation horizon
    
    Returns:
        Comparison of baseline vs. modified scenario
    """
    # Run baseline (no changes)
    baseline_clone = copy.deepcopy(plant)
    baseline_results = _simulate_forward(baseline_clone, ticks_ahead, {})
    
    # Run modified scenario
    modified_clone = copy.deepcopy(plant)
    modified_results = _simulate_forward(modified_clone, ticks_ahead, modifications)
    
    # Calculate deltas
    revenue_delta = modified_results['total_revenue'] - baseline_results['total_revenue']
    recovery_delta = modified_results['total_recovery'] - baseline_results['total_recovery']
    energy_delta = modified_results['total_energy'] - baseline_results['total_energy']
    risk_delta = modified_results['avg_risk'] - baseline_results['avg_risk']
    waste_delta = modified_results['waste_generated'] - baseline_results['waste_generated']
    
    # Determine if modification is beneficial
    score = 0
    if revenue_delta > 0: score += 1
    if recovery_delta > 0: score += 1
    if energy_delta < 0: score += 1  # less energy = better
    if risk_delta < 0: score += 1    # less risk = better
    if waste_delta < 0: score += 1   # less waste = better
    
    recommendation = 'recommended' if score >= 3 else 'neutral' if score >= 2 else 'not_recommended'
    
    return {
        'modifications_applied': modifications,
        'simulation_ticks': ticks_ahead,
        
        'baseline': baseline_results,
        'modified': modified_results,
        
        'deltas': {
            'revenue_usd': round(revenue_delta, 2),
            'recovery_kg': round(recovery_delta, 2),
            'energy_kwh': round(energy_delta, 2),
            'risk_score': round(risk_delta, 1),
            'waste_kg': round(waste_delta, 2),
        },
        
        'recommendation': recommendation,
        'benefit_score': score,
        
        'summary': _generate_summary(modifications, revenue_delta, recovery_delta, energy_delta, risk_delta, waste_delta),
    }


def _simulate_forward(plant: PlantSimulator, ticks: int, modifications: dict) -> dict:
    """Run simulation forward with optional modifications."""
    
    # Apply modifications to plant parameters
    conveyor_factor = modifications.get('conveyor_speed_factor', 1.0)
    intake_factor = modifications.get('intake_rate_factor', 1.0)
    shutdown_station = modifications.get('shutdown_station', None)
    
    # Modify batch interval based on intake rate
    if intake_factor != 1.0:
        plant._batch_interval = max(5, int(plant._batch_interval / intake_factor))
    
    start_revenue = sum(plant.revenue_totals.values())
    start_recovery = sum(plant.recovery_totals.values())
    start_energy = plant.total_energy_kwh
    
    risk_values = []
    hazard_count = 0
    waste_generated = 0
    
    for i in range(ticks):
        # Apply per-tick modifications
        if shutdown_station:
            # Remove batteries from shutdown station
            plant.batteries = [b for b in plant.batteries if b.current_station.value != shutdown_station]
        
        telemetry = plant.tick()
        risk_values.append(plant.plant_risk_score)
        
        if len(telemetry.hazard_alerts) > 0:
            hazard_count += 1
    
    end_revenue = sum(plant.revenue_totals.values())
    end_recovery = sum(plant.recovery_totals.values())
    end_energy = plant.total_energy_kwh
    
    total_recovery = end_recovery - start_recovery
    # Waste = items that went through but weren't recovered (estimate ~8% waste rate)
    waste_generated = total_recovery * 0.08
    
    return {
        'total_revenue': round(end_revenue - start_revenue, 2),
        'total_recovery': round(total_recovery, 2),
        'total_energy': round(end_energy - start_energy, 2),
        'avg_risk': round(sum(risk_values) / len(risk_values) if risk_values else 0, 1),
        'peak_risk': round(max(risk_values) if risk_values else 0, 1),
        'hazard_events': hazard_count,
        'waste_generated': round(waste_generated, 2),
    }


def _generate_summary(mods: dict, rev: float, rec: float, energy: float, risk: float, waste: float) -> str:
    """Generate human-readable summary of what-if results."""
    parts = []
    
    if 'conveyor_speed_factor' in mods:
        factor = mods['conveyor_speed_factor']
        parts.append(f"Conveyor speed {'increased' if factor > 1 else 'decreased'} to {factor*100:.0f}%")
    
    if 'intake_rate_factor' in mods:
        factor = mods['intake_rate_factor']
        parts.append(f"Intake rate {'increased' if factor > 1 else 'decreased'} to {factor*100:.0f}%")
    
    if 'shutdown_station' in mods:
        parts.append(f"Station '{mods['shutdown_station']}' shut down for maintenance")
    
    mod_desc = '. '.join(parts) + '.' if parts else 'No modifications.'
    
    impacts = []
    if rev > 0:
        impacts.append(f"revenue +${rev:.2f}")
    elif rev < 0:
        impacts.append(f"revenue -${abs(rev):.2f}")
    
    if risk < -5:
        impacts.append(f"risk reduced by {abs(risk):.0f} points")
    elif risk > 5:
        impacts.append(f"risk increased by {risk:.0f} points")
    
    if waste < 0:
        impacts.append(f"waste reduced by {abs(waste):.1f} kg")
    
    impact_desc = ', '.join(impacts) if impacts else 'minimal impact'
    
    return f"{mod_desc} Impact: {impact_desc}."
