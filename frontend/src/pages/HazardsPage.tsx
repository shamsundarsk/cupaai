import { usePlantStore } from '../store/plantStore'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

/**
 * Hazards Page — safety monitoring, AI predictions, and alert history.
 */
export function HazardsPage() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const riskHistory = usePlantStore((s) => s.riskHistory)

  const riskScore = telemetry?.plant_risk_score || 0
  const alerts = telemetry?.hazard_alerts || []
  const batteries = telemetry?.batteries_in_system || []
  const events = telemetry?.events || []

  // Find batteries with elevated risk
  const riskyBatteries = batteries
    .filter(b => b.hazard_score > 20)
    .sort((a, b) => b.hazard_score - a.hazard_score)

  // Hazard events from log
  const hazardEvents = events.filter(e => e.includes('🔴') || e.includes('HAZARD') || e.includes('⚠️'))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Safety & Hazard Monitoring</h2>
        <p className="text-sm text-text-muted">AI-powered thermal runaway prediction and safety alerts</p>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-3 gap-3">
        {/* Current Risk */}
        <div className={`glass-panel p-4 border-l-4 ${riskScore > 60 ? 'border-l-hazard-red' : riskScore > 30 ? 'border-l-accent-amber' : 'border-l-accent-green'}`}>
          <div className="text-[10px] text-text-muted uppercase">Plant Risk Score</div>
          <div className={`text-4xl font-bold font-mono ${getRiskColor(riskScore)}`}>
            {riskScore.toFixed(0)}
          </div>
          <div className="text-xs text-text-muted mt-1">{getRiskLabel(riskScore)}</div>
          {/* Risk bar */}
          <div className="mt-2 h-2 bg-bg-primary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${riskScore}%`,
                backgroundColor: riskScore > 60 ? '#ef4444' : riskScore > 30 ? '#ffb800' : '#00ff9d'
              }}
            />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="glass-panel p-4">
          <div className="text-[10px] text-text-muted uppercase">Active Alerts</div>
          <div className="text-4xl font-bold font-mono text-hazard-red">{alerts.length}</div>
          <div className="text-xs text-text-muted mt-1">
            {alerts.length === 0 ? 'No active threats' : 'Requires attention'}
          </div>
        </div>

        {/* At-Risk Items */}
        <div className="glass-panel p-4">
          <div className="text-[10px] text-text-muted uppercase">At-Risk Batteries</div>
          <div className="text-4xl font-bold font-mono text-accent-amber">{riskyBatteries.length}</div>
          <div className="text-xs text-text-muted mt-1">Elevated hazard score</div>
        </div>
      </div>

      {/* Middle — Risk Trend & Alerts */}
      <div className="grid grid-cols-2 gap-3">
        {/* Risk Score Over Time */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Risk Score Trend</h3>
          <p className="text-xs text-text-muted mb-3">How plant risk has changed over time</p>
          {riskHistory.length > 5 ? (
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskHistory.map((v, i) => ({ i, risk: v }))}>
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-xs text-text-muted">Collecting data...</div>
          )}
        </div>

        {/* How AI Detection Works */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">🧠 How AI Detection Works</h3>
          <p className="text-xs text-text-muted mb-3">Our system monitors these signals:</p>
          <div className="space-y-2">
            <DetectionRow
              signal="Temperature"
              description="Battery cell temperature rising above 70°C"
              threshold="Critical at 85°C"
              icon="🌡️"
            />
            <DetectionRow
              signal="Gas Levels"
              description="Toxic gas emissions from battery electrolyte"
              threshold="Alert at 30 ppm"
              icon="💨"
            />
            <DetectionRow
              signal="Voltage Anomaly"
              description="Sudden voltage drops indicate cell failure"
              threshold="Below 2.5V"
              icon="⚡"
            />
            <DetectionRow
              signal="Vibration"
              description="Abnormal machine vibration patterns"
              threshold="Above 10 Hz"
              icon="📳"
            />
          </div>
        </div>
      </div>

      {/* Bottom — At-Risk Batteries & Event History */}
      <div className="grid grid-cols-2 gap-3">
        {/* At-Risk Batteries */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">🔴 Batteries Being Monitored</h3>
          {riskyBatteries.length === 0 ? (
            <p className="text-xs text-text-muted italic">All batteries within safe parameters</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {riskyBatteries.map(b => (
                <div key={b.id} className={`p-2.5 rounded-lg border ${
                  b.hazard_score > 70 ? 'border-hazard-red/50 bg-hazard-red/5' :
                  b.hazard_score > 40 ? 'border-accent-amber/50 bg-accent-amber/5' :
                  'border-border bg-bg-primary/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-primary">{b.id}</span>
                    <span className={`text-xs font-bold ${
                      b.hazard_score > 70 ? 'text-hazard-red' : 'text-accent-amber'
                    }`}>
                      Risk: {b.hazard_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                    <span>🌡️ {b.temperature_c.toFixed(1)}°C</span>
                    <span>💨 {b.gas_ppm.toFixed(1)} ppm</span>
                    <span>📍 {formatStation(b.current_station)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hazard Event History */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">📋 Safety Event Log</h3>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {hazardEvents.length === 0 ? (
              <p className="text-xs text-text-muted italic">No hazard events recorded</p>
            ) : (
              hazardEvents.map((event, i) => (
                <div key={i} className="text-[11px] font-mono text-text-secondary py-1 border-b border-border/30">
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Helpers ---

function DetectionRow({ signal, description, threshold, icon }: {
  signal: string; description: string; threshold: string; icon: string
}) {
  return (
    <div className="flex items-start gap-2 p-2 bg-bg-primary/50 rounded">
      <span className="text-sm">{icon}</span>
      <div>
        <div className="text-[11px] text-text-primary font-medium">{signal}</div>
        <div className="text-[9px] text-text-muted">{description}</div>
        <div className="text-[9px] text-accent-amber">{threshold}</div>
      </div>
    </div>
  )
}

function getRiskColor(score: number): string {
  if (score > 60) return 'text-hazard-red'
  if (score > 30) return 'text-accent-amber'
  return 'text-accent-green'
}

function getRiskLabel(score: number): string {
  if (score > 80) return 'CRITICAL — Immediate action needed'
  if (score > 60) return 'HIGH — Monitor closely'
  if (score > 30) return 'MODERATE — Within tolerance'
  return 'LOW — Normal operations'
}

function formatStation(id: string): string {
  const s: Record<string, string> = {
    intake: 'Intake', inspection: 'Inspection', sorting: 'Sorting',
    conveyor_a: 'Conveyor', shredder: 'Shredder', magnetic_sep: 'Mag Sep',
    density_sep: 'Density Sep', lead_furnace: 'Lead Furnace',
    lithium_recovery: 'Li Recovery', copper_recovery: 'Cu Recovery',
    plastic_line: 'Plastic', hazard_isolation: 'Hazard Bay', storage: 'Storage',
  }
  return s[id] || id
}
