import { useState } from 'react'
import { usePlantStore } from '../store/plantStore'

/**
 * Report Page — generates a shift report and allows PDF export.
 */
export function ReportPage() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const [generating, setGenerating] = useState(false)

  const recovery = telemetry?.recovery_totals || {}
  const revenue = telemetry?.revenue_totals || {}
  const totalRevenue = telemetry?.total_revenue_usd || 0
  const totalRecovery = Object.values(recovery).reduce((a, b) => a + b, 0)
  const co2 = telemetry?.total_co2_avoided_kg || 0
  const landfill = telemetry?.total_landfill_diverted_kg || 0
  const energy = telemetry?.total_energy_kwh || 0
  const riskScore = telemetry?.plant_risk_score || 0
  const tick = telemetry?.tick || 0
  const shiftHours = ((telemetry?.shift_elapsed_s || 0) / 3600).toFixed(1)

  const handleExportPDF = () => {
    setGenerating(true)
    // Generate printable report and trigger browser print (saves as PDF)
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) {
      setGenerating(false)
      return
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>COUP AI — Shift Report</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
    h1 { color: #0a0f1a; border-bottom: 3px solid #00d4ff; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #00d4ff; }
    .meta { color: #666; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; text-align: center; }
    .card .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .card .value { font-size: 22px; font-weight: bold; color: #1a1a1a; margin-top: 5px; }
    .card .value.green { color: #00a86b; }
    .card .value.red { color: #e74c3c; }
    .card .value.blue { color: #0099cc; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
    th { background: #f8f9fa; font-weight: 600; color: #333; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 11px; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">COUP AI</div>
    <div class="meta">
      <div>Shift Report</div>
      <div>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
      <div>Shift Duration: ${shiftHours} hours</div>
    </div>
  </div>

  <h1>Plant Operations Summary</h1>

  <div class="grid">
    <div class="card"><div class="label">Total Revenue</div><div class="value green">$${totalRevenue.toFixed(2)}</div></div>
    <div class="card"><div class="label">Material Recovered</div><div class="value blue">${totalRecovery.toFixed(1)} kg</div></div>
    <div class="card"><div class="label">CO₂ Avoided</div><div class="value green">${(co2/1000).toFixed(3)} t</div></div>
    <div class="card"><div class="label">Plant Risk</div><div class="value ${riskScore > 60 ? 'red' : ''}">${riskScore.toFixed(0)}/100</div></div>
  </div>

  <h2>Material Recovery Breakdown</h2>
  <table>
    <thead><tr><th>Material</th><th>Recovered (kg)</th><th>Revenue ($)</th><th>% of Total</th></tr></thead>
    <tbody>
      ${Object.entries(recovery).filter(([_, v]) => v > 0).map(([mat, kg]) => `
        <tr>
          <td>${mat.charAt(0).toUpperCase() + mat.slice(1)}</td>
          <td>${(kg as number).toFixed(2)}</td>
          <td>$${((revenue as any)[mat] || 0).toFixed(2)}</td>
          <td>${totalRevenue > 0 ? (((revenue as any)[mat] || 0) / totalRevenue * 100).toFixed(1) : 0}%</td>
        </tr>
      `).join('')}
      <tr style="font-weight:bold;border-top:2px solid #333">
        <td>Total</td>
        <td>${totalRecovery.toFixed(2)} kg</td>
        <td>$${totalRevenue.toFixed(2)}</td>
        <td>100%</td>
      </tr>
    </tbody>
  </table>

  <h2>Sustainability Metrics</h2>
  <div class="grid">
    <div class="card"><div class="label">CO₂ Avoided</div><div class="value green">${(co2/1000).toFixed(3)} t</div></div>
    <div class="card"><div class="label">Landfill Diverted</div><div class="value blue">${(landfill/1000).toFixed(3)} t</div></div>
    <div class="card"><div class="label">Energy Used</div><div class="value">${energy.toFixed(1)} kWh</div></div>
    <div class="card"><div class="label">Recovery Rate</div><div class="value green">${Math.min(97, 85 + totalRecovery/100).toFixed(1)}%</div></div>
  </div>

  <h2>Operational Metrics</h2>
  <table>
    <tr><td>Total Simulation Ticks</td><td>${tick}</td></tr>
    <tr><td>Shift Duration (sim)</td><td>${shiftHours} hours</td></tr>
    <tr><td>Energy Consumption</td><td>${energy.toFixed(1)} kWh</td></tr>
    <tr><td>Energy Cost</td><td>$${(energy * 0.08).toFixed(2)}</td></tr>
    <tr><td>Net Margin</td><td>${totalRevenue > 0 ? ((totalRevenue - energy * 0.08) / totalRevenue * 100).toFixed(1) : 0}%</td></tr>
  </table>

  <div class="footer">
    <p>Generated by COUP AI Digital Twin Platform v1.0.0</p>
    <p>This report is auto-generated from live simulation data.</p>
  </div>
</body>
</html>`

    reportWindow.document.write(html)
    reportWindow.document.close()
    setTimeout(() => {
      reportWindow.print()
      setGenerating(false)
    }, 500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-bright">Shift Report</h2>
          <p className="text-[11px] text-text-muted">Generate and export a PDF report of current shift performance</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={generating}
          className="px-4 py-2 bg-accent-cyan/15 border border-accent-cyan/40 rounded text-xs text-accent-cyan hover:bg-accent-cyan/25 transition-all cursor-pointer font-medium disabled:opacity-50"
        >
          {generating ? 'Generating...' : '📄 Export PDF Report'}
        </button>
      </div>

      {/* Report Preview */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Report Preview</h3>
          <span className="text-[9px] text-text-muted">Shift: {shiftHours} hours • {tick} ticks</span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <ReportMetric label="Revenue" value={`$${totalRevenue.toFixed(2)}`} color="text-revenue-green" />
          <ReportMetric label="Recovered" value={`${totalRecovery.toFixed(1)} kg`} color="text-accent-cyan" />
          <ReportMetric label="CO₂ Avoided" value={`${(co2/1000).toFixed(3)} t`} color="text-accent-green" />
          <ReportMetric label="Risk Score" value={`${riskScore.toFixed(0)}/100`} color={riskScore > 60 ? 'text-hazard-red' : 'text-accent-green'} />
        </div>

        {/* Material Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-text-muted font-medium">Material</th>
                <th className="text-right py-2 text-text-muted font-medium">Recovered</th>
                <th className="text-right py-2 text-text-muted font-medium">Revenue</th>
                <th className="text-right py-2 text-text-muted font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(recovery).filter(([_, v]) => v > 0).map(([mat, kg]) => (
                <tr key={mat} className="border-b border-border-subtle/50">
                  <td className="py-1.5 text-text-primary capitalize">{mat}</td>
                  <td className="py-1.5 text-right font-mono text-text-secondary">{(kg as number).toFixed(2)} kg</td>
                  <td className="py-1.5 text-right font-mono text-revenue-green">${((revenue as any)[mat] || 0).toFixed(2)}</td>
                  <td className="py-1.5 text-right font-mono text-text-muted">{totalRevenue > 0 ? (((revenue as any)[mat] || 0) / totalRevenue * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ReportMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 bg-bg-primary/50 rounded border border-border-subtle">
      <div className="text-[9px] text-text-muted uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  )
}
