"""AI Optimization Engine — generates actionable recommendations."""
from __future__ import annotations

import time
from app.simulator.plant import PlantSimulator
from app.schemas import StationId


def generate_recommendations(plant: PlantSimulator) -> dict:
    """
    Analyze current plant state and generate optimization recommendations.
    
    Returns:
        Dict with recommendations, efficiency metrics, and waste analysis
    """
    recommendations = []
    sensors = {}
    
    # Get latest sensor data from plant
    if plant._sensor_readings:
        for s in plant._sensor_readings:
            sid = s.station_id.value if hasattr(s.station_id, 'value') else s.station_id
            sensors[sid] = s
    
    # --- Rule-based optimization analysis ---
    
    # 1. Check shredder load
    shredder_sensor = sensors.get('shredder')
    if shredder_sensor and shredder_sensor.load_percent > 80:
        recommendations.append({
            'id': 'shredder_overload',
            'priority': 'high',
            'category': 'efficiency',
            'title': 'Reduce Shredder Load',
            'description': f'Shredder at {shredder_sensor.load_percent:.0f}% capacity. Risk of motor overheating and reduced throughput.',
            'action': 'Reduce intake rate by 20% or divert items to secondary line',
            'impact': 'Prevents downtime worth ~$500/hour, extends machine life',
            'metric_improvement': '+5% throughput efficiency',
        })
    
    # 2. Check conveyor overload
    conveyor_sensor = sensors.get('conveyor_a')
    if conveyor_sensor and conveyor_sensor.load_percent > 75:
        recommendations.append({
            'id': 'conveyor_stress',
            'priority': 'medium',
            'category': 'efficiency',
            'title': 'Conveyor Approaching Capacity',
            'description': f'Conveyor A at {conveyor_sensor.load_percent:.0f}% load. Motor temperature rising.',
            'action': 'Slow intake rate or increase conveyor speed by 10%',
            'impact': 'Prevents belt wear and motor burnout',
            'metric_improvement': '+3% energy efficiency',
        })
    
    # 3. Check furnace efficiency
    furnace_sensor = sensors.get('lead_furnace')
    if furnace_sensor:
        if furnace_sensor.temperature_c < 400:
            recommendations.append({
                'id': 'furnace_cold',
                'priority': 'medium',
                'category': 'revenue',
                'title': 'Lead Furnace Below Optimal Temperature',
                'description': f'Furnace at {furnace_sensor.temperature_c:.0f}°C. Optimal smelting requires 450°C+.',
                'action': 'Increase furnace power to reach optimal temperature',
                'impact': 'Higher purity lead = better price per kg',
                'metric_improvement': '+8% lead revenue',
            })
        elif furnace_sensor.temperature_c > 800:
            recommendations.append({
                'id': 'furnace_hot',
                'priority': 'high',
                'category': 'waste',
                'title': 'Furnace Overheating — Wasting Energy',
                'description': f'Furnace at {furnace_sensor.temperature_c:.0f}°C. Above 800°C wastes energy without improving yield.',
                'action': 'Reduce furnace power by 15%',
                'impact': 'Save ~12 kWh/hour without affecting output',
                'metric_improvement': '-15% energy waste',
            })
    
    # 4. Check for idle recovery stations with queued items
    batteries_at_density = [b for b in plant.batteries if b.current_station == StationId.DENSITY_SEP]
    if len(batteries_at_density) > 3:
        recommendations.append({
            'id': 'bottleneck_density',
            'priority': 'high',
            'category': 'efficiency',
            'title': 'Bottleneck at Density Separator',
            'description': f'{len(batteries_at_density)} items queued at density separation. Downstream recovery stations may be underutilized.',
            'action': 'Increase density separator throughput or add parallel processing',
            'impact': 'Reduces queue time by 40%, improves overall throughput',
            'metric_improvement': '+12% plant throughput',
        })
    
    # 5. Check hazard rate
    if plant.hazards_prevented > 0 and plant.tick_count > 0:
        hazard_rate = plant.hazards_prevented / (plant.tick_count / 120)  # per minute
        if hazard_rate > 0.5:
            recommendations.append({
                'id': 'high_hazard_rate',
                'priority': 'high',
                'category': 'safety',
                'title': 'High Hazard Frequency',
                'description': f'Averaging {hazard_rate:.1f} hazard events per minute. Above normal threshold.',
                'action': 'Increase inspection thoroughness, reject more damaged items at intake',
                'impact': 'Reduces isolation events, improves continuous flow',
                'metric_improvement': '-30% hazard interruptions',
            })
    
    # 6. Check waste ratio
    total_recovery = sum(plant.recovery_totals.values())
    if total_recovery > 10:
        # Estimate waste (items that entered but weren't fully recovered)
        estimated_input = total_recovery / 0.92  # assuming 92% recovery
        waste_kg = estimated_input - total_recovery
        waste_pct = (waste_kg / estimated_input) * 100
        
        if waste_pct > 10:
            recommendations.append({
                'id': 'high_waste',
                'priority': 'medium',
                'category': 'waste',
                'title': 'Waste Rate Above Target',
                'description': f'Estimated {waste_pct:.1f}% waste rate. Target is below 8%.',
                'action': 'Improve sorting accuracy, recirculate partially-processed material',
                'impact': f'Could recover additional {waste_kg * 0.3:.1f} kg of material',
                'metric_improvement': '-3% waste rate',
            })
    
    # 7. Energy optimization
    if plant.total_energy_kwh > 0 and total_recovery > 0:
        energy_per_kg = plant.total_energy_kwh / total_recovery
        if energy_per_kg > 2.0:
            recommendations.append({
                'id': 'energy_inefficient',
                'priority': 'low',
                'category': 'waste',
                'title': 'Energy Consumption Above Benchmark',
                'description': f'Using {energy_per_kg:.1f} kWh per kg recovered. Industry benchmark is 1.5 kWh/kg.',
                'action': 'Schedule non-critical machines to idle during low-intake periods',
                'impact': f'Could save {(energy_per_kg - 1.5) * total_recovery * 0.08:.2f} USD in energy',
                'metric_improvement': '-20% energy per kg',
            })
    
    # 8. Always suggest batch optimization if running
    if plant.tick_count > 50:
        recommendations.append({
            'id': 'batch_optimization',
            'priority': 'low',
            'category': 'efficiency',
            'title': 'Optimize Batch Sizing',
            'description': 'Current batch sizes are uniform. Varying batch size based on material type could improve flow.',
            'action': 'Group lead-acid batteries into larger batches for furnace efficiency',
            'impact': 'Reduces furnace heat-up cycles, saves energy',
            'metric_improvement': '+5% furnace efficiency',
        })
    
    # Sort by priority
    priority_order = {'high': 0, 'medium': 1, 'low': 2}
    recommendations.sort(key=lambda r: priority_order.get(r['priority'], 3))
    
    # Calculate overall efficiency metrics
    efficiency_score = _calculate_efficiency(plant)
    waste_analysis = _calculate_waste(plant)
    
    return {
        'recommendations': recommendations,
        'total_recommendations': len(recommendations),
        'high_priority_count': len([r for r in recommendations if r['priority'] == 'high']),
        'efficiency': efficiency_score,
        'waste_analysis': waste_analysis,
        'optimization_potential': _calculate_optimization_potential(recommendations),
    }


