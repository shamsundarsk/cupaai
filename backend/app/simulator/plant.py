"""Plant state machine — the heart of the simulation."""
from __future__ import annotations

import time
import random
from typing import Optional

from app.schemas import (
    StationId, StationState, MaterialType, RouteDecision,
    BatteryItem, HazardAlert, HazardLevel, SensorReading,
    RecoveryRecord, PlantTelemetry,
)
from app.simulator.sensors import generate_sensor_reading
from app.simulator.batteries import spawn_battery, spawn_batch
from app.simulator.events import EventBus
from app.economics.prices import get_price
from app.economics.revenue import calculate_recovery_revenue


# Processing time per station (in ticks at 2Hz = seconds/2)
PROCESSING_TICKS = {
    StationId.INTAKE: 3,
    StationId.INSPECTION: 4,
    StationId.SORTING: 2,
    StationId.CONVEYOR_A: 3,
    StationId.CONVEYOR_B: 3,
    StationId.SHREDDER: 6,
    StationId.MAGNETIC_SEP: 5,
    StationId.DENSITY_SEP: 5,
    StationId.LEAD_FURNACE: 10,
    StationId.LITHIUM_RECOVERY: 8,
    StationId.COPPER_RECOVERY: 7,
    StationId.PLASTIC_LINE: 6,
    StationId.HAZARD_ISOLATION: 15,
    StationId.STORAGE: 999,
}

# Route mapping: material type → processing path
ROUTE_MAP = {
    MaterialType.LEAD_ACID: RouteDecision.LEAD_FURNACE,
    MaterialType.LITHIUM_ION: RouteDecision.LITHIUM_RECOVERY,
    MaterialType.PCB: RouteDecision.COPPER_RECOVERY,
    MaterialType.COPPER_HEAVY: RouteDecision.COPPER_RECOVERY,
    MaterialType.PLASTIC: RouteDecision.PLASTIC_LINE,
    MaterialType.HAZARDOUS: RouteDecision.HAZARD_ISOLATION,
    MaterialType.NON_RECYCLABLE: RouteDecision.DISPOSAL,
}

# Route → station mapping
ROUTE_TO_STATION = {
    RouteDecision.LEAD_FURNACE: StationId.LEAD_FURNACE,
    RouteDecision.LITHIUM_RECOVERY: StationId.LITHIUM_RECOVERY,
    RouteDecision.COPPER_RECOVERY: StationId.COPPER_RECOVERY,
    RouteDecision.PLASTIC_LINE: StationId.PLASTIC_LINE,
    RouteDecision.HAZARD_ISOLATION: StationId.HAZARD_ISOLATION,
    RouteDecision.SHREDDING: StationId.SHREDDER,
    RouteDecision.DISMANTLING: StationId.SHREDDER,
    RouteDecision.DISPOSAL: StationId.STORAGE,
}

# Station processing pipeline (normal flow)
STATION_PIPELINE = [
    StationId.INTAKE,
    StationId.INSPECTION,
    StationId.SORTING,
    StationId.CONVEYOR_A,
    StationId.SHREDDER,
    StationId.MAGNETIC_SEP,
    StationId.DENSITY_SEP,
    # After density sep, items route to their specific recovery station
]


