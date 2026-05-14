import { usePlantStore } from '../store/plantStore'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

/**
 * Revenue & Recovery Page — shows the money story clearly.
 * Lead extraction is highlighted as the primary income source.
 */
export function RevenuePage() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const revenueHistory = usePlantStore((s) => s.revenueHistory)

  const recovery = telemetry?.recovery_totals || {}
  const revenue = telemetry?.revenue_totals || {}
  const totalRevenue = telemetry?.total_revenue_usd || 0
  const energy = telemetry?.total_energy_kwh || 0

  // Calculate margins
  const energyCost = energy * 0.08
  const laborCost = (telemetry?.shift_elapsed_s || 0) / 3600 * 45
  const netProfit = totalRevenue - energyCost - laborCost
  const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0

  // Revenue breakdown for bar chart
  const revenueBreakdown = Object.entries(revenue)
    .filter(([_, v]) => v > 0)
    .map(([material, value]) => ({
      name: MATERIAL_LABELS[material] || material,
      value: Number(value.toFixed(2)),
      color: MATERIAL_COLORS[material] || '#64748b',
    }))
    .sort((a, b) => b.value - a.value)

  // Recovery breakdown
  const recoveryBreakdown = Object.entries(recovery)
    .filter(([_, v]) => v > 0)
    .map(([material, kg]) => ({
      material,
      label: MATERIAL_LABELS[material] || material,
      kg: Number(kg.toFixed(2)),
      revenue: revenue[material] || 0,
      pricePerKg: PRICES[material] || 0,
      color: MATERIAL_COLORS[material] || '#64748b',
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Revenue & Material Recovery</h2>
        <p className="text-sm text-text-muted">How the plant makes money — recovered materials sold at market prices</p>
      </div>

      {/* Top — Revenue Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass-panel-glow p-4">
          <div className="text-[10px] text-text-muted uppercase">Total Revenue</div>
          <div className="text-2xl font-bold font-mono text-revenue-green">${totalRevenue.toFixed(2)}</div>
          <div className="text-[10px] text-text-muted mt-1">From all recovered materials</div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-[10px] text-text-muted uppercase">Lead Revenue</div>
          <div className="text-2xl font-bold font-mono text-text-primary">${(revenue.lead || 0).toFixed(2)}</div>
          <div className="text-[10px] text-revenue-green mt-1">
            {totalRevenue > 0 ? ((revenue.lead || 0) / totalRevenue * 100).toFixed(0) : 0}% of total
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-[10px] text-text-muted uppercase">Energy Cost</div>
          <div className="text-2xl font-bold font-mono text-accent-amber">${energyCost.toFixed(2)}</div>
          <div className="text-[10px] text-text-muted mt-1">{energy.toFixed(1)} kWh consumed</div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-[10px] text-text-muted uppercase">Net Margin</div>
          <div className={`text-2xl font-bold font-mono ${marginPct > 0 ? 'text-revenue-green' : 'text-hazard-red'}`}>
            {marginPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-text-muted mt-1">After energy + labor</div>
        </div>
      </div>

      {/* Middle — Charts */}
      <div className="grid grid-cols-2 gap-3">
        {/* Revenue Over Time */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Revenue Growth</h3>
          <p className="text-xs text-text-muted mb-3">Cumulative revenue this shift</p>
          {revenueHistory.length > 5 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueHistory.map((v, i) => ({ tick: i, revenue: v }))}>
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98115" strokeWidth={2} dot={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3441', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-text-muted">Collecting data...</div>
          )}
        </div>

        {/* Revenue by Material */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Revenue by Material</h3>
          <p className="text-xs text-text-muted mb-3">Which materials generate the most income</p>
          {revenueBreakdown.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBreakdown} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={60} />
                  <Tooltip
                    contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3441', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {revenueBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-text-muted">No recovery yet...</div>
          )}
        </div>
      </div>

      {/* Bottom — Detailed Recovery Table */}
      <div className="glass-panel p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">📊 Material Recovery Breakdown</h3>
        <p className="text-xs text-text-muted mb-3">Detailed view of what's been recovered and its market value</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-text-muted font-medium">Material</th>
                <th className="text-right py-2 text-text-muted font-medium">Recovered (kg)</th>
                <th className="text-right py-2 text-text-muted font-medium">Market Price ($/kg)</th>
                <th className="text-right py-2 text-text-muted font-medium">Revenue ($)</th>
                <th className="text-right py-2 text-text-muted font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {recoveryBreakdown.map(item => (
                <tr key={item.material} className="border-b border-border/30">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-text-primary">{item.label}</span>
                    </div>
                  </td>
                  <td className="text-right py-2 font-mono text-text-primary">{item.kg.toFixed(2)}</td>
                  <td className="text-right py-2 font-mono text-text-secondary">${item.pricePerKg.toFixed(2)}</td>
                  <td className="text-right py-2 font-mono text-revenue-green">${item.revenue.toFixed(2)}</td>
                  <td className="text-right py-2 font-mono text-text-secondary">
                    {totalRevenue > 0 ? (item.revenue / totalRevenue * 100).toFixed(1) : '0'}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td className="py-2 font-semibold text-text-primary">Total</td>
                <td className="text-right py-2 font-mono font-semibold text-text-primary">
                  {recoveryBreakdown.reduce((a, b) => a + b.kg, 0).toFixed(2)}
                </td>
                <td className="text-right py-2">—</td>
                <td className="text-right py-2 font-mono font-semibold text-revenue-green">${totalRevenue.toFixed(2)}</td>
                <td className="text-right py-2 font-mono text-text-secondary">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- Constants ---

const MATERIAL_LABELS: Record<string, string> = {
  lead: 'Lead (Pb)',
  lithium: 'Lithium (Li)',
  copper: 'Copper (Cu)',
  cobalt: 'Cobalt (Co)',
  aluminum: 'Aluminum (Al)',
  plastic: 'Plastic',
}

const MATERIAL_COLORS: Record<string, string> = {
  lead: '#94a3b8',
  lithium: '#a855f7',
  copper: '#f97316',
  cobalt: '#3b82f6',
  aluminum: '#6b7280',
  plastic: '#22c55e',
}

const PRICES: Record<string, number> = {
  lead: 2.10,
  lithium: 14.50,
  copper: 9.50,
  cobalt: 28.00,
  aluminum: 2.50,
  plastic: 0.85,
}
