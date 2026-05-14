"""Predictive Simulation Engine — runs the plant forward to forecast outcomes."""
from __future__ import annotations

import copy
from app.simulator.plant import PlantSimulator


def predict_future(plant: PlantSimulator, ticks_ahead: int = 120) -> dict:
    """
    Clone the current plant state and simulate forward to predict outcomes.
    
    Args:
        plant: Current live plant instance
        ticks_ahead: How many ticks to simulate (120 ticks = 60 seconds = ~30 sim-minutes)
    
    Returns:
        Prediction dict with forecasted metrics
    """
    # Deep clone the plant state
    clone = copy.deepcopy(plant)
    
    # Record starting state
    start_revenue = sum(clone.revenue_totals.values())
    start_recovery = sum(clone.recovery_totals.values())
    start_energy = clone.total_energy_kwh
    start_co2 = clone.total_co2_avoided_kg
    start_waste = clone.total_landfill_diverted_kg
    start_hazards = clone.hazards_prevented
    
    # Track per-tick data for trend
    revenue_trajectory = []
    risk_trajectory = []
    hazard_events = 0
    machine_stress_peaks = {}
    
    # Run forward
    for i in range(ticks_ahead):
        telemetry = clone.tick()
        revenue_trajectory.append(sum(clone.revenue_totals.values()))
        risk_trajectory.append(clone.plant_risk_score)
        
        # Track hazard events
        if len(telemetry.hazard_alerts) > 0:
            hazard_events += 1
        
        # Track machine stress
        for sensor in telemetry.sensors:
            sid = sensor.station_id.value if hasattr(sensor.station_id, 'value') else sensor.station_id
            if sid not in machine_stress_peaks:
                machine_stress_peaks[sid] = {'max_temp': 0, 'max_vib': 0, 'max_load': 0}
            machine_stress_peaks[sid]['max_temp'] = max(machine_stress_peaks[sid]['max_temp'], sensor.temperature_c)
            machine_stress_peaks[sid]['max_vib'] = max(machine_stress_peaks[sid]['max_vib'], sensor.vibration_hz)
            machine_stress_peaks[sid]['max_load'] = max(machine_stress_peaks[sid]['max_load'], sensor.load_percent)
    
    # Calculate predictions
    end_revenue = sum(clone.revenue_totals.values())
    end_recovery = sum(clone.recovery_totals.values())
    end_energy = clone.total_energy_kwh
    
    revenue_delta = end_revenue - start_revenue
    recovery_delta = end_recovery - start_recovery
    energy_delta = end_energy - start_energy
    
    # Revenue rate ($/minute)
    sim_minutes = (ticks_ahead / 2) * 0.5  # each tick = 0.5s real, 30s sim
    revenue_rate = revenue_delta / max(sim_minutes, 1) * 60
    
    # Identify at-risk machines
    at_risk_machines = []
    for sid, peaks in machine_stress_peaks.items():
        risk_score = 0
        if peaks['max_temp'] > 80:
            risk_score += 30
        if peaks['max_vib'] > 8:
            risk_score += 25
        if peaks['max_load'] > 85:
            risk_score += 20
        if risk_score > 20:
            at_risk_machines.append({
                'station': sid,
                'risk_score': risk_score,
                'max_temp': round(peaks['max_temp'], 1),
                'max_vibration': round(peaks['max_vib'], 1),
                'max_load': round(peaks['max_load'], 1),
            })
    
    at_risk_machines.sort(key=lambda x: x['risk_score'], reverse=True)
    
    # Peak risk in forecast window
    peak_risk = max(risk_trajectory) if risk_trajectory else 0
    avg_risk = sum(risk_trajectory) / len(risk_trajectory) if risk_trajectory else 0
    
    # Projected end-of-shift (8 hours = 28800 sim-seconds)
    current_sim_time = plant.tick_count * 15  # each tick = 15 sim-seconds
    remaining_sim_seconds = 28800 - current_sim_time
    remaining_real_ticks = remaining_sim_seconds / 15
    
    # Linear projection
    if plant.tick_count > 0:
        current_total_revenue = sum(plant.revenue_totals.values())
        revenue_per_tick = current_total_revenue / plant.tick_count
        projected_shift_revenue = revenue_per_tick * (28800 / 15)
    else:
        projected_shift_revenue = 0
    
    return {
        'forecast_window_ticks': ticks_ahead,
        'forecast_window_sim_minutes': round(ticks_ahead * 15 / 60, 1),
        
        # Revenue forecast
        'predicted_revenue_next_period': round(revenue_delta, 2),
        'revenue_rate_per_hour': round(revenue_rate, 2),
        'projected_shift_total': round(projected_shift_revenue, 2),
        'revenue_trajectory': [round(r, 2) for r in revenue_trajectory[::10]],  # sample every 10th
        
        # Recovery forecast
        'predicted_recovery_kg': round(recovery_delta, 2),
        'predicted_energy_kwh': round(energy_delta, 2),
        
        # Risk forecast
        'peak_risk_score': round(peak_risk, 1),
        'average_risk_score': round(avg_risk, 1),
        'predicted_hazard_events': hazard_events,
        'risk_trajectory': [round(r, 1) for r in risk_trajectory[::10]],
        
        # Machine health forecast
        'at_risk_machines': at_risk_machines[:5],
        
        # Efficiency
        'predicted_efficiency': round(min(97, 85 + recovery_delta / 10), 1),
    }
