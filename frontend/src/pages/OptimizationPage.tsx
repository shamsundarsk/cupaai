import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Recommendation {
  id: string
  priority: string
  category: string
  title: string
  description: string
  action: string
  impact: string
  metric_improvement: string
}

interface OptimizationData {
  recommendations: Recommendation[]
  total_recommendations: number
  high_priority_count: number
  efficiency: {
    overall_score: number
    throughput_kg_per_min: number
    energy_per_kg_kwh: number
    revenue_per_kwh: number
    recovery_rate_percent: number
    completion_rate_percent: number
  }
  waste_analysis: {
    total_input_kg: number
    total_recovered_kg: number
    total_waste_kg: number
    in_system_kg: number
    recovery_rate_percent: number
    waste_rate_percent: number
    co2_from_waste_kg: number
    potential_recovery_kg: number
  }
  optimization_potential: {
    estimated_revenue_improvement_percent: number
    estimated_waste_reduction_percent: number
    estimated_efficiency_gain_percent: number
  }
}

interface SyncStatus {
  twin_status: string
  sync_confidence: number
  last_sync_ms: number
  uptime_seconds: number
  tick_rate_hz: number
  sensors_active: number
  sensors_total: number
  model_version: string
  ai_model_accuracy: number
  data_freshness: string
  simulation_fidelity: number
  total_ticks_processed: number
  total_events_generated: number
}

