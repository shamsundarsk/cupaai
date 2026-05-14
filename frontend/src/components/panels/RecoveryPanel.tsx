import { usePlantStore } from '../../store/plantStore'

const MATERIAL_COLORS: Record<string, string> = {
  lead: '#94a3b8',
  lithium: '#a855f7',
  copper: '#f97316',
  cobalt: '#3b82f6',
  aluminum: '#6b7280',
  plastic: '#22c55e',
}

const MATERIAL_LABELS: Record<string, string> = {
  lead: 'Pb',
  lithium: 'Li',
  copper: 'Cu',
  cobalt: 'Co',
  aluminum: 'Al',
  plastic: 'Pl',
}

export function RecoveryPanel() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const recoveryTotals = telemetry?.recovery_totals || {}

  const maxRecovery = Math.max(...Object.values(recoveryTotals), 1)

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Material Recovery</h3>
        <span className="text-[10px] text-text-muted">kg recovered</span>
      </div>

      <div className="space-y-1.5">
        {Object.entries(recoveryTotals).map(([material, kg]) => {
          const pct = (kg / maxRecovery) * 100
          const color = MATERIAL_COLORS[material] || '#64748b'
          const label = MATERIAL_LABELS[material] || material

          return (
            <div key={material} className="flex items-center gap-2">
              <span className="text-[10px] font-mono w-5 text-text-muted">{label}</span>
              <div className="flex-1 h-3 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-[11px] font-mono text-text-primary w-16 text-right">
                {kg.toFixed(1)} kg
              </span>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="mt-2 pt-2 border-t border-border flex justify-between">
        <span className="text-[10px] text-text-muted">Total Recovered</span>
        <span className="text-xs font-mono text-accent-cyan">
          {Object.values(recoveryTotals).reduce((a, b) => a + b, 0).toFixed(1)} kg
        </span>
      </div>
    </div>
  )
}
