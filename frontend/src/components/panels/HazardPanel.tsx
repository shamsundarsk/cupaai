import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { usePlantStore } from '../../store/plantStore'

export function HazardPanel() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const riskScore = telemetry?.plant_risk_score || 0
  const alerts = telemetry?.hazard_alerts || []

  const riskColor = riskScore > 70 ? 'text-hazard-red' : riskScore > 40 ? 'text-accent-amber' : 'text-accent-green'
  const riskBg = riskScore > 70 ? 'bg-hazard-red/20' : riskScore > 40 ? 'bg-accent-amber/20' : 'bg-accent-green/20'

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Hazard Monitor</h3>
        {riskScore > 60 && (
          <span className="text-[10px] px-2 py-0.5 bg-hazard-red/20 text-hazard-red rounded-full hazard-flash">
            ALERT
          </span>
        )}
      </div>

      {/* Risk Score Gauge */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-3xl font-bold ${riskColor} font-mono`}>
          {riskScore.toFixed(0)}
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-text-muted mb-1">Plant Risk Score</div>
          <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${riskBg}`}
              style={{ backgroundColor: riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#ffb800' : '#00ff9d' }}
              animate={{ width: `${riskScore}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="space-y-1 max-h-[100px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-[10px] text-text-muted">No active alerts</div>
        ) : (
          alerts.slice(-4).map((alert, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 bg-hazard-red/10 rounded border border-hazard-red/20">
              <AlertCircle size={11} strokeWidth={2} className="text-hazard-red flex-shrink-0" />
              <span className="text-text-secondary truncate">{alert.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
