import { usePlantStore } from '../store/plantStore'
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts'

export function OverviewPage() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const revenueHistory = usePlantStore((s) => s.revenueHistory)
  const riskHistory = usePlantStore((s) => s.riskHistory)

  const batteries = telemetry?.batteries_in_system || []
  const recovery = telemetry?.recovery_totals || {}
  const revenue = telemetry?.revenue_totals || {}
  const events = telemetry?.events || []
  const totalRevenue = telemetry?.total_revenue_usd || 0
  const riskScore = telemetry?.plant_risk_score || 0

  // What's currently entering the plant
  const intakeBatteries = batteries.filter(b => b.current_station === 'intake' || b.current_station === 'inspection')
  const processingBatteries = batteries.filter(b => !['intake', 'inspection', 'storage', 'hazard_isolation'].includes(b.current_station))
  const hazardBatteries = batteries.filter(b => b.current_station === 'hazard_isolation')

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-semibold text-text-bright">Plant Overview</h2>
        <p className="text-[11px] text-text-muted">Real-time summary of all recycling operations</p>
      </div>

      {/* Top Row — Key Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          subtitle="From recovered materials"
          color="text-revenue-green"
          bgColor="bg-revenue-green"
        />
        <MetricCard
          title="Items Processing"
          value={String(processingBatteries.length)}
          subtitle={`${intakeBatteries.length} waiting at intake`}
          color="text-accent-cyan"
          bgColor="bg-accent-cyan"
        />
        <MetricCard
          title="Plant Risk"
          value={`${riskScore.toFixed(0)}/100`}
          subtitle={riskScore > 60 ? 'Elevated — check hazards' : 'Normal operations'}
          color={riskScore > 60 ? 'text-hazard-red' : 'text-accent-green'}
          bgColor={riskScore > 60 ? 'bg-hazard-red' : 'bg-accent-green'}
        />
        <MetricCard
          title="Hazards Isolated"
          value={String(hazardBatteries.length)}
          subtitle="Batteries in containment"
          color="text-warning-amber"
          bgColor="bg-warning-amber"
        />
      </div>

      {/* Middle Row — What's Entering & Process Status */}
      <div className="grid grid-cols-2 gap-3">
        {/* Incoming Materials */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">📥 What's Entering the Plant</h3>
          <p className="text-xs text-text-muted mb-3">Materials currently at intake and inspection</p>
          
          {intakeBatteries.length === 0 ? (
            <p className="text-xs text-text-muted italic">No items at intake right now</p>
          ) : (
            <div className="space-y-2">
              {intakeBatteries.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2 bg-bg-primary/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${getHealthColor(b.health)}`} />
                    <div>
                      <span className="text-xs font-mono text-text-primary">{b.id}</span>
                      <span className="text-[10px] text-text-muted ml-2">{formatMaterialType(b.material_type)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-muted">{b.weight_kg.toFixed(1)} kg</div>
                    <div className={`text-[10px] ${b.health === 'damaged' ? 'text-hazard-red' : b.health === 'degraded' ? 'text-accent-amber' : 'text-accent-green'}`}>
                      {b.health}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Process Pipeline Status */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">⚙️ Processing Pipeline</h3>
          <p className="text-xs text-text-muted mb-3">What's happening at each stage right now</p>
          
          <div className="space-y-1.5">
            {PROCESS_STEPS.map((step) => {
              const count = batteries.filter(b => b.current_station === step.id).length
              return (
                <div key={step.id} className="flex items-center gap-2 p-1.5 rounded">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${count > 0 ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-bg-primary text-text-muted'}`}>
                    {count}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] text-text-primary">{step.label}</div>
                    <div className="text-[9px] text-text-muted">{step.description}</div>
                  </div>
                  {count > 0 && <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan pulse-live" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row — Revenue Chart & Event Log */}
      <div className="grid grid-cols-2 gap-3">
        {/* Revenue Trend */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">💰 Revenue Trend</h3>
          <p className="text-xs text-text-muted mb-3">Cumulative income from material recovery</p>
          {revenueHistory.length > 5 ? (
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueHistory.map((v, i) => ({ i, v }))}>
                  <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b98120" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-xs text-text-muted">
              Collecting data...
            </div>
          )}
        </div>

        {/* Event Log */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">📋 Recent Events</h3>
          <p className="text-xs text-text-muted mb-3">What just happened in the plant</p>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-xs text-text-muted italic">Waiting for events...</p>
            ) : (
              events.slice().reverse().map((event, i) => (
                <div key={i} className="text-[11px] font-mono text-text-secondary py-0.5 border-b border-border/50 last:border-0">
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

const PROCESS_STEPS = [
  { id: 'intake', label: 'Scrap Intake', description: 'Receiving incoming batteries & e-waste' },
  { id: 'inspection', label: 'Inspection', description: 'Checking condition, weight, type' },
  { id: 'sorting', label: 'Smart Sorting', description: 'AI classifies and routes materials' },
  { id: 'conveyor_a', label: 'Conveyor Transfer', description: 'Moving to processing stations' },
  { id: 'shredder', label: 'Shredding', description: 'Breaking down into smaller pieces' },
  { id: 'magnetic_sep', label: 'Magnetic Separation', description: 'Extracting ferrous metals' },
  { id: 'density_sep', label: 'Density Separation', description: 'Separating by material weight' },
  { id: 'lead_furnace', label: 'Lead Furnace', description: 'Smelting lead from batteries' },
  { id: 'lithium_recovery', label: 'Lithium Recovery', description: 'Extracting lithium compounds' },
  { id: 'copper_recovery', label: 'Copper Recovery', description: 'Recovering copper from PCBs' },
  { id: 'plastic_line', label: 'Plastic Recycling', description: 'Processing plastic casings' },
  { id: 'hazard_isolation', label: 'Hazard Isolation', description: 'Containing dangerous items' },
  { id: 'storage', label: 'Final Storage', description: 'Recovered materials ready for sale' },
]

function formatMaterialType(type: string): string {
  const labels: Record<string, string> = {
    lead_acid: 'Lead-Acid Battery',
    lithium_ion: 'Lithium-Ion Battery',
    pcb: 'Circuit Board (PCB)',
    copper_heavy: 'Copper-Rich Scrap',
    plastic: 'Plastic Waste',
    hazardous: 'Hazardous Material',
    non_recyclable: 'Non-Recyclable',
  }
  return labels[type] || type
}

function getHealthColor(health: string): string {
  if (health === 'damaged') return 'bg-hazard-red'
  if (health === 'degraded') return 'bg-accent-amber'
  return 'bg-accent-green'
}

function MetricCard({ title, value, subtitle, color, bgColor }: {
  title: string; value: string; subtitle: string; color: string; bgColor: string
}) {
  return (
    <div className="glass-panel p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${bgColor}`} />
      <div className="text-[9px] text-text-muted uppercase tracking-widest font-medium mb-1.5">{title}</div>
      <div className={`text-xl font-bold font-mono ${color} leading-none`}>{value}</div>
      <div className="text-[10px] text-text-muted mt-2">{subtitle}</div>
    </div>
  )
}