export function OptimizationPage() {
  const [data, setData] = useState<OptimizationData | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [optRes, syncRes] = await Promise.all([
        fetch(`${API_URL}/api/twin/optimize`),
        fetch(`${API_URL}/api/twin/sync-status`),
      ])
      setData(await optRes.json())
      setSyncStatus(await syncRes.json())
    } catch (e) {
      console.error('Fetch failed:', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [fetchData])

  const efficiency = data?.efficiency
  const waste = data?.waste_analysis
  const potential = data?.optimization_potential

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Optimization & Twin Status</h2>
        <p className="text-sm text-text-muted">AI recommendations to improve efficiency and reduce waste</p>
      </div>

      {/* Twin Sync Status Bar */}
      {syncStatus && (
        <div className="glass-panel p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-green pulse-live" />
              <span className="text-xs font-semibold text-accent-green uppercase">{syncStatus.twin_status}</span>
            </div>
            <span className="text-[10px] text-text-muted">|</span>
            <span className="text-[10px] text-text-secondary">Confidence: {syncStatus.sync_confidence}%</span>
            <span className="text-[10px] text-text-muted">|</span>
            <span className="text-[10px] text-text-secondary">Fidelity: {syncStatus.simulation_fidelity}%</span>
            <span className="text-[10px] text-text-muted">|</span>
            <span className="text-[10px] text-text-secondary">AI Accuracy: {syncStatus.ai_model_accuracy}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-muted">Sensors: {syncStatus.sensors_active}/{syncStatus.sensors_total}</span>
            <span className="text-[10px] text-text-muted">Tick Rate: {syncStatus.tick_rate_hz} Hz</span>
            <span className="text-[10px] text-text-muted">Ticks: {syncStatus.total_ticks_processed}</span>
          </div>
        </div>
      )}

      {/* Efficiency & Waste Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Efficiency Score */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">⚡ Plant Efficiency</h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#00d9ff" strokeWidth="8"
                  strokeDasharray={`${(efficiency?.overall_score || 0) * 2.51} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold font-mono text-accent-cyan">{efficiency?.overall_score.toFixed(0) || 0}</span>
              </div>
            </div>
            <div className="space-y-1">
              <MetricRow label="Throughput" value={`${efficiency?.throughput_kg_per_min.toFixed(2) || 0} kg/min`} />
              <MetricRow label="Energy/kg" value={`${efficiency?.energy_per_kg_kwh.toFixed(3) || 0} kWh`} />
              <MetricRow label="Revenue/kWh" value={`$${efficiency?.revenue_per_kwh.toFixed(2) || 0}`} />
              <MetricRow label="Recovery Rate" value={`${efficiency?.recovery_rate_percent.toFixed(1) || 0}%`} />
              <MetricRow label="Completion" value={`${efficiency?.completion_rate_percent.toFixed(1) || 0}%`} />
            </div>
          </div>
        </div>

        {/* Waste Analysis */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">🗑️ Material Flow Analysis</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Total Input</span>
              <span className="text-xs font-mono text-text-primary">{waste?.total_input_kg.toFixed(1) || 0} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">↳ Recovered</span>
              <span className="text-xs font-mono text-accent-green">{waste?.total_recovered_kg.toFixed(1) || 0} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">↳ Waste</span>
              <span className="text-xs font-mono text-hazard-red">{waste?.total_waste_kg.toFixed(1) || 0} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">↳ In Process</span>
              <span className="text-xs font-mono text-accent-cyan">{waste?.in_system_kg.toFixed(1) || 0} kg</span>
            </div>

            {/* Stacked bar — fills 100% with all three segments */}
            <div className="h-3 bg-bg-primary rounded-full overflow-hidden flex">
              {(() => {
                const total = (waste?.total_input_kg || 0)
                const rec = ((waste?.total_recovered_kg || 0) / Math.max(total, 0.1)) * 100
                const wst = ((waste?.total_waste_kg || 0) / Math.max(total, 0.1)) * 100
                const sys = ((waste?.in_system_kg || 0) / Math.max(total, 0.1)) * 100
                return (
                  <>
                    <div className="h-full bg-accent-green transition-all duration-500" style={{ width: `${rec}%` }} title={`Recovered: ${rec.toFixed(1)}%`} />
                    <div className="h-full bg-hazard-red transition-all duration-500" style={{ width: `${wst}%` }} title={`Waste: ${wst.toFixed(1)}%`} />
                    <div className="h-full bg-accent-cyan/50 transition-all duration-500" style={{ width: `${sys}%` }} title={`In Process: ${sys.toFixed(1)}%`} />
                  </>
                )
              })()}
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-accent-green">Recovered: {waste?.recovery_rate_percent.toFixed(1) || 0}%</span>
              <span className="text-hazard-red">Waste: {waste?.waste_rate_percent.toFixed(1) || 0}%</span>
              <span className="text-accent-cyan">In Process: {waste && waste.total_input_kg > 0 ? ((waste.in_system_kg / waste.total_input_kg) * 100).toFixed(1) : 0}%</span>
            </div>
            {waste && waste.potential_recovery_kg > 0 && (
              <div className="mt-2 p-2 bg-accent-green/10 rounded border border-accent-green/20">
                <span className="text-[10px] text-accent-green">
                  💡 With optimization: could recover additional {waste.potential_recovery_kg.toFixed(1)} kg
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimization Potential */}
      {potential && (potential.estimated_revenue_improvement_percent > 0 || potential.estimated_waste_reduction_percent > 0) && (
        <div className="glass-panel-glow p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">🎯 Optimization Potential</h3>
          <p className="text-xs text-text-muted mb-3">If all recommendations are implemented:</p>
          <div className="grid grid-cols-3 gap-3">
            <PotentialCard label="Revenue Improvement" value={`+${potential.estimated_revenue_improvement_percent}%`} color="text-revenue-green" />
            <PotentialCard label="Waste Reduction" value={`-${potential.estimated_waste_reduction_percent}%`} color="text-accent-cyan" />
            <PotentialCard label="Efficiency Gain" value={`+${potential.estimated_efficiency_gain_percent}%`} color="text-accent-purple" />
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">🤖 AI Recommendations</h3>
          <span className="text-[10px] text-text-muted">{data?.total_recommendations || 0} suggestions • {data?.high_priority_count || 0} high priority</span>
        </div>

        {data?.recommendations && data.recommendations.length > 0 ? (
          <div className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <div key={rec.id} className={`p-3 rounded-lg border ${
                rec.priority === 'high' ? 'border-hazard-red/30 bg-hazard-red/5' :
                rec.priority === 'medium' ? 'border-accent-amber/30 bg-accent-amber/5' :
                'border-border bg-bg-primary/50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                    rec.priority === 'high' ? 'bg-hazard-red/20 text-hazard-red' :
                    rec.priority === 'medium' ? 'bg-accent-amber/20 text-accent-amber' :
                    'bg-border text-text-muted'
                  }`}>{rec.priority}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded bg-bg-primary text-text-muted`}>{rec.category}</span>
                  <span className="text-xs font-semibold text-text-primary">{rec.title}</span>
                </div>
                <p className="text-[11px] text-text-secondary mb-1.5">{rec.description}</p>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="text-accent-cyan">💡 {rec.action}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-[10px]">
                  <span className="text-text-muted">Impact: {rec.impact}</span>
                  <span className="text-accent-green font-mono">{rec.metric_improvement}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <span className="text-2xl">✅</span>
            <p className="text-xs text-text-muted mt-2">All systems optimal — no recommendations at this time</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Sub-components ---

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[10px] text-text-muted">{label}</span>
      <span className="text-[11px] font-mono text-text-primary">{value}</span>
    </div>
  )
}

function PotentialCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 bg-bg-primary/50 rounded-lg text-center">
      <div className="text-[10px] text-text-muted">{label}</div>
      <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
    </div>
  )
}
