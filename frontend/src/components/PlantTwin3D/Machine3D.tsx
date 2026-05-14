/**
 * 3D Machine — colorful, clearly active/idle, readable at a glance.
 * Active = bright color + glow + animation
 * Idle = dim but still visible with color hint
 */
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface Machine3DProps {
  id: string
  position: [number, number, number]
  size: [number, number, number]
  color: string
  label: string
  isActive: boolean
  itemCount: number
  onClick: (id: string) => void
  isHazard?: boolean
  isFurnace?: boolean
  isSpecial?: boolean
  hideLabel?: boolean
}

export function Machine3D({
  id, position, size, color, label, isActive, itemCount, onClick,
  isHazard, isFurnace, isSpecial, hideLabel = false
}: Machine3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    timeRef.current += delta

    // Shredder vibration
    if (id === 'shredder' && isActive) {
      groupRef.current.position.x = position[0] + (Math.random() - 0.5) * 0.03
      groupRef.current.position.z = position[2] + (Math.random() - 0.5) * 0.03
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick(id)
  }
  const pointerOver = () => { setHovered(true); document.body.style.cursor = 'pointer' }
  const pointerOut = () => { setHovered(false); document.body.style.cursor = 'default' }

  // Color intensity based on state
  const baseColor = isActive ? color : '#1a2535'
  const emissiveColor = isActive ? color : (hovered ? color : '#000000')
  const emissiveIntensity = isActive ? 0.4 : (hovered ? 0.2 : 0)
  const opacity = isActive ? 1 : 0.7

  return (
    <group ref={groupRef} position={position}>
      {/* Machine body */}
      <group onClick={handleClick} onPointerOver={pointerOver} onPointerOut={pointerOut}>
        {isFurnace ? <FurnaceModel active={isActive} color={color} hovered={hovered} /> :
         isHazard ? <HazardModel active={isActive} itemCount={itemCount} hovered={hovered} /> :
         isSpecial ? <SorterModel active={isActive} color={color} hovered={hovered} time={timeRef.current} /> :
         id === 'shredder' ? <ShredderModel active={isActive} color={color} hovered={hovered} time={timeRef.current} /> :
         id === 'intake' ? <IntakeModel active={isActive} color={color} hovered={hovered} /> :
         id === 'inspection' ? <InspectionModel active={isActive} color={color} hovered={hovered} /> :
         (id === 'magnetic_sep' || id === 'density_sep') ? <SeparatorModel active={isActive} color={color} hovered={hovered} time={timeRef.current} /> :
         (id === 'lithium_recovery' || id === 'copper_recovery') ? <TankModel active={isActive} color={color} hovered={hovered} /> :
         id === 'plastic_line' ? <ExtruderModel active={isActive} color={color} hovered={hovered} /> :
         <DefaultModel active={isActive} color={color} size={size} hovered={hovered} />}
      </group>

      {/* Activity ring — always visible, shows if machine is doing something */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size[0] * 0.7, size[0] * 0.75, 32]} />
        <meshStandardMaterial
          color={isActive ? color : '#1e2a3a'}
          emissive={isActive ? color : '#000'}
          emissiveIntensity={isActive ? 0.6 : 0}
          transparent
          opacity={isActive ? 0.8 : 0.3}
        />
      </mesh>

      {/* Status beacon on top */}
      <mesh position={[0, size[1] / 2 + 0.8, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color={isActive ? (isHazard ? '#ff4757' : '#00e68a') : '#2a3441'}
          emissive={isActive ? (isHazard ? '#ff4757' : '#00e68a') : '#000'}
          emissiveIntensity={isActive ? 2 : 0}
        />
      </mesh>

      {/* Point light when active — makes machine glow on the floor */}
      {isActive && !isFurnace && (
        <pointLight position={[0, 1, 0]} color={color} intensity={1.5} distance={4} />
      )}

      {/* Label */}
      {!hideLabel && (
        <Html position={[0, size[1] / 2 + 1.4, 0]} center distanceFactor={18}>
          <div className="pointer-events-none select-none text-center whitespace-nowrap">
            <div className={`text-[9px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm border ${
              isActive
                ? 'text-white bg-black/80 border-white/20'
                : 'text-white/60 bg-black/60 border-white/5'
            }`}>
              {label}
            </div>
            {itemCount > 0 && (
              <div className="text-[8px] font-mono font-bold text-cyan-300 bg-cyan-900/80 px-1.5 py-0.5 rounded mt-0.5 border border-cyan-400/30">
                {itemCount} item{itemCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// === MACHINE MODELS (colorful versions) ===

function IntakeModel({ active, color, hovered }: { active: boolean; color: string; hovered: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[3, 0.8, 2.5]} />
        <meshStandardMaterial color={active ? '#1a3a5f' : '#0f1a2a'} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Colored top rim */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[3.1, 0.1, 2.6]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.5 : 0} />
      </mesh>
      {/* Ramp */}
      <mesh position={[0, 0.3, 1.5]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[2, 0.08, 1.5]} />
        <meshStandardMaterial color={active ? color : '#1a2a3a'} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.3 : 0} />
      </mesh>
    </group>
  )
}

function InspectionModel({ active, color, hovered }: { active: boolean; color: string; hovered: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[2.5, 0.3, 2]} />
        <meshStandardMaterial color="#0f1a2a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Arch */}
      <mesh position={[-1, 1.1, 0]}><boxGeometry args={[0.12, 2, 0.12]} /><meshStandardMaterial color={active ? color : '#2a3441'} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.4 : 0} /></mesh>
      <mesh position={[1, 1.1, 0]}><boxGeometry args={[0.12, 2, 0.12]} /><meshStandardMaterial color={active ? color : '#2a3441'} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.4 : 0} /></mesh>
      <mesh position={[0, 2.1, 0]}><boxGeometry args={[2.2, 0.25, 0.35]} /><meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.6 : 0.1} /></mesh>
      {/* Scan beam */}
      {active && <mesh position={[0, 1.1, 0]}><boxGeometry args={[1.8, 0.03, 0.03]} /><meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={3} transparent opacity={0.7} /></mesh>}
    </group>
  )
}

function SorterModel({ active, color, hovered, time }: { active: boolean; color: string; hovered: boolean; time: number }) {
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 1.2, 8]} />
        <meshStandardMaterial color={active ? '#1a1a3a' : '#0f0f1a'} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.12, 8]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.6 : 0.1} />
      </mesh>
      <mesh position={[0, 1.8, 0]} rotation={[0, active ? time * 2 : 0, 0]}>
        <coneGeometry args={[0.7, 0.7, 8]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.8 : 0.1} />
      </mesh>
      {active && <pointLight position={[0, 2.2, 0]} color={color} intensity={2} distance={4} />}
    </group>
  )
}

