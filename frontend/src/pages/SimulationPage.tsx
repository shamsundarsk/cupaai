import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, AlertTriangle, Wrench, FlaskConical, Play } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Prediction {
  forecast_window_sim_minutes: number
  predicted_revenue_next_period: number
  revenue_rate_per_hour: number
  projected_shift_total: number
  revenue_trajectory: number[]
  predicted_recovery_kg: number
  predicted_energy_kwh: number
  peak_risk_score: number
  average_risk_score: number
  predicted_hazard_events: number
  risk_trajectory: number[]
  at_risk_machines: { station: string; risk_score: number; max_temp: number; max_vibration: number; max_load: number }[]
  predicted_efficiency: number
}

interface WhatIfResult {
  modifications_applied: Record<string, any>
  baseline: { total_revenue: number; total_recovery: number; total_energy: number; avg_risk: number; waste_generated: number }
  modified: { total_revenue: number; total_recovery: number; total_energy: number; avg_risk: number; waste_generated: number }
  deltas: { revenue_usd: number; recovery_kg: number; energy_kwh: number; risk_score: number; waste_kg: number }
  recommendation: string
  benefit_score: number
  summary: string
}

export function SimulationPage() {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [whatIfLoading, setWhatIfLoading] = useState(false)

  // What-if parameters
  const [conveyorSpeed, setConveyorSpeed] = useState(1.2)
  const [intakeRate, setIntakeRate] = useState(500)
  const [shutdownStation, setShutdownStation] = useState('')
  const [furnaceTemp, setFurnaceTemp] = useState(450)
  const [shredderLoad, setShredderLoad] = useState(70)

  // Auto-refresh prediction every 10 seconds
  const fetchPrediction = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/twin/predict?ticks_ahead=120`)
      const data = await res.json()
      setPrediction(data)
    } catch (e) {
      console.error('Prediction fetch failed:', e)
    }
  }, [])

  useEffect(() => {
    fetchPrediction()
    const interval = setInterval(fetchPrediction, 10000)
    return () => clearInterval(interval)
  }, [fetchPrediction])

  const runWhatIf = async () => {
    setWhatIfLoading(true)
    try {
      const params = new URLSearchParams()
      // Convert real values to factors relative to defaults
      const conveyorFactor = conveyorSpeed / 1.2  // default is 1.2 m/s
      const intakeFactor = intakeRate / 500        // default is 500 items/day
      
      if (Math.abs(conveyorFactor - 1.0) > 0.05) params.set('conveyor_speed_factor', String(conveyorFactor.toFixed(2)))
      if (Math.abs(intakeFactor - 1.0) > 0.05) params.set('intake_rate_factor', String(intakeFactor.toFixed(2)))
      if (shutdownStation) params.set('shutdown_station', shutdownStation)

      const res = await fetch(`${API_URL}/api/twin/whatif?${params}`, { method: 'POST' })
      const data = await res.json()
      setWhatIfResult(data)
    } catch (e) {
      console.error('What-if failed:', e)
    }
    setWhatIfLoading(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Simulation & Prediction</h2>
        <p className="text-sm text-text-muted">Predict future outcomes and test changes before applying them</p>
      </div>

      {/* Prediction Section */}
      <div className="grid grid-cols-4 gap-3">
        <PredictCard label="Revenue (next 30 min)" value={`$${prediction?.predicted_revenue_next_period.toFixed(2) || '...'}`} color="text-revenue-green" />
        <PredictCard label="Revenue Rate" value={`$${prediction?.revenue_rate_per_hour.toFixed(0) || '...'}/hr`} color="text-revenue-green" />
        <PredictCard label="Peak Risk (forecast)" value={`${prediction?.peak_risk_score.toFixed(0) || '...'}/100`} color={prediction && prediction.peak_risk_score > 60 ? 'text-hazard-red' : 'text-accent-green'} />
        <PredictCard label="Predicted Efficiency" value={`${prediction?.predicted_efficiency.toFixed(1) || '...'}%`} color="text-accent-cyan" />
      </div>

      {/* Forecast Charts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
            <TrendingUp size={15} strokeWidth={1.8} className="text-revenue-green" />
            Revenue Forecast
          </h3>
          <p className="text-xs text-text-muted mb-3">Predicted revenue trajectory over next 30 sim-minutes</p>
          {prediction?.revenue_trajectory && prediction.revenue_trajectory.length > 2 ? (
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prediction.revenue_trajectory.map((v, i) => ({ min: i * 5, revenue: v }))}>
                  <XAxis dataKey="min" tick={{ fontSize: 9, fill: '#64748b' }} label={{ value: 'minutes', position: 'bottom', fontSize: 9, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3441', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98120" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-xs text-text-muted">Loading forecast...</div>
          )}
        </div>

        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
            <AlertTriangle size={15} strokeWidth={1.8} className="text-hazard-red" />
            Risk Forecast
          </h3>
          <p className="text-xs text-text-muted mb-3">Predicted plant risk over next 30 sim-minutes</p>
          {prediction?.risk_trajectory && prediction.risk_trajectory.length > 2 ? (
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prediction.risk_trajectory.map((v, i) => ({ min: i * 5, risk: v }))}>
                  <XAxis dataKey="min" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3441', borderRadius: '8px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-xs text-text-muted">Loading forecast...</div>
          )}
        </div>
      </div>

      {/* At-Risk Machines */}
      {prediction?.at_risk_machines && prediction.at_risk_machines.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
            <Wrench size={15} strokeWidth={1.8} className="text-accent-amber" />
            Machines Predicted to Need Attention
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {prediction.at_risk_machines.map((m, i) => (
              <div key={i} className="p-2 bg-bg-primary/50 rounded border border-accent-amber/20">
                <div className="text-xs font-semibold text-text-primary capitalize">{m.station.replace('_', ' ')}</div>
                <div className="text-[10px] text-text-muted mt-1">
                  Peak temp: <span className={m.max_temp > 100 ? 'text-hazard-red' : 'text-text-secondary'}>{m.max_temp}°C</span> •
                  Vibration: <span className={m.max_vibration > 8 ? 'text-hazard-red' : 'text-text-secondary'}>{m.max_vibration} Hz</span> •
                  Load: <span className={m.max_load > 85 ? 'text-hazard-red' : 'text-text-secondary'}>{m.max_load}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What-If Section */}
      <div className="glass-panel-glow p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
          <FlaskConical size={15} strokeWidth={1.8} className="text-accent-cyan" />
          What-If Scenario Engine
        </h3>
        <p className="text-xs text-text-muted mb-4">Test changes before applying them — see the impact on revenue, risk, and waste</p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Conveyor Speed */}
          <div>
            <label className="text-[10px] text-text-muted uppercase block mb-1">Conveyor Speed (m/s)</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0.3} max={2.5} step={0.1} value={conveyorSpeed}
                onChange={(e) => setConveyorSpeed(Number(e.target.value))}
                className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary font-mono"
              />
            </div>
            <span className="text-[9px] text-text-muted">Default: 1.2 m/s</span>
          </div>

          {/* Intake Rate */}
          <div>
            <label className="text-[10px] text-text-muted uppercase block mb-1">Intake Rate (items/day)</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={100} max={2000} step={50} value={intakeRate}
                onChange={(e) => setIntakeRate(Number(e.target.value))}
                className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary font-mono"
              />
            </div>
            <span className="text-[9px] text-text-muted">Default: 500 items/day</span>
          </div>

          {/* Shutdown Station */}
          <div>
            <label className="text-[10px] text-text-muted uppercase block mb-1">Shutdown for Maintenance</label>
            <select
              value={shutdownStation}
              onChange={(e) => setShutdownStation(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary"
            >
              <option value="">None (all running)</option>
              <option value="shredder">Shredder</option>
              <option value="lead_furnace">Lead Furnace</option>
              <option value="magnetic_sep">Magnetic Separator</option>
              <option value="density_sep">Density Separator</option>
              <option value="plastic_line">Plastic Line</option>
              <option value="lithium_recovery">Lithium Recovery</option>
              <option value="copper_recovery">Copper Recovery</option>
            </select>
            <span className="text-[9px] text-text-muted">Simulate maintenance downtime</span>
          </div>
        </div>

        {/* Second row of inputs */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] text-text-muted uppercase block mb-1">Furnace Target Temp (°C)</label>
            <input
              type="number" min={300} max={1000} step={25} value={furnaceTemp}
              onChange={(e) => setFurnaceTemp(Number(e.target.value))}
              className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary font-mono"
            />
            <span className="text-[9px] text-text-muted">Optimal: 450-600°C • Max safe: 900°C</span>
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase block mb-1">Shredder Max Load (%)</label>
            <input
              type="number" min={30} max={100} step={5} value={shredderLoad}
              onChange={(e) => setShredderLoad(Number(e.target.value))}
              className="w-full bg-bg-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary font-mono"
            />
            <span className="text-[9px] text-text-muted">Default: 70% • Above 85% risks overheating</span>
          </div>
        </div>

        <button
          onClick={runWhatIf}
          disabled={whatIfLoading || (conveyorSpeed === 1.2 && intakeRate === 500 && !shutdownStation && furnaceTemp === 450 && shredderLoad === 70)}
          className="px-4 py-2 bg-accent-cyan/15 border border-accent-cyan/40 rounded text-xs text-accent-cyan hover:bg-accent-cyan/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1.5"
        >
          {whatIfLoading ? (
            'Simulating...'
          ) : (
            <>
              <Play size={11} strokeWidth={2} />
              Run Scenario
            </>
          )}
        </button>

        {/* What-If Results */}
        {whatIfResult && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                whatIfResult.recommendation === 'recommended' ? 'bg-accent-green/20 text-accent-green' :
                whatIfResult.recommendation === 'neutral' ? 'bg-accent-amber/20 text-accent-amber' :
                'bg-hazard-red/20 text-hazard-red'
              }`}>
                {whatIfResult.recommendation === 'recommended' ? '✓ RECOMMENDED' :
                 whatIfResult.recommendation === 'neutral' ? '~ NEUTRAL' : '✗ NOT RECOMMENDED'}
              </span>
              <span className="text-xs text-text-muted">{whatIfResult.summary}</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <DeltaCard label="Revenue" value={whatIfResult.deltas.revenue_usd} unit="$" positive={whatIfResult.deltas.revenue_usd > 0} />
              <DeltaCard label="Recovery" value={whatIfResult.deltas.recovery_kg} unit="kg" positive={whatIfResult.deltas.recovery_kg > 0} />
              <DeltaCard label="Energy" value={whatIfResult.deltas.energy_kwh} unit="kWh" positive={whatIfResult.deltas.energy_kwh < 0} />
              <DeltaCard label="Risk" value={whatIfResult.deltas.risk_score} unit="pts" positive={whatIfResult.deltas.risk_score < 0} />
              <DeltaCard label="Waste" value={whatIfResult.deltas.waste_kg} unit="kg" positive={whatIfResult.deltas.waste_kg < 0} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Sub-components ---

function PredictCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-panel p-3">
      <div className="text-[9px] text-text-muted uppercase">{label}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  )
}

function DeltaCard({ label, value, unit, positive }: { label: string; value: number; unit: string; positive: boolean }) {
  const isPositive = positive
  return (
    <div className={`p-2 rounded border ${isPositive ? 'border-accent-green/30 bg-accent-green/5' : 'border-hazard-red/30 bg-hazard-red/5'}`}>
      <div className="text-[9px] text-text-muted">{label}</div>
      <div className={`text-sm font-mono font-bold ${isPositive ? 'text-accent-green' : 'text-hazard-red'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(2)} {unit}
      </div>
    </div>
  )
}
