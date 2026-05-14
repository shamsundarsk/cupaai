import { useState, useEffect } from 'react'
import { usePlantStore } from '../store/plantStore'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

/**
 * Shift Comparison — compares current shift to historical data.
 * Proves the twin has memory and can track performance over time.
 */

// Simulated historical shift data (in production, this would come from the database)
const HISTORICAL_SHIFTS = [
  { id: 'shift_1', date: 'Mon 06:00', revenue: 7840, recovery_kg: 3200, co2_avoided: 11200, hazards: 3, efficiency: 91.2, energy_kwh: 4800 },
  { id: 'shift_2', date: 'Mon 14:00', revenue: 8920, recovery_kg: 3650, co2_avoided: 12775, hazards: 2, efficiency: 93.1, energy_kwh: 5100 },
  { id: 'shift_3', date: 'Mon 22:00', revenue: 6540, recovery_kg: 2800, co2_avoided: 9800, hazards: 5, efficiency: 88.4, energy_kwh: 4200 },
  { id: 'shift_4', date: 'Tue 06:00', revenue: 9100, recovery_kg: 3800, co2_avoided: 13300, hazards: 1, efficiency: 94.5, energy_kwh: 5300 },
  { id: 'shift_5', date: 'Tue 14:00', revenue: 8450, recovery_kg: 3500, co2_avoided: 12250, hazards: 4, efficiency: 92.0, energy_kwh: 4900 },
]

