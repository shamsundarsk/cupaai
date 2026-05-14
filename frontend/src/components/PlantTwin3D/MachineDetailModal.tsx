/**
 * Machine Detail Modal — shows when you click any machine in the 3D view.
 * Explains what the machine does and shows its current live status.
 */
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox, ScanLine, Cpu, ArrowRight, Cog, Magnet, Scale,
  Flame, Battery, Hexagon, Recycle, Radiation, Package,
  AlertTriangle, BarChart3, ArrowDown, ArrowUp
} from 'lucide-react'
import { usePlantStore } from '../../store/plantStore'

interface MachineDetailModalProps {
  stationId: string | null
  onClose: () => void
}

// Machine info database
const MACHINE_INFO: Record<string, {
  name: string
  Icon: any
  iconColor: string
  whatItDoes: string
  howItWorks: string
  inputs: string
  outputs: string
  hazards: string
  capacity: string
}> = {
  intake: {
    name: 'Scrap Intake Bay',
    Icon: Inbox,
    iconColor: 'text-blue-500',
    whatItDoes: 'Receives incoming batteries, electronics, and e-waste from collection trucks.',
    howItWorks: 'Materials are weighed, logged, and placed on the inspection conveyor. Each item gets a unique tracking ID.',
    inputs: 'Raw e-waste: EV batteries, phones, laptops, PCBs, cables, industrial scrap',
    outputs: 'Logged items ready for inspection',
    hazards: 'Damaged batteries may already be overheating on arrival',
    capacity: '500+ items per shift',
  },
  inspection: {
    name: 'Inspection Station',
    Icon: ScanLine,
    iconColor: 'text-cyan-500',
    whatItDoes: 'Examines each item to determine its type, condition, and potential hazards.',
    howItWorks: 'Sensors measure weight, voltage (for batteries), temperature, and visual condition. Items are tagged as normal, degraded, or damaged.',
    inputs: 'Unclassified scrap items',
    outputs: 'Classified items with health status and material type',
    hazards: 'Swollen or leaking batteries detected here',
    capacity: '200 items/hour',
  },
  sorting: {
    name: 'AI Smart Sorting',
    Icon: Cpu,
    iconColor: 'text-purple-500',
    whatItDoes: 'Uses AI to classify materials and decide the optimal processing route for each item.',
    howItWorks: 'Machine learning model analyzes item properties (type, weight, health, composition) and assigns a route: lead furnace, lithium recovery, copper recovery, plastic line, or hazard isolation.',
    inputs: 'Classified items from inspection',
    outputs: 'Routing decisions — each item gets a destination',
    hazards: 'Misclassification could send hazardous items to wrong line',
    capacity: '300 decisions/hour',
  },
  conveyor_a: {
    name: 'Main Conveyor Belt',
    Icon: ArrowRight,
    iconColor: 'text-amber-500',
    whatItDoes: 'Transports sorted materials from the sorting station to their assigned processing line.',
    howItWorks: 'Motorized belt running at 1.2 m/s. Items are tracked by position sensors. Belt speed adjusts based on downstream capacity.',
    inputs: 'Sorted items from AI sorting',
    outputs: 'Items delivered to shredder, separation, or recovery stations',
    hazards: 'Overloading causes motor overheating and vibration spikes',
    capacity: '2 tonnes/hour throughput',
  },
  shredder: {
    name: 'Industrial Shredder',
    Icon: Cog,
    iconColor: 'text-orange-500',
    whatItDoes: 'Breaks down batteries and electronics into small fragments for easier material separation.',
    howItWorks: 'Rotating steel blades shred items into 5-20mm pieces. Dust extraction prevents airborne contamination. Motor draws 25kW under load.',
    inputs: 'Whole batteries, PCBs, electronic housings',
    outputs: 'Shredded fragments: mixed metals, plastics, and powders',
    hazards: 'High vibration, dust generation, potential sparks from lithium cells',
    capacity: '500 kg/hour',
  },
  magnetic_sep: {
    name: 'Magnetic Separator',
    Icon: Magnet,
    iconColor: 'text-yellow-500',
    whatItDoes: 'Uses powerful magnets to pull ferrous metals (iron, steel) out of the shredded material stream.',
    howItWorks: 'Rare-earth magnets on a rotating drum attract iron-containing fragments. Non-magnetic materials pass through to the next stage.',
    inputs: 'Shredded material mix',
    outputs: 'Separated ferrous metals + remaining non-ferrous stream',
    hazards: 'Magnetic interference with nearby electronics',
    capacity: '800 kg/hour',
  },
  density_sep: {
    name: 'Density Separator',
    Icon: Scale,
    iconColor: 'text-orange-500',
    whatItDoes: 'Separates remaining materials by their density (weight per volume) using air or liquid flotation.',
    howItWorks: 'Heavy materials (metals) sink while light materials (plastics) float. Different density cuts route materials to specific recovery lines.',
    inputs: 'Non-ferrous material stream',
    outputs: 'Separated streams: heavy metals → furnace/recovery, light materials → plastic line',
    hazards: 'Chemical exposure from flotation liquids',
    capacity: '600 kg/hour',
  },
  lead_furnace: {
    name: 'Lead Smelting Furnace',
    Icon: Flame,
    iconColor: 'text-red-500',
    whatItDoes: 'Melts lead from lead-acid batteries at 450-900°C to produce pure lead ingots for resale.',
    howItWorks: 'Battery plates are charged into the furnace. Lead melts at 327°C, is refined to 97%+ purity, and cast into ingots. Slag is removed. This is the PRIMARY REVENUE SOURCE — lead sells at $2.10/kg.',
    inputs: 'Lead-acid battery plates and grids',
    outputs: 'Pure lead ingots (97%+ purity) — $18+ per car battery',
    hazards: 'Extreme heat, lead fumes, SO₂ emissions — requires ventilation',
    capacity: '2 tonnes lead/shift',
  },
  lithium_recovery: {
    name: 'Lithium Recovery Cell',
    Icon: Battery,
    iconColor: 'text-purple-500',
    whatItDoes: 'Extracts lithium compounds from lithium-ion battery materials using hydrometallurgical processes.',
    howItWorks: 'Shredded cathode material is dissolved in acid, then lithium is precipitated as lithium carbonate. Process takes 2-4 hours per batch.',
    inputs: 'Shredded Li-ion cathode material (NMC, LFP)',
    outputs: 'Lithium carbonate powder — sells at $14.50/kg',
    hazards: 'Acid handling, toxic gas generation, thermal events',
    capacity: '200 kg lithium/shift',
  },
  copper_recovery: {
    name: 'Copper Recovery Station',
    Icon: Hexagon,
    iconColor: 'text-orange-600',
    whatItDoes: 'Recovers copper from PCBs, wiring, and battery connectors through electrochemical processes.',
    howItWorks: 'Copper-rich material is dissolved in acid, then pure copper is electroplated onto cathodes. Achieves 99%+ purity.',
    inputs: 'PCBs, copper wiring, battery connectors',
    outputs: 'Pure copper cathodes — sells at $9.50/kg',
    hazards: 'Acid splash, electrical hazards',
    capacity: '300 kg copper/shift',
  },
  plastic_line: {
    name: 'Plastic Recycling Line',
    Icon: Recycle,
    iconColor: 'text-green-500',
    whatItDoes: 'Washes, melts, and pelletizes recovered plastics from battery casings and electronic housings.',
    howItWorks: 'Plastics are sorted by type (PP, ABS, PC), washed to remove contaminants, melted in an extruder, and cut into pellets for resale.',
    inputs: 'Sorted plastic fragments from separation',
    outputs: 'Recycled plastic pellets — sells at $0.85/kg',
    hazards: 'Fumes from melting, contamination risk',
    capacity: '400 kg plastic/shift',
  },
  hazard_isolation: {
    name: 'Hazard Isolation Bay',
    Icon: Radiation,
    iconColor: 'text-red-600',
    whatItDoes: 'Contains batteries and materials that the AI flagged as dangerous — preventing thermal runaway and toxic exposure.',
    howItWorks: 'Isolated in fireproof containment with CO₂ suppression, temperature monitoring, and gas extraction. Items cool down before safe disposal or controlled processing.',
    inputs: 'Batteries with thermal anomalies, swelling, or gas leaks',
    outputs: 'Stabilized items (returned to processing) or safe disposal',
    hazards: 'HIGHEST RISK ZONE — fire, explosion, toxic gas release',
    capacity: '20 items max containment',
  },
  storage: {
    name: 'Final Material Storage',
    Icon: Package,
    iconColor: 'text-cyan-500',
    whatItDoes: 'Stores recovered materials ready for sale to manufacturers and commodity markets.',
    howItWorks: 'Lead ingots, copper cathodes, lithium carbonate, and plastic pellets are weighed, quality-checked, and stored for shipment.',
    inputs: 'Purified recovered materials from all recovery lines',
    outputs: 'Sold to manufacturers → revenue',
    hazards: 'Minimal — materials are stable at this point',
    capacity: '50 tonnes total storage',
  },
}

