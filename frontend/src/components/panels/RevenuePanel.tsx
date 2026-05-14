import { usePlantStore } from '../../store/plantStore'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

export function RevenuePanel() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const revenueHistory = usePlantStore((s) => s.revenueHistory)

  const totalRevenue = telemetry?.total_revenue_usd || 0
  const revenueTotals = telemetry?.revenue_totals || {}
  const leadRevenue = revenueTotals.lead || 0
  const leadPct = totalRevenue > 0 ? (leadRevenue / totalRevenue * 100) : 0

  // Revenue rate ($/min approximation)
  const revenueRate = revenueHistory.length > 4
    ? ((revenueHistory[revenueHistory.length - 1] - revenueHistory[revenueHistory.length - 5]) / 5 * 120)
    : 0

  const chartData = revenueHistory.map((v, i) => ({ i, v }))

  return (
    <div className="glass-panel-glow p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Revenue Today</h3>
        <span className="text-[10px] text-revenue-green">
          ▲ ${revenueRate.toFixed(0)}/min
        </span>
      </div>

      {/* Big Revenue Number */}
      <div className="text-3xl font-bold text-revenue-green font-mono mb-1">
        ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      {/* Lead contribution */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className="h-full bg-revenue-green rounded-full transition-all duration-500"
            style={{ width: `${leadPct}%` }}
          />
        </div>
        <span className="text-[10px] text-text-muted">{leadPct.toFixed(0)}% Lead</span>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        {Object.entries(revenueTotals).filter(([_, v]) => v > 0).map(([mat, val]) => (
          <div key={mat} className="text-center p-1 bg-bg-primary/50 rounded">
            <div className="text-[9px] text-text-muted capitalize">{mat}</div>
            <div className="text-[11px] text-text-primary font-mono">${val.toFixed(0)}</div>
          </div>
        ))}
      </div>

      {/* Mini sparkline */}
      {chartData.length > 5 && (
        <div className="h-[30px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
