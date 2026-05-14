import { usePlantStore } from '../../store/plantStore'

export function SustainabilityPanel() {
  const telemetry = usePlantStore((s) => s.telemetry)

  const co2 = telemetry?.total_co2_avoided_kg || 0
  const landfill = telemetry?.total_landfill_diverted_kg || 0
  const energy = telemetry?.total_energy_kwh || 0
  const totalRecovery = Object.values(telemetry?.recovery_totals || {}).reduce((a, b) => a + b, 0)
  const efficiency = totalRecovery > 0 ? Math.min(97, 85 + (totalRecovery / 100)) : 0

  return (
    <div className="glass-panel p-3">
      <div className="mb-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sustainability</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* CO2 Avoided */}
        <div className="p-2 bg-bg-primary/50 rounded-lg">
          <div className="text-[10px] text-text-muted">CO₂ Avoided</div>
          <div className="text-sm font-mono text-accent-green font-bold">
            {(co2 / 1000).toFixed(2)} t
          </div>
          <div className="text-[9px] text-text-muted">≈ {Math.floor(co2 / 22)} trees/yr</div>
        </div>

        {/* Landfill Diverted */}
        <div className="p-2 bg-bg-primary/50 rounded-lg">
          <div className="text-[10px] text-text-muted">Landfill Diverted</div>
          <div className="text-sm font-mono text-accent-cyan font-bold">
            {(landfill / 1000).toFixed(2)} t
          </div>
        </div>

        {/* Energy */}
        <div className="p-2 bg-bg-primary/50 rounded-lg">
          <div className="text-[10px] text-text-muted">Energy Used</div>
          <div className="text-sm font-mono text-accent-amber font-bold">
            {energy.toFixed(1)} kWh
          </div>
        </div>

        {/* Recovery Efficiency */}
        <div className="p-2 bg-bg-primary/50 rounded-lg">
          <div className="text-[10px] text-text-muted">Recovery Eff.</div>
          <div className="text-sm font-mono text-accent-purple font-bold">
            {efficiency.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}