class PlantSimulator:
    """Main plant simulation engine."""

    def __init__(self):
        self.tick_count: int = 0
        self.sim_start: float = time.time()
        self.event_bus = EventBus()

        # Station states
        self.station_states: dict[str, StationState] = {
            s.value: StationState.IDLE for s in StationId
        }

        # Batteries currently in the system
        self.batteries: list[BatteryItem] = []
        self.battery_ticks: dict[str, int] = {}  # battery_id → ticks at current station

        # Recovery totals
        self.recovery_totals: dict[str, float] = {
            "lead": 0.0, "lithium": 0.0, "copper": 0.0,
            "cobalt": 0.0, "aluminum": 0.0, "plastic": 0.0,
        }
        self.revenue_totals: dict[str, float] = {
            "lead": 0.0, "lithium": 0.0, "copper": 0.0,
            "cobalt": 0.0, "aluminum": 0.0, "plastic": 0.0,
        }
        self.total_energy_kwh: float = 0.0
        self.total_co2_avoided_kg: float = 0.0
        self.total_landfill_diverted_kg: float = 0.0

        # Actual tracking for real efficiency
        self.total_input_weight_kg: float = 0.0  # total weight of all items that entered
        self.total_items_entered: int = 0
        self.total_items_completed: int = 0
        self.total_items_wasted: int = 0  # items that went to disposal/couldn't be recovered
        self.total_waste_kg: float = 0.0  # actual unrecoverable material

        # Hazard tracking
        self.active_alerts: list[HazardAlert] = []
        self.hazards_prevented: int = 0
        self.plant_risk_score: float = 10.0

        # Intake scheduling
        self._next_batch_tick: int = 6
        self._batch_interval: int = 10  # ticks between batches (faster flow)

        # Sensor cache
        self._sensor_readings: list[SensorReading] = []

        # Initial batch
        self._spawn_intake_batch(12)

    def _spawn_intake_batch(self, size: int = None):
        """Spawn a new batch of incoming materials."""
        if size is None:
            size = random.randint(5, 12)
        batch = spawn_batch(size)
        for b in batch:
            self.batteries.append(b)
            self.battery_ticks[b.id] = 0
            self.total_input_weight_kg += b.weight_kg
            self.total_items_entered += 1
        total_weight = sum(b.weight_kg for b in batch)
        self.event_bus.emit(
            f"Intake: {size} items received ({total_weight:.1f} kg)",
            severity="info", station="intake"
        )

    def inject_hazardous_battery(self) -> str:
        """Inject a damaged EV battery for demo purposes."""
        battery = spawn_battery(
            force_type=MaterialType.LITHIUM_ION,
            force_health="damaged"
        )
        battery.temperature_c = 55.0
        battery.weight_kg = 35.0
        battery.lithium_content_kg = 2.45
        battery.copper_content_kg = 3.5
        battery.cobalt_content_kg = 5.25
        self.batteries.append(battery)
        self.battery_ticks[battery.id] = 0
        self.event_bus.emit(
            f"Damaged EV battery {battery.id} entered intake — monitoring initiated",
            severity="warning", station="intake", battery_id=battery.id
        )
        return battery.id

    def tick(self) -> PlantTelemetry:
        """Advance simulation by one tick."""
        self.tick_count += 1
        self._sensor_readings = []

        # Spawn new batches periodically
        if self.tick_count >= self._next_batch_tick:
            self._spawn_intake_batch()
            self._next_batch_tick = self.tick_count + self._batch_interval + random.randint(-5, 5)

        # Process each battery
        batteries_to_remove = []
        new_alerts = []

        for battery in self.batteries:
            self.battery_ticks[battery.id] = self.battery_ticks.get(battery.id, 0) + 1
            ticks_here = self.battery_ticks[battery.id]
            station = battery.current_station
            required_ticks = PROCESSING_TICKS.get(station, 10)

            # Update station state
            self.station_states[station.value] = StationState.PROCESSING

            # Simulate battery degradation for damaged items
            if battery.health == "damaged" and station != StationId.HAZARD_ISOLATION:
                battery.temperature_c += random.uniform(0.6, 1.8)
                battery.gas_ppm += random.uniform(0.4, 1.5)
                battery.hazard_score = min(100, battery.hazard_score + random.uniform(1.5, 4))
            elif battery.health == "degraded":
                # Degraded items rarely escalate to hazards in real plants
                battery.temperature_c += random.uniform(0.0, 0.15)
                battery.hazard_score = min(35, battery.hazard_score + random.uniform(0, 0.4))

            # Hazard detection
            if battery.hazard_score > 70 and battery.current_station != StationId.HAZARD_ISOLATION:
                alert = HazardAlert(
                    battery_id=battery.id,
                    station_id=station,
                    hazard_level=HazardLevel.CRITICAL if battery.hazard_score > 85 else HazardLevel.HIGH,
                    hazard_score=battery.hazard_score,
                    message=f"Thermal anomaly on {battery.id}: {battery.temperature_c:.1f}°C, gas {battery.gas_ppm:.1f} ppm"
                )
                new_alerts.append(alert)
                # Reroute to isolation
                battery.route = RouteDecision.HAZARD_ISOLATION
                battery.current_station = StationId.HAZARD_ISOLATION
                self.battery_ticks[battery.id] = 0
                self.hazards_prevented += 1
                self.event_bus.emit(
                    f"HAZARD: {battery.id} rerouted to isolation (score: {battery.hazard_score:.0f})",
                    severity="hazard", station="hazard_isolation", battery_id=battery.id
                )
            elif ticks_here >= required_ticks:
                # Move to next station
                self._advance_battery(battery)

            # Check if battery is fully processed
            if battery.current_station == StationId.STORAGE:
                batteries_to_remove.append(battery)

        # Remove processed batteries and record recovery
        for battery in batteries_to_remove:
            self._record_recovery(battery)
            self.batteries.remove(battery)
            if battery.id in self.battery_ticks:
                del self.battery_ticks[battery.id]

        # Update alerts
        self.active_alerts = [a for a in self.active_alerts if time.time() - a.timestamp < 30]
        self.active_alerts.extend(new_alerts)

        # Calculate plant risk score
        if self.batteries:
            max_hazard = max((b.hazard_score for b in self.batteries), default=0)
            avg_hazard = sum(b.hazard_score for b in self.batteries) / len(self.batteries)
            self.plant_risk_score = min(100, max_hazard * 0.6 + avg_hazard * 0.4)
        else:
            self.plant_risk_score = max(5, self.plant_risk_score - 1)

        # Generate sensor readings for all active stations
        for station_id in StationId:
            batteries_at_station = [b for b in self.batteries if b.current_station == station_id]
            load_factor = min(2.0, len(batteries_at_station) / 3.0 + 0.3)
            stress = 1.0
            hazard_nearby = any(b.hazard_score > 50 for b in batteries_at_station)

            if any(b.health == "damaged" for b in batteries_at_station):
                stress = 1.5

            reading = generate_sensor_reading(station_id, load_factor, stress, hazard_nearby)
            self._sensor_readings.append(reading)

            # Accumulate energy: power_kw * time_hours_per_tick
            # Each tick is 0.5 real seconds. In sim-time that's 15 seconds.
            self.total_energy_kwh += reading.power_kw * (15.0 / 3600.0)
        
        # Base plant load (HVAC, lighting, control systems, ventilation) — always on
        self.total_energy_kwh += 45.0 * (15.0 / 3600.0)  # 45kW base load

        # Update idle stations
        active_stations = {b.current_station.value for b in self.batteries}
        for sid in StationId:
            if sid.value not in active_stations:
                self.station_states[sid.value] = StationState.IDLE

        # Build telemetry payload
        return PlantTelemetry(
            tick=self.tick_count,
            sim_time=time.time() - self.sim_start,
            shift_elapsed_s=(self.tick_count / 2) * 30,  # 1 real sec = 30 sim sec
            stations=self.station_states,
            sensors=self._sensor_readings,
            batteries_in_system=self.batteries[:20],  # cap for WS payload size
            hazard_alerts=self.active_alerts,
            recovery_totals=self.recovery_totals,
            revenue_totals=self.revenue_totals,
            total_revenue_usd=sum(self.revenue_totals.values()),
            total_co2_avoided_kg=self.total_co2_avoided_kg,
            total_landfill_diverted_kg=self.total_landfill_diverted_kg,
            total_energy_kwh=round(self.total_energy_kwh, 2),
            plant_risk_score=round(self.plant_risk_score, 1),
            events=self.event_bus.recent(10),
            total_input_weight_kg=round(self.total_input_weight_kg, 2),
            total_waste_kg=round(self.total_waste_kg, 2),
            total_items_entered=self.total_items_entered,
            total_items_completed=self.total_items_completed,
        )

    def _advance_battery(self, battery: BatteryItem):
        """Move battery to next station in its pipeline."""
        current = battery.current_station

        # If at sorting, determine route
        if current == StationId.SORTING:
            route = ROUTE_MAP.get(battery.material_type, RouteDecision.DISPOSAL)
            battery.route = route
            battery.current_station = StationId.CONVEYOR_A
            self.battery_ticks[battery.id] = 0
            self.event_bus.emit(
                f"Sorted {battery.id} ({battery.material_type.value}) → {route.value}",
                severity="info", station="sorting", battery_id=battery.id
            )
            return

        # If on conveyor, route to appropriate processing
        if current in (StationId.CONVEYOR_A, StationId.CONVEYOR_B):
            if battery.route:
                target = ROUTE_TO_STATION.get(battery.route, StationId.SHREDDER)
                battery.current_station = target
            else:
                battery.current_station = StationId.SHREDDER
            self.battery_ticks[battery.id] = 0
            return

        # Normal pipeline progression
        if current == StationId.INTAKE:
            battery.current_station = StationId.INSPECTION
        elif current == StationId.INSPECTION:
            battery.current_station = StationId.SORTING
        elif current == StationId.SHREDDER:
            battery.current_station = StationId.MAGNETIC_SEP
        elif current == StationId.MAGNETIC_SEP:
            battery.current_station = StationId.DENSITY_SEP
        elif current == StationId.DENSITY_SEP:
            # Route to specific recovery
            if battery.route:
                target = ROUTE_TO_STATION.get(battery.route, StationId.STORAGE)
                battery.current_station = target
            else:
                battery.current_station = StationId.STORAGE
        elif current in (StationId.LEAD_FURNACE, StationId.LITHIUM_RECOVERY,
                         StationId.COPPER_RECOVERY, StationId.PLASTIC_LINE,
                         StationId.HAZARD_ISOLATION):
            battery.current_station = StationId.STORAGE
        else:
            battery.current_station = StationId.STORAGE

        self.battery_ticks[battery.id] = 0

    def _record_recovery(self, battery: BatteryItem):
        """Record material recovery when battery exits system."""
        self.total_items_completed += 1
        
        # Real-world recovery rates by material type (industry data)
        # Lead-acid: 95-99% lead recovery
        # Lithium-ion: 50-80% lithium recovery (hydrometallurgy is lossy)
        # Copper from PCB: 85-95% recovery
        # Cobalt: 70-90% recovery
        # Plastic: 60-80% recovery (contamination losses)
        
        recovery_rates = {
            "lead": random.uniform(0.93, 0.98),      # lead-acid is very efficient
            "lithium": random.uniform(0.50, 0.75),   # lithium recovery is hard
            "copper": random.uniform(0.82, 0.93),    # good but not perfect
            "cobalt": random.uniform(0.68, 0.88),    # moderate
            "plastic": random.uniform(0.55, 0.75),   # lots of contamination loss
        }
        
        total_recoverable_in_item = (
            battery.lead_content_kg + battery.lithium_content_kg +
            battery.copper_content_kg + battery.cobalt_content_kg +
            battery.plastic_content_kg
        )
        total_actually_recovered = 0.0

        if battery.lead_content_kg > 0:
            rate = recovery_rates["lead"]
            recovered = battery.lead_content_kg * rate
            total_actually_recovered += recovered
            revenue = calculate_recovery_revenue("lead", recovered, rate)
            self.recovery_totals["lead"] += recovered
            self.revenue_totals["lead"] += revenue
            if recovered > 1.0:
                self.event_bus.emit(
                    f"Lead recovered: {recovered:.2f} kg (${revenue:.2f}) [{rate*100:.0f}% yield]",
                    severity="revenue", station="lead_furnace", battery_id=battery.id
                )

        if battery.lithium_content_kg > 0:
            rate = recovery_rates["lithium"]
            recovered = battery.lithium_content_kg * rate
            total_actually_recovered += recovered
            revenue = calculate_recovery_revenue("lithium", recovered, rate)
            self.recovery_totals["lithium"] += recovered
            self.revenue_totals["lithium"] += revenue

        if battery.copper_content_kg > 0:
            rate = recovery_rates["copper"]
            recovered = battery.copper_content_kg * rate
            total_actually_recovered += recovered
            revenue = calculate_recovery_revenue("copper", recovered, rate)
            self.recovery_totals["copper"] += recovered
            self.revenue_totals["copper"] += revenue

        if battery.cobalt_content_kg > 0:
            rate = recovery_rates["cobalt"]
            recovered = battery.cobalt_content_kg * rate
            total_actually_recovered += recovered
            revenue = calculate_recovery_revenue("cobalt", recovered, rate)
            self.recovery_totals["cobalt"] += recovered
            self.revenue_totals["cobalt"] += revenue

        if battery.plastic_content_kg > 0:
            rate = recovery_rates["plastic"]
            recovered = battery.plastic_content_kg * rate
            total_actually_recovered += recovered
            revenue = calculate_recovery_revenue("plastic", recovered, rate)
            self.recovery_totals["plastic"] += recovered
            self.revenue_totals["plastic"] += revenue

        # Waste = what we couldn't recover from the recoverable portion
        waste_from_recovery = total_recoverable_in_item - total_actually_recovered
        # Plus the non-recoverable portion of the battery (casing, electrolyte, etc.)
        non_recoverable = battery.weight_kg - total_recoverable_in_item
        total_waste = waste_from_recovery + non_recoverable * 0.7  # 70% of non-recoverable goes to waste, 30% is inert
        
        self.total_waste_kg += total_waste
        self.total_landfill_diverted_kg += total_actually_recovered  # what we saved from landfill
        
        # CO2 avoided: based on actual recovered amounts vs virgin mining
        # These are real LCA figures (kg CO2 per kg material)
        co2_factors = {"lead": 1.7, "lithium": 5.3, "copper": 3.5, "cobalt": 8.1, "plastic": 1.2}
        co2_saved = 0.0
        for mat, factor in co2_factors.items():
            co2_saved += self.recovery_totals.get(mat, 0) * factor * 0.001  # small per-tick contribution
        # Actually just add the CO2 for this specific recovery event
        if battery.lead_content_kg > 0:
            co2_saved = battery.lead_content_kg * recovery_rates["lead"] * 1.7
        if battery.lithium_content_kg > 0:
            co2_saved += battery.lithium_content_kg * recovery_rates["lithium"] * 5.3
        if battery.copper_content_kg > 0:
            co2_saved += battery.copper_content_kg * recovery_rates["copper"] * 3.5
        if battery.cobalt_content_kg > 0:
            co2_saved += battery.cobalt_content_kg * recovery_rates["cobalt"] * 8.1
        self.total_co2_avoided_kg += co2_saved
