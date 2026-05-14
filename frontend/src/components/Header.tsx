import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePlantStore } from '../store/plantStore'
import { useSound } from '../hooks/useSound'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function Header() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const connected = usePlantStore((s) => s.connected)
  const { toggleSound } = useSound()
  const [soundOn, setSoundOn] = useState(false)

  const shiftTime = telemetry ? formatShiftTime(telemetry.shift_elapsed_s) : '00:00:00'
  const batteryCount = telemetry?.batteries_in_system.length || 0
  const revenue = telemetry?.total_revenue_usd || 0
  const riskScore = telemetry?.plant_risk_score || 0
  const tick = telemetry?.tick || 0

  const handleInjectHazard = async () => {
    await fetch(`${API_URL}/api/plant/inject-hazard`, { method: 'POST' })
  }

  return (
    <header className="h-[52px] flex items-center justify-between px-5 border-b border-border bg-bg-secondary">
      {/* Left — Metrics strip */}
      <div className="flex items-center gap-6">
        <HeaderMetric label="SHIFT" value={shiftTime} mono />
        <Divider />
        <HeaderMetric label="ITEMS" value={String(batteryCount)} color="text-accent-cyan" />
        <Divider />
        <HeaderMetric label="REVENUE" value={`$${revenue.toFixed(2)}`} color="text-revenue-green" mono />
        <Divider />
        <HeaderMetric
          label="RISK"
          value={`${riskScore.toFixed(0)}`}
          color={riskScore > 60 ? 'text-hazard-red' : riskScore > 30 ? 'text-warning-amber' : 'text-accent-green'}
          mono
        />
        <Divider />
        <HeaderMetric label="TICK" value={String(tick)} color="text-text-muted" mono />
      </div>

      {/* Right — Controls */}
      <div className="flex items-center gap-3">
        {/* Sound toggle */}
        <button
          onClick={() => { const on = toggleSound(); setSoundOn(on) }}
          className="px-2 py-1 rounded bg-bg-card border border-border-subtle text-[9px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          {soundOn ? '🔊' : '🔇'}
        </button>

        {/* Connection indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-bg-card border border-border-subtle">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-accent-green pulse-live' : 'bg-hazard-red'}`} />
          <span className="text-[9px] text-text-muted uppercase tracking-wider">{connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Inject button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleInjectHazard}
          className="px-3 py-1.5 bg-hazard-red/8 border border-hazard-red/30 rounded text-[10px] text-hazard-red hover:bg-hazard-red/15 transition-all cursor-pointer font-medium uppercase tracking-wider"
        >
          ⚡ Inject Hazard
        </motion.button>
      </div>
    </header>
  )
}

function HeaderMetric({ label, value, color = 'text-text-primary', mono = false }: {
  label: string; value: string; color?: string; mono?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] text-text-muted uppercase tracking-widest font-medium leading-none mb-0.5">{label}</span>
      <span className={`text-[13px] font-semibold leading-none ${color} ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-6 bg-border-subtle" />
}

function formatShiftTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
