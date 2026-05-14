import { useState } from 'react'

/**
 * Cost-Benefit Calculator — input plant parameters, get ROI projection.
 */
export function CalculatorPage() {
  const [batteriesPerDay, setBatteriesPerDay] = useState(500)
  const [avgBatteryWeight, setAvgBatteryWeight] = useState(12)
  const [leadAcidPercent, setLeadAcidPercent] = useState(35)
  const [lithiumPercent, setLithiumPercent] = useState(25)
  const [operatingHours, setOperatingHours] = useState(16)
  const [energyCostKwh, setEnergyCostKwh] = useState(0.08)

  // Calculations
  const totalWeightPerDay = batteriesPerDay * avgBatteryWeight
  const leadWeight = totalWeightPerDay * (leadAcidPercent / 100) * 0.60 // 60% of lead-acid is lead
  const lithiumWeight = totalWeightPerDay * (lithiumPercent / 100) * 0.07
  const copperWeight = totalWeightPerDay * 0.08 // ~8% copper across all types
  const plasticWeight = totalWeightPerDay * 0.10

  const leadRevenue = leadWeight * 0.97 * 2.10 // 97% purity × $2.10/kg
  const lithiumRevenue = lithiumWeight * 0.92 * 14.50
  const copperRevenue = copperWeight * 0.95 * 9.50
  const plasticRevenue = plasticWeight * 0.80 * 0.85

  const dailyRevenue = leadRevenue + lithiumRevenue + copperRevenue + plasticRevenue
  const monthlyRevenue = dailyRevenue * 26 // 26 working days
  const annualRevenue = dailyRevenue * 300

  const dailyEnergyCost = operatingHours * 85 * energyCostKwh // ~85kW avg plant draw
  const dailyLaborCost = operatingHours * 45 // $45/hr labor
  const dailyCost = dailyEnergyCost + dailyLaborCost + (dailyRevenue * 0.05) // 5% consumables
  const dailyProfit = dailyRevenue - dailyCost
  const annualProfit = dailyProfit * 300
  const marginPercent = (dailyProfit / dailyRevenue) * 100

  // Platform ROI
  const platformCostMonthly = 10000 // $10K/month SaaS
  const efficiencyGain = 0.12 // 12% improvement from optimization
  const additionalRevenue = annualRevenue * efficiencyGain
  const platformROI = ((additionalRevenue - platformCostMonthly * 12) / (platformCostMonthly * 12)) * 100

  // Hazard prevention value
  const avgFireCost = 250000
  const firesPreventedPerYear = 4
  const hazardSavings = avgFireCost * firesPreventedPerYear

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-bright">Cost-Benefit Calculator</h2>
        <p className="text-[11px] text-text-muted">Input your plant parameters to see projected revenue and platform ROI</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Input Panel */}
        <div className="glass-panel p-5">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Plant Parameters</h3>
          
          <div className="space-y-4">
            <SliderInput label="Batteries processed per day" value={batteriesPerDay} min={50} max={2000} step={50} unit="units" onChange={setBatteriesPerDay} />
            <SliderInput label="Average battery weight" value={avgBatteryWeight} min={1} max={50} step={1} unit="kg" onChange={setAvgBatteryWeight} />
            <SliderInput label="Lead-acid battery %" value={leadAcidPercent} min={0} max={80} step={5} unit="%" onChange={setLeadAcidPercent} />
            <SliderInput label="Lithium-ion battery %" value={lithiumPercent} min={0} max={80} step={5} unit="%" onChange={setLithiumPercent} />
            <SliderInput label="Operating hours per day" value={operatingHours} min={8} max={24} step={1} unit="hrs" onChange={setOperatingHours} />
            <SliderInput label="Energy cost" value={energyCostKwh} min={0.04} max={0.20} step={0.01} unit="$/kWh" onChange={setEnergyCostKwh} />
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-3">
          {/* Revenue Projection */}
          <div className="glass-panel-glow p-4">
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Revenue Projection</h3>
            <div className="grid grid-cols-3 gap-3">
              <ResultCard label="Daily" value={`$${dailyRevenue.toFixed(0)}`} color="text-revenue-green" />
              <ResultCard label="Monthly" value={`$${(monthlyRevenue / 1000).toFixed(1)}K`} color="text-revenue-green" />
              <ResultCard label="Annual" value={`$${(annualRevenue / 1000000).toFixed(2)}M`} color="text-revenue-green" />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <MiniResult label="Lead" value={`$${leadRevenue.toFixed(0)}/day`} />
              <MiniResult label="Lithium" value={`$${lithiumRevenue.toFixed(0)}/day`} />
              <MiniResult label="Copper" value={`$${copperRevenue.toFixed(0)}/day`} />
              <MiniResult label="Plastic" value={`$${plasticRevenue.toFixed(0)}/day`} />
            </div>
          </div>

          {/* Profitability */}
          <div className="glass-panel p-4">
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Profitability</h3>
            <div className="grid grid-cols-3 gap-3">
              <ResultCard label="Daily Profit" value={`$${dailyProfit.toFixed(0)}`} color={dailyProfit > 0 ? 'text-revenue-green' : 'text-hazard-red'} />
              <ResultCard label="Annual Profit" value={`$${(annualProfit / 1000000).toFixed(2)}M`} color="text-revenue-green" />
              <ResultCard label="Margin" value={`${marginPercent.toFixed(1)}%`} color="text-accent-cyan" />
            </div>
            <div className="mt-3 space-y-1 text-[10px] text-text-muted">
              <div className="flex justify-between"><span>Energy cost</span><span className="font-mono">${dailyEnergyCost.toFixed(0)}/day</span></div>
              <div className="flex justify-between"><span>Labor cost</span><span className="font-mono">${dailyLaborCost.toFixed(0)}/day</span></div>
              <div className="flex justify-between"><span>Consumables</span><span className="font-mono">${(dailyRevenue * 0.05).toFixed(0)}/day</span></div>
            </div>
          </div>

          {/* Platform ROI */}
          <div className="glass-panel p-4 border border-accent-cyan/20">
            <h3 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider mb-3">COUP AI Platform ROI</h3>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Efficiency Gain (+12%)" value={`+$${(additionalRevenue / 1000).toFixed(0)}K/yr`} color="text-revenue-green" />
              <ResultCard label="Hazard Prevention" value={`+$${(hazardSavings / 1000).toFixed(0)}K/yr`} color="text-accent-cyan" />
            </div>
            <div className="mt-3 p-2 bg-accent-cyan/5 rounded border border-accent-cyan/10">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-secondary">Platform cost: $10K/month</span>
                <span className="text-sm font-bold font-mono text-accent-cyan">{platformROI.toFixed(0)}% ROI</span>
              </div>
              <div className="text-[9px] text-text-muted mt-1">
                Payback period: {((platformCostMonthly * 12) / (additionalRevenue + hazardSavings) * 12).toFixed(1)} months
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function SliderInput({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-text-secondary">{label}</span>
        <span className="text-[11px] font-mono text-text-primary">{value} {unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

function ResultCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 bg-bg-primary/50 rounded">
      <div className="text-[9px] text-text-muted">{label}</div>
      <div className={`text-base font-bold font-mono ${color}`}>{value}</div>
    </div>
  )
}

function MiniResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-1.5 bg-bg-primary/30 rounded">
      <div className="text-[8px] text-text-muted">{label}</div>
      <div className="text-[10px] font-mono text-text-secondary">{value}</div>
    </div>
  )
}
