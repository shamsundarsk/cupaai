/**
 * 3D Plant Scene — Three.js isometric factory floor.
 * Conveyor belts, machines, material flow, clickable stations.
 */
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import { ConveyorBelt3D } from './ConveyorBelt3D'
import { Machine3D } from './Machine3D'
import { MaterialParticles } from './MaterialParticles'
import { Floor } from './Floor'
import { usePlantStore } from '../../store/plantStore'

interface PlantSceneProps {
  onStationClick: (stationId: string) => void
  modalOpen?: boolean
}

export function PlantScene({ onStationClick, modalOpen = false }: PlantSceneProps) {
  const telemetry = usePlantStore((s) => s.telemetry)
  const stations = telemetry?.stations || {}
  const batteries = telemetry?.batteries_in_system || []
  const alerts = telemetry?.hazard_alerts || []

  return (
    <Canvas shadows camera={{ position: [20, 18, 20], fov: 45 }}>
      <PerspectiveCamera makeDefault position={[20, 18, 20]} fov={45} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.2}
        target={[5, 0, 4]}
      />

      {/* Bright industrial lighting */}
      <ambientLight intensity={0.7} color="#f0f9ff" />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.4}
        color="#ffffff"
        castShadow
        shadow-mapSize={2048}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <directionalLight position={[-10, 15, -10]} intensity={0.5} color="#dbeafe" />
      <hemisphereLight args={['#dbeafe', '#475569', 0.6]} />

      <Floor />

      {/* === ZONE LABELS === */}
      {!modalOpen && (
        <>
          <Html position={[-9, 0.5, -3]} center>
            <div className="pointer-events-none px-3 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg border-2 border-blue-300">
              1. INPUT ZONE
            </div>
          </Html>
          <Html position={[12, 0.5, -5.5]} center>
            <div className="pointer-events-none px-3 py-1 rounded-md bg-amber-500 text-white text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg border-2 border-amber-300">
              2. PROCESSING
            </div>
          </Html>
          <Html position={[22, 0.5, -6.5]} center>
            <div className="pointer-events-none px-3 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg border-2 border-emerald-300">
              3. RECOVERY
            </div>
          </Html>
          <Html position={[4, 0.5, 12]} center>
            <div className="pointer-events-none px-3 py-1 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg border-2 border-red-300 animate-pulse">
              HAZARD ZONE
            </div>
          </Html>
        </>
      )}

      {/* INTAKE */}
      <Machine3D id="intake" position={[-12, 0, 0]} size={[3, 1.5, 2]} color="#3b82f6" label="Intake"
        isActive={stations.intake === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'intake').length}
        onClick={onStationClick} hideLabel={modalOpen} />

      <ConveyorBelt3D start={[-10, 0, 0]} end={[-6, 0, 0]} active={stations.intake === 'processing'} />

      {/* INSPECTION */}
      <Machine3D id="inspection" position={[-4, 0, 0]} size={[2.5, 2, 2]} color="#6366f1" label="Inspection"
        isActive={stations.inspection === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'inspection').length}
        onClick={onStationClick} hideLabel={modalOpen} />

      <ConveyorBelt3D start={[-2, 0, 0]} end={[2, 0, 0]} active={stations.inspection === 'processing'} />

      {/* SORTING */}
      <Machine3D id="sorting" position={[4, 0, 0]} size={[2.5, 2.5, 2.5]} color="#a855f7" label="AI Sorting"
        isActive={stations.sorting === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'sorting').length}
        onClick={onStationClick} hideLabel={modalOpen} isSpecial />

      <ConveyorBelt3D start={[6, 0, 0]} end={[9, 0, 0]} active={stations.conveyor_a === 'processing'} />
      <ConveyorBelt3D start={[4, 0, 2]} end={[4, 0, 7]} active={alerts.length > 0} color="#ef4444" />

      {/* HAZARD ISOLATION */}
      <Machine3D id="hazard_isolation" position={[4, 0, 9]} size={[3, 2, 3]} color="#ef4444" label="HAZARD"
        isActive={stations.hazard_isolation === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'hazard_isolation').length}
        onClick={onStationClick} hideLabel={modalOpen} isHazard />

      {/* SHREDDER */}
      <Machine3D id="shredder" position={[11, 0, -2]} size={[2.5, 3, 2]} color="#f59e0b" label="Shredder"
        isActive={stations.shredder === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'shredder').length}
        onClick={onStationClick} hideLabel={modalOpen} />

      <ConveyorBelt3D start={[11, 0, -0.5]} end={[11, 0, 2]} active={stations.shredder === 'processing'} />

      {/* MAGNETIC SEP */}
      <Machine3D id="magnetic_sep" position={[11, 0, 4]} size={[2, 2, 2]} color="#eab308" label="Mag Sep"
        isActive={stations.magnetic_sep === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'magnetic_sep').length}
        onClick={onStationClick} hideLabel={modalOpen} />

      <ConveyorBelt3D start={[12.5, 0, 4]} end={[15, 0, 4]} active={stations.density_sep === 'processing'} />

      {/* DENSITY SEP */}
      <Machine3D id="density_sep" position={[17, 0, 4]} size={[2, 2, 2]} color="#f97316" label="Density"
        isActive={stations.density_sep === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'density_sep').length}
        onClick={onStationClick} hideLabel={modalOpen} />

      {/* RECOVERY STATIONS */}
      <ConveyorBelt3D start={[18.5, 0, 2.5]} end={[21, 0, -1]} active={stations.lead_furnace === 'processing'} />

      <Machine3D id="lead_furnace" position={[22, 0, -3]} size={[3, 3.5, 3]} color="#f97316" label="Lead Furnace"
        isActive={stations.lead_furnace === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'lead_furnace').length}
        onClick={onStationClick} hideLabel={modalOpen} isFurnace />

      <ConveyorBelt3D start={[18.5, 0, 3.5]} end={[21, 0, 2]} active={stations.lithium_recovery === 'processing'} />

      <Machine3D id="lithium_recovery" position={[22, 0, 1]} size={[2.5, 2.5, 2]} color="#a855f7" label="Li Recovery"
        isActive={stations.lithium_recovery === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'lithium_recovery').length}
        onClick={onStationClick} hideLabel={modalOpen} />

      <ConveyorBelt3D start={[18.5, 0, 5]} end={[21, 0, 6]} active={stations.copper_recovery === 'processing'} />

      <Machine3D id="copper_recovery" position={[22, 0, 7]} size={[2.5, 2.5, 2]} color="#f97316" label="Cu Recovery"
        isActive={stations.copper_recovery === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'copper_recovery').length}
        onClick={onStationClick} hideLabel={modalOpen} />

      <ConveyorBelt3D start={[18.5, 0, 5.5]} end={[21, 0, 10]} active={stations.plastic_line === 'processing'} />

      <Machine3D id="plastic_line" position={[22, 0, 11]} size={[2.5, 2, 2.5]} color="#22c55e" label="Plastic"
        isActive={stations.plastic_line === 'processing'}
        itemCount={batteries.filter(b => b.current_station === 'plastic_line').length}
        onClick={onStationClick} hideLabel={modalOpen} />

      <MaterialParticles batteries={batteries} />
    </Canvas>
  )
}
