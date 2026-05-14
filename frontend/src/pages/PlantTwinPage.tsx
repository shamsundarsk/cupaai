import { useState } from 'react'
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
          <span>🖱️ Drag to rotate</span>
          <span>🔍 Scroll to zoom</span>
          <span>👆 Click machine for details</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 glass-panel relative overflow-hidden rounded-xl min-h-[500px]">
        <PlantScene onStationClick={setSelectedStation} />

        {/* Machine Detail Modal */}
        <MachineDetailModal
          stationId={selectedStation}
          onClose={() => setSelectedStation(null)}
        />
      </div>

      {/* Bottom info bar */}
      <div className="grid grid-cols-5 gap-2">
        <InfoBox label="Total in System" value={`${batteries.length}`} icon="📦" />
        <InfoBox label="At Intake" value={`${batteries.filter(b => b.current_station === 'intake').length}`} icon="📥" />
        <InfoBox label="Processing" value={`${batteries.filter(b => !['intake','storage','hazard_isolation'].includes(b.current_station)).length}`} icon="⚙️" />
        <InfoBox label="Hazard Isolated" value={`${batteries.filter(b => b.current_station === 'hazard_isolation').length}`} icon="☢️" />
        <InfoBox label="Completed" value={`${batteries.filter(b => b.current_station === 'storage').length}`} icon="✅" />
      </div>
    </div>
  )
}

function InfoBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="glass-panel p-2.5 flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <div>
        <div className="text-[9px] text-text-muted">{label}</div>
        <div className="text-sm font-mono font-semibold text-text-primary">{value}</div>
      </div>
    </div>
  )
}