def _calculate_efficiency(plant: PlantSimulator) -> dict:
    """Calculate current plant efficiency metrics."""
    total_recovery = sum(plant.recovery_totals.values())
    total_revenue = sum(plant.revenue_totals.values())
    
    # Throughput efficiency (items processed per tick)
    throughput = total_recovery / max(plant.tick_count, 1) * 120  # per minute
    
    # Energy efficiency
    energy_per_kg = plant.total_energy_kwh / max(total_recovery, 0.1)
    
    # Revenue efficiency
    revenue_per_kwh = total_revenue / max(plant.total_energy_kwh, 0.1)
    
    # Overall score (0-100)
    score = min(100, max(0,
        40 +  # base
        min(20, throughput * 5) +  # throughput bonus
        min(20, (2.0 - energy_per_kg) * 10) +  # energy bonus (lower = better)
        min(20, revenue_per_kwh * 2)  # revenue bonus
    ))
    
    return {
        'overall_score': round(score, 1),
        'throughput_kg_per_min': round(throughput, 2),
        'energy_per_kg_kwh': round(energy_per_kg, 3),
        'revenue_per_kwh': round(revenue_per_kwh, 2),
        'uptime_percent': 95.0,  # simulated
    }


def _calculate_waste(plant: PlantSimulator) -> dict:
    """Calculate waste metrics."""
    total_recovery = sum(plant.recovery_totals.values())
    estimated_input = total_recovery / 0.92
    waste_kg = estimated_input - total_recovery
    
    return {
        'total_input_kg': round(estimated_input, 2),
        'total_recovered_kg': round(total_recovery, 2),
        'total_waste_kg': round(waste_kg, 2),
        'recovery_rate_percent': round((total_recovery / max(estimated_input, 0.1)) * 100, 1),
        'waste_rate_percent': round((waste_kg / max(estimated_input, 0.1)) * 100, 1),
        'co2_from_waste_kg': round(waste_kg * 2.5, 2),  # CO2 from landfilling waste
        'potential_recovery_kg': round(waste_kg * 0.4, 2),  # 40% of waste could be recovered with optimization
    }


def _calculate_optimization_potential(recommendations: list) -> dict:
    """Estimate total improvement if all recommendations are followed."""
    revenue_improvement = 0
    waste_reduction = 0
    efficiency_gain = 0
    
    for rec in recommendations:
        if rec['category'] == 'revenue':
            revenue_improvement += 8
        elif rec['category'] == 'efficiency':
            efficiency_gain += 5
        elif rec['category'] == 'waste':
            waste_reduction += 5
    
    return {
        'estimated_revenue_improvement_percent': min(25, revenue_improvement),
        'estimated_waste_reduction_percent': min(30, waste_reduction),
        'estimated_efficiency_gain_percent': min(20, efficiency_gain),
    }
