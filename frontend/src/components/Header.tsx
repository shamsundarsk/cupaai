import { motion } from 'framer-motion'
import { usePlantStore } from '../store/plantStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function Header() {
  const telemetry = usePlantStore((s) => s.telemetry)

  const shiftTime = telemetry ? formatShiftTime(telemetry.shift_elapsed_s) : '00:00:00'
  const batteryCount = telemetry?.batteries_in_system.length || 0
  const revenue = telemetry?.total_revenue_usd || 0
  const riskScore = telemetry?.plant_risk_score || 0

  const handleInjectHazard = async () => {
    await fetch(`${API_URL}/api/plant/inject-hazard`, { method: 'POST' })
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary/90 backdrop-blur-sm">
      {/* Quick Stats */}
      <div className="flex items-center gap-6">
        <QuickStat label="Shift Time" value={shiftTime} />
        <QuickStat label="Items in System" value={String(batteryCount)} color="text-accent-cyan" />
        <QuickStat label="Revenue" value={`$${revenue.toFixed(2)}`} color="text-revenue-green" />
        <QuickStat label="Risk Score" value={riskScore.toFixed(0)} color={riskScore > 60 ? 'text-hazard-red' : riskScore > 30 ? 'text-accent-amber' : 'text-accent-green'} />
      </div>

      {/* Demo Controls */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInjectHazard}
          className="px-4 py-2 bg-hazard-red/15 border border-hazard-red/40 rounded-lg text-xs text-hazard-red hover:bg-hazard-red/25 transition-colors cursor-pointer font-medium"
        >
          ⚡ Inject Damaged Battery
        </motion.button>
      </div>
    </header>
  )
}

function QuickStat({ label, value, color = 'text-text-primary' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[9px] text-text-muted uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-mono font-semibold ${color}`}>{value}</div>
    </div>
  )
}

function formatShiftTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