export function MachineDetailModal({ stationId, onClose }: MachineDetailModalProps) {
  const telemetry = usePlantStore((s) => s.telemetry)
  const sensors = telemetry?.sensors || []
  const batteries = telemetry?.batteries_in_system || []
  const stations = telemetry?.stations || {}

  if (!stationId) return null

  const info = MACHINE_INFO[stationId]
  if (!info) return null

  const sensor = sensors.find(s => s.station_id === stationId)
  const stationBatteries = batteries.filter(b => b.current_station === stationId)
  const state = stations[stationId] || 'idle'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass-panel-glow w-[600px] max-h-[80vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-bg-primary/50 ${info.iconColor}`}>
                <info.Icon size={24} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{info.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${
                    state === 'processing' ? 'bg-accent-green pulse-live' :
                    state === 'faulted' ? 'bg-hazard-red' : 'bg-text-muted'
                  }`} />
                  <span className="text-xs text-text-secondary capitalize">{state}</span>
                  <span className="text-xs text-text-muted">•</span>
                  <span className="text-xs text-accent-cyan">{stationBatteries.length} items</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl cursor-pointer">✕</button>
          </div>

          {/* What it does */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider mb-1">What This Machine Does</h3>
            <p className="text-sm text-text-primary leading-relaxed">{info.whatItDoes}</p>
          </div>

          {/* How it works */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider mb-1">How It Works</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{info.howItWorks}</p>
          </div>

          {/* Inputs / Outputs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-bg-primary/50 rounded-lg">
              <h4 className="text-[10px] text-text-muted uppercase mb-1 flex items-center gap-1.5">
                <ArrowDown size={11} strokeWidth={1.8} className="text-blue-400" />
                Inputs
              </h4>
              <p className="text-xs text-text-secondary">{info.inputs}</p>
            </div>
            <div className="p-3 bg-bg-primary/50 rounded-lg">
              <h4 className="text-[10px] text-text-muted uppercase mb-1 flex items-center gap-1.5">
                <ArrowUp size={11} strokeWidth={1.8} className="text-green-400" />
                Outputs
              </h4>
              <p className="text-xs text-text-secondary">{info.outputs}</p>
            </div>
          </div>

          {/* Live Sensor Data */}
          {sensor && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider mb-2">Live Sensor Data</h3>
              <div className="grid grid-cols-3 gap-2">
                <SensorCard label="Temperature" value={`${sensor.temperature_c.toFixed(1)}°C`} warn={sensor.temperature_c > 80} />
                <SensorCard label="Vibration" value={`${sensor.vibration_hz.toFixed(1)} Hz`} warn={sensor.vibration_hz > 8} />
                <SensorCard label="Gas Level" value={`${sensor.gas_ppm.toFixed(1)} ppm`} warn={sensor.gas_ppm > 30} />
                <SensorCard label="Load" value={`${sensor.load_percent.toFixed(0)}%`} warn={sensor.load_percent > 85} />
                <SensorCard label="Power Draw" value={`${sensor.power_kw.toFixed(1)} kW`} warn={false} />
                <SensorCard label="Belt Speed" value={`${sensor.conveyor_speed_ms.toFixed(2)} m/s`} warn={false} />
              </div>
            </div>
          )}

          {/* Items at this station */}
          {stationBatteries.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider mb-2">
                Items Currently Here ({stationBatteries.length})
              </h3>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                {stationBatteries.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-2 bg-bg-primary/50 rounded border border-border/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        b.health === 'damaged' ? 'bg-hazard-red' :
                        b.health === 'degraded' ? 'bg-accent-amber' : 'bg-accent-green'
                      }`} />
                      <span className="text-[11px] font-mono">{b.id}</span>
                      <span className="text-[10px] text-text-muted">{formatType(b.material_type)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-text-muted">{b.weight_kg.toFixed(1)} kg</span>
                      <span className={b.health === 'damaged' ? 'text-hazard-red' : 'text-text-secondary'}>{b.health}</span>
                      {b.hazard_score > 20 && (
                        <span className="text-hazard-red font-mono flex items-center gap-1">
                          <AlertTriangle size={10} strokeWidth={2} />
                          {b.hazard_score.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hazards & Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-hazard-red/5 border border-hazard-red/20 rounded-lg">
              <h4 className="text-[10px] text-hazard-red uppercase mb-1 flex items-center gap-1.5">
                <AlertTriangle size={11} strokeWidth={1.8} />
                Hazards
              </h4>
              <p className="text-xs text-text-secondary">{info.hazards}</p>
            </div>
            <div className="p-3 bg-bg-primary/50 rounded-lg">
              <h4 className="text-[10px] text-text-muted uppercase mb-1 flex items-center gap-1.5">
                <BarChart3 size={11} strokeWidth={1.8} />
                Capacity
              </h4>
              <p className="text-xs text-text-secondary">{info.capacity}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// --- Helpers ---

function SensorCard({ label, value, warn }: { label: string; value: string; warn: boolean }) {
  return (
    <div className={`p-2 rounded border ${warn ? 'border-hazard-red/30 bg-hazard-red/5' : 'border-border/30 bg-bg-primary/50'}`}>
      <div className="text-[9px] text-text-muted">{label}</div>
      <div className={`text-sm font-mono font-semibold ${warn ? 'text-hazard-red' : 'text-text-primary'}`}>{value}</div>
    </div>
  )
}

function formatType(type: string): string {
  const m: Record<string, string> = {
    lead_acid: 'Lead-Acid', lithium_ion: 'Li-Ion', pcb: 'PCB',
    copper_heavy: 'Copper', plastic: 'Plastic', hazardous: 'Hazardous',
  }
  return m[type] || type
}