export function ShiftComparisonPage() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const [selectedShift, setSelectedShift] = useState(HISTORICAL_SHIFTS[HISTORICAL_SHIFTS.length - 1])

  const currentRevenue = telemetry?.total_revenue_usd || 0
  const currentRecovery = Object.values(telemetry?.recovery_totals || {}).reduce((a, b) => a + b, 0)
  const currentCo2 = telemetry?.total_co2_avoided_kg || 0
  const currentEnergy = telemetry?.total_energy_kwh || 0
  const currentEfficiency = currentRecovery > 0 ? Math.min(97, 85 + currentRecovery / 100) : 0

  const currentShift = {
    id: 'current',
    date: 'Now',
    revenue: currentRevenue,
    recovery_kg: currentRecovery,
    co2_avoided: currentCo2,
    hazards: telemetry?.hazard_alerts.length || 0,
    efficiency: currentEfficiency,
    energy_kwh: currentEnergy,
  }

  // Comparison deltas
  const revenueDelta = currentRevenue - selectedShift.revenue
  const recoveryDelta = currentRecovery - selectedShift.recovery_kg
  const efficiencyDelta = currentEfficiency - selectedShift.efficiency

  // Chart data for revenue comparison
  const chartData = [...HISTORICAL_SHIFTS, currentShift].map(s => ({
    name: s.date,
    revenue: Math.round(s.revenue),
    isCurrent: s.id === 'current',
  }))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-bright">Shift Comparison</h2>
        <p className="text-[11px] text-text-muted">Compare current performance against historical shifts — the twin remembers</p>
      </div>

      {/* Shift Selector */}
      <div className="glass-panel p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] text-text-muted uppercase tracking-wider font-medium">Compare current shift to:</span>
        </div>
        <div className="flex gap-2">
          {HISTORICAL_SHIFTS.map(shift => (
            <button
              key={shift.id}
              onClick={() => setSelectedShift(shift)}
              className={`px-3 py-1.5 rounded text-[10px] transition-all cursor-pointer ${
                selectedShift.id === shift.id
                  ? 'bg-accent-cyan/15 border border-accent-cyan/40 text-accent-cyan'
                  : 'bg-bg-card border border-border text-text-secondary hover:border-border-active'
              }`}
            >
              {shift.date}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-3 gap-3">
        <ComparisonCard
          label="Revenue"
          current={`$${currentRevenue.toFixed(0)}`}
          previous={`$${selectedShift.revenue.toFixed(0)}`}
          delta={revenueDelta}
          unit="$"
          positive={revenueDelta > 0}
        />
        <ComparisonCard
          label="Recovery"
          current={`${currentRecovery.toFixed(0)} kg`}
          previous={`${selectedShift.recovery_kg.toFixed(0)} kg`}
          delta={recoveryDelta}
          unit="kg"
          positive={recoveryDelta > 0}
        />
        <ComparisonCard
          label="Efficiency"
          current={`${currentEfficiency.toFixed(1)}%`}
          previous={`${selectedShift.efficiency.toFixed(1)}%`}
          delta={efficiencyDelta}
          unit="%"
          positive={efficiencyDelta > 0}
        />
      </div>

      {/* Revenue Chart */}
      <div className="glass-panel p-4">
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Revenue Across Shifts</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4a5e78' }} />
              <YAxis tick={{ fontSize: 10, fill: '#4a5e78' }} />
              <Tooltip
                contentStyle={{ background: '#0d1321', border: '1px solid #1e2a3a', borderRadius: '6px', fontSize: '11px' }}
                formatter={(value: number) => [`$${value}`, 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isCurrent ? '#00d4ff' : '#1e3a5f'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="glass-panel p-4">
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Detailed Comparison</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-muted">Metric</th>
              <th className="text-right py-2 text-text-muted">Current Shift</th>
              <th className="text-right py-2 text-text-muted">{selectedShift.date}</th>
              <th className="text-right py-2 text-text-muted">Change</th>
            </tr>
          </thead>
          <tbody>
            <CompRow label="Revenue" current={`$${currentRevenue.toFixed(0)}`} prev={`$${selectedShift.revenue}`} delta={revenueDelta} format="$" />
            <CompRow label="Material Recovered" current={`${currentRecovery.toFixed(0)} kg`} prev={`${selectedShift.recovery_kg} kg`} delta={recoveryDelta} format="kg" />
            <CompRow label="CO₂ Avoided" current={`${(currentCo2/1000).toFixed(2)} t`} prev={`${(selectedShift.co2_avoided/1000).toFixed(2)} t`} delta={(currentCo2 - selectedShift.co2_avoided)/1000} format="t" />
            <CompRow label="Energy Used" current={`${currentEnergy.toFixed(0)} kWh`} prev={`${selectedShift.energy_kwh} kWh`} delta={currentEnergy - selectedShift.energy_kwh} format="kWh" invert />
            <CompRow label="Efficiency" current={`${currentEfficiency.toFixed(1)}%`} prev={`${selectedShift.efficiency}%`} delta={efficiencyDelta} format="%" />
            <CompRow label="Hazard Events" current={`${telemetry?.hazard_alerts.length || 0}`} prev={`${selectedShift.hazards}`} delta={(telemetry?.hazard_alerts.length || 0) - selectedShift.hazards} format="" invert />
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Sub-components ---

function ComparisonCard({ label, current, previous, delta, unit, positive }: {
  label: string; current: string; previous: string; delta: number; unit: string; positive: boolean
}) {
  return (
    <div className="glass-panel p-4">
      <div className="text-[9px] text-text-muted uppercase tracking-wider mb-2">{label}</div>
      <div className="text-xl font-bold font-mono text-text-bright mb-1">{current}</div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-muted">vs. {previous}</span>
        <span className={`text-[11px] font-mono font-semibold ${positive ? 'text-accent-green' : 'text-hazard-red'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}{unit}
        </span>
      </div>
    </div>
  )
}

function CompRow({ label, current, prev, delta, format, invert = false }: {
  label: string; current: string; prev: string; delta: number; format: string; invert?: boolean
}) {
  const isPositive = invert ? delta < 0 : delta > 0
  return (
    <tr className="border-b border-border-subtle/50">
      <td className="py-2 text-text-secondary">{label}</td>
      <td className="py-2 text-right font-mono text-text-primary">{current}</td>
      <td className="py-2 text-right font-mono text-text-muted">{prev}</td>
      <td className={`py-2 text-right font-mono font-semibold ${isPositive ? 'text-accent-green' : 'text-hazard-red'}`}>
        {delta > 0 ? '+' : ''}{delta.toFixed(1)} {format}
      </td>
    </tr>
  )
}
