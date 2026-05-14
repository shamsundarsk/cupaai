/**
 * Plant Twin — SVG-based animated 2D plant visualization.
 * Shows all stations, conveyors, material flow, and hazard zones.
 */
import { usePlantStore } from '../../store/plantStore'
import { motion } from 'framer-motion'
import { ConveyorBelt } from './ConveyorBelt'
import { Station } from './Station'
import { MaterialDot } from './MaterialDot'
import { HazardOverlay } from './HazardOverlay'

// Station positions on the SVG canvas (x, y)
const STATION_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  intake: { x: 60, y: 200, label: 'Intake' },
  inspection: { x: 180, y: 200, label: 'Inspect' },
  sorting: { x: 300, y: 200, label: 'Sort' },
  conveyor_a: { x: 420, y: 200, label: 'Conv-A' },
  shredder: { x: 540, y: 200, label: 'Shredder' },
  magnetic_sep: { x: 660, y: 200, label: 'Mag Sep' },
  density_sep: { x: 780, y: 200, label: 'Density' },
  lead_furnace: { x: 700, y: 80, label: 'Lead Furnace' },
  lithium_recovery: { x: 850, y: 120, label: 'Li Recovery' },
  copper_recovery: { x: 850, y: 200, label: 'Cu Recovery' },
  plastic_line: { x: 850, y: 280, label: 'Plastic' },
  hazard_isolation: { x: 300, y: 350, label: 'HAZARD ISO' },
  storage: { x: 950, y: 200, label: 'Storage' },
}

// Conveyor paths (from → to)
const CONVEYOR_PATHS = [
  { from: 'intake', to: 'inspection' },
  { from: 'inspection', to: 'sorting' },
  { from: 'sorting', to: 'conveyor_a' },
  { from: 'conveyor_a', to: 'shredder' },
  { from: 'shredder', to: 'magnetic_sep' },
  { from: 'magnetic_sep', to: 'density_sep' },
  { from: 'density_sep', to: 'lead_furnace' },
  { from: 'density_sep', to: 'lithium_recovery' },
  { from: 'density_sep', to: 'copper_recovery' },
  { from: 'density_sep', to: 'plastic_line' },
  { from: 'sorting', to: 'hazard_isolation' },
  { from: 'lead_furnace', to: 'storage' },
  { from: 'lithium_recovery', to: 'storage' },
  { from: 'copper_recovery', to: 'storage' },
  { from: 'plastic_line', to: 'storage' },
]

export function PlantTwin() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const stations = telemetry?.stations || {}
  const batteries = telemetry?.batteries_in_system || []
  const alerts = telemetry?.hazard_alerts || []
  const riskScore = telemetry?.plant_risk_score || 0

  return (
    <div className="glass-panel h-full relative overflow-hidden">
      {/* Title overlay */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">Live Plant View</span>
        <span className="text-[10px] text-accent-cyan font-mono">
          {batteries.length} items in system
        </span>
      </div>

      <svg
        viewBox="0 0 1050 420"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          {/* Furnace glow gradient */}
          <radialGradient id="furnaceGlow">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
          {/* Hazard glow */}
          <radialGradient id="hazardGlow">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1050" height="420" fill="url(#grid)" />

        {/* Conveyor belts */}
        {CONVEYOR_PATHS.map((path, i) => {
          const from = STATION_POSITIONS[path.from]
          const to = STATION_POSITIONS[path.to]
          if (!from || !to) return null
          return (
            <ConveyorBelt
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              active={stations[path.from] === 'processing' || stations[path.to] === 'processing'}
            />
          )
        })}

        {/* Stations */}
        {Object.entries(STATION_POSITIONS).map(([id, pos]) => (
          <Station
            key={id}
            id={id}
            x={pos.x}
            y={pos.y}
            label={pos.label}
            state={stations[id] || 'idle'}
            isHazard={id === 'hazard_isolation'}
            isFurnace={id === 'lead_furnace'}
          />
        ))}

        {/* Material dots (batteries in system) */}
        {batteries.map((battery) => {
          const pos = STATION_POSITIONS[battery.current_station]
          if (!pos) return null
          return (
            <MaterialDot
              key={battery.id}
              x={pos.x}
              y={pos.y}
              materialType={battery.material_type}
              health={battery.health}
              hazardScore={battery.hazard_score}
            />
          )
        })}

        {/* Hazard overlays */}
        {alerts.map((alert, i) => {
          const pos = STATION_POSITIONS[alert.station_id]
          if (!pos) return null
          return (
            <HazardOverlay key={i} x={pos.x} y={pos.y} level={alert.hazard_level} />
          )
        })}

        {/* Lead furnace glow effect */}
        {stations['lead_furnace'] === 'processing' && (
          <circle
            cx={STATION_POSITIONS.lead_furnace.x}
            cy={STATION_POSITIONS.lead_furnace.y}
            r="40"
            fill="url(#furnaceGlow)"
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  )
}