function ShredderModel({ active, color, hovered, time }: { active: boolean; color: string; hovered: boolean; time: number }) {
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[2.5, 1.8, 2]} />
        <meshStandardMaterial color={active ? '#2a2a0a' : '#0f0f0a'} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[2.7, 0.3, 2.2]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.5 : 0.1} />
      </mesh>
      {/* Rotating blades */}
      <group position={[0, 0.9, 0]} rotation={[active ? time * 5 : 0, 0, 0]}>
        {[0, Math.PI / 3, (2 * Math.PI) / 3].map((r, i) => (
          <mesh key={i} rotation={[r, 0, 0]}>
            <boxGeometry args={[2, 0.06, 0.25]} />
            <meshStandardMaterial color="#888" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function SeparatorModel({ active, color, hovered, time }: { active: boolean; color: string; hovered: boolean; time: number }) {
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[2, 1.2, 1.8]} />
        <meshStandardMaterial color={active ? '#1a2a1a' : '#0f1a0f'} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, active ? time * 2 : 0]}>
        <cylinderGeometry args={[0.6, 0.6, 1.6, 16]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.4 : 0.05} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

function FurnaceModel({ active, color, hovered }: { active: boolean; color: string; hovered: boolean }) {
  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 2, 12]} />
        <meshStandardMaterial color={active ? '#3a1a0a' : '#1a0a0a'} metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={active ? '#4a2a1a' : '#1a1a1a'} metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.5, 2.8, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 1.2, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Viewing port — BRIGHT when active */}
      <mesh position={[0, 0.6, 1.35]}>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color={active ? '#ff6b35' : '#1a1a1a'} emissive={active ? '#ff6b35' : '#000'} emissiveIntensity={active ? 3 : 0} />
      </mesh>
      {/* Fire glow */}
      {active && (
        <>
          <pointLight position={[0, 0.5, 0]} color="#ff6b35" intensity={4} distance={6} />
          <pointLight position={[0, 2.5, 0]} color="#ff4500" intensity={1.5} distance={4} />
        </>
      )}
      {/* Base ring */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.12, 12]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.3 : 0.05} />
      </mesh>
    </group>
  )
}

function TankModel({ active, color, hovered }: { active: boolean; color: string; hovered: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 1.8, 16]} />
        <meshStandardMaterial color={active ? '#1a2a3a' : '#0f1a2a'} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={active ? '#2a3441' : '#1a2a3a'} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Colored band */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.2, 16]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.6 : 0.1} />
      </mesh>
      {/* Pipes */}
      <mesh position={[0.9, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        <meshStandardMaterial color={active ? color : '#2a3441'} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.3 : 0} />
      </mesh>
      {active && <pointLight position={[0, 1, 0]} color={color} intensity={1} distance={3} />}
    </group>
  )
}

function ExtruderModel({ active, color, hovered }: { active: boolean; color: string; hovered: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 2.5, 12]} />
        <meshStandardMaterial color={active ? '#1a3a1a' : '#0f1a0f'} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.8, 1, 0]}>
        <coneGeometry args={[0.4, 0.6, 4]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.5 : 0.1} />
      </mesh>
      <mesh position={[1.4, 0.5, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.5]} />
        <meshStandardMaterial color={active ? color : '#1a2a3a'} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.4 : 0} />
      </mesh>
    </group>
  )
}

function HazardModel({ active, itemCount, hovered }: { active: boolean; itemCount: number; hovered: boolean }) {
  const hasItems = itemCount > 0
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[3, 1.2, 2.5]} />
        <meshStandardMaterial color={hasItems ? '#2a0a0a' : '#0f0a0a'} metalness={0.7} roughness={0.5} />
      </mesh>
      {/* Warning stripes */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 1.25, 0]}>
          <boxGeometry args={[0.12, 0.12, 2.5]} />
          <meshStandardMaterial color="#ff4757" emissive={hasItems ? '#ff4757' : '#000'} emissiveIntensity={hasItems ? 1 : 0.1} />
        </mesh>
      ))}
      {hasItems && <pointLight position={[0, 2, 0]} color="#ff4757" intensity={5} distance={7} />}
    </group>
  )
}

function DefaultModel({ active, color, size, hovered }: { active: boolean; color: string; size: [number, number, number]; hovered: boolean }) {
  return (
    <mesh position={[0, size[1] / 2, 0]} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={active ? color : '#1a2535'} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.3 : 0} metalness={0.5} roughness={0.5} transparent opacity={active ? 1 : 0.7} />
    </mesh>
  )
}
