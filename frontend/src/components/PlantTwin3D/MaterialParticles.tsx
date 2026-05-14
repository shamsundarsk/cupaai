/**
 * Material particles flowing through the plant.
 * Each battery in the system is represented as a glowing sphere.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BatteryItem } from '../../store/plantStore'

// Map station IDs to 3D positions
const STATION_3D_POS: Record<string, [number, number, number]> = {
  intake: [-12, 0.8, 0],
  inspection: [-4, 0.8, 0],
  sorting: [4, 0.8, 0],
  conveyor_a: [8, 0.8, 0],
  shredder: [11, 0.8, -2],
  magnetic_sep: [11, 0.8, 4],
  density_sep: [17, 0.8, 4],
  lead_furnace: [22, 0.8, -3],
  lithium_recovery: [22, 0.8, 1],
  copper_recovery: [22, 0.8, 7],
  plastic_line: [22, 0.8, 11],
  hazard_isolation: [4, 0.8, 9],
  storage: [22, 0.8, 14],
}

const MATERIAL_COLORS: Record<string, string> = {
  lead_acid: '#94a3b8',
  lithium_ion: '#a855f7',
  pcb: '#f97316',
  copper_heavy: '#f59e0b',
  plastic: '#22c55e',
  hazardous: '#ef4444',
  non_recyclable: '#6b7280',
}

interface MaterialParticlesProps {
  batteries: BatteryItem[]
}

export function MaterialParticles({ batteries }: MaterialParticlesProps) {
  return (
    <group>
      {batteries.slice(0, 25).map((battery, i) => (
        <Particle key={battery.id} battery={battery} index={i} />
      ))}
    </group>
  )
}

function Particle({ battery, index }: { battery: BatteryItem; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const pos = STATION_3D_POS[battery.current_station] || [0, 0.8, 0]
  const color = MATERIAL_COLORS[battery.material_type] || '#64748b'
  const isDangerous = battery.hazard_score > 50

  // Add slight offset so particles don't stack
  const offset = [(index % 3 - 1) * 0.4, 0, (Math.floor(index / 3) % 3 - 1) * 0.4]

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = pos[1] + Math.sin(Date.now() * 0.003 + index) * 0.1
      // Rotate
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[pos[0] + offset[0], pos[1], pos[2] + offset[2]]}
    >
      <sphereGeometry args={[isDangerous ? 0.25 : 0.18, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={isDangerous ? '#ef4444' : color}
        emissiveIntensity={isDangerous ? 0.8 : 0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}
