import { useState } from 'react'
import { Mouse, ZoomIn, MousePointerClick, Box, Inbox, Settings, AlertTriangle, CheckCircle } from 'lucide-react'
import { usePlantStore } from '../store/plantStore'
import { PlantScene } from '../components/PlantTwin3D/PlantScene'
import { MachineDetailModal } from '../components/PlantTwin3D/MachineDetailModal'

/**
 * Plant Twin Page — 3D factory visualization with clickable machines.
 */
export function PlantTwinPage() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const telemetry = usePlantStore((s) => s.telemetry)
  const batteries = telemetry?.batteries_in_system || []

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">3D Plant Visualization</h2>
          <p className="text-sm text-text-muted">Click any machine to see what it does and its live status</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5"><Mouse size={12} /> Drag to rotate</span>
          <span className="flex items-center gap-1.5"><ZoomIn size={12} /> Scroll to zoom</span>
          <span className="flex items-center gap-1.5"><MousePointerClick size={12} /> Click for details</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative overflow-hidden rounded-xl min-h-[500px] border border-border" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #334155 50%, #475569 100%)' }}>
        <PlantScene onStationClick={setSelectedStation} modalOpen={selectedStation !== null} />

        {/* Machine Detail Modal */}
        <MachineDetailModal
          stationId={selectedStation}
          onClose={() => setSelectedStation(null)}
        />
      </div>

      {/* Bottom info bar */}
      <div className="grid grid-cols-5 gap-2">
        <InfoBox label="Total in System" value={`${batteries.length}`} Icon={Box} color="text-accent-cyan" />
        <InfoBox label="At Intake" value={`${batteries.filter(b => b.current_station === 'intake').length}`} Icon={Inbox} color="text-blue-400" />
        <InfoBox label="Processing" value={`${batteries.filter(b => !['intake','storage','hazard_isolation'].includes(b.current_station)).length}`} Icon={Settings} color="text-accent-amber" />
        <InfoBox label="Hazard Isolated" value={`${batteries.filter(b => b.current_station === 'hazard_isolation').length}`} Icon={AlertTriangle} color="text-hazard-red" />
        <InfoBox label="Completed" value={`${batteries.filter(b => b.current_station === 'storage').length}`} Icon={CheckCircle} color="text-accent-green" />
      </div>
    </div>
  )
}

function InfoBox({ label, value, Icon, color }: { label: string; value: string; Icon: any; color: string }) {
  return (
    <div className="glass-panel p-2.5 flex items-center gap-2.5">
      <Icon size={18} strokeWidth={1.8} className={color} />
      <div>
        <div className="text-[9px] text-text-muted">{label}</div>
        <div className="text-sm font-mono font-semibold text-text-primary">{value}</div>
      </div>
    </div>
  )
}
