/**
 * 3D Machine — bright, colorful, instantly recognizable industrial equipment.
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

    if (id === 'shredder' && isActive) {
      groupRef.current.position.x = position[0] + (Math.random() - 0.5) * 0.04
      groupRef.current.position.z = position[2] + (Math.random() - 0.5) * 0.04
    }
  })

  const handleClick = (e: any) => { e.stopPropagation(); onClick(id) }
  const pointerOver = () => { setHovered(true); document.body.style.cursor = 'pointer' }
  const pointerOut = () => { setHovered(false); document.body.style.cursor = 'default' }

  return (
    <group ref={groupRef} position={position}>
      <group onClick={handleClick} onPointerOver={pointerOver} onPointerOut={pointerOut}>
        {id === 'intake' && <IntakeBay active={isActive} hovered={hovered} />}
        {id === 'inspection' && <InspectionStation active={isActive} hovered={hovered} />}
        {id === 'sorting' && <AISorter active={isActive} hovered={hovered} time={timeRef.current} />}
        {id === 'shredder' && <Shredder active={isActive} hovered={hovered} time={timeRef.current} />}
        {id === 'magnetic_sep' && <MagneticSeparator active={isActive} hovered={hovered} time={timeRef.current} />}
        {id === 'density_sep' && <DensitySeparator active={isActive} hovered={hovered} time={timeRef.current} />}
        {id === 'lead_furnace' && <LeadFurnace active={isActive} hovered={hovered} />}
        {id === 'lithium_recovery' && <LithiumTank active={isActive} hovered={hovered} time={timeRef.current} />}
        {id === 'copper_recovery' && <CopperTank active={isActive} hovered={hovered} time={timeRef.current} />}
        {id === 'plastic_line' && <PlasticExtruder active={isActive} hovered={hovered} time={timeRef.current} />}
        {id === 'hazard_isolation' && <HazardBay active={isActive} itemCount={itemCount} hovered={hovered} time={timeRef.current} />}
      </group>

      {/* Glowing activity ring on the floor */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size[0] * 0.85, size[0] * 0.95, 32]} />
        <meshStandardMaterial
          color={isActive ? color : '#94a3b8'}
          emissive={isActive ? color : '#000'}
          emissiveIntensity={isActive ? 1 : 0}
          transparent
          opacity={isActive ? 0.9 : 0.3}
        />
      </mesh>

      {/* Status beacon — large and bright */}
      <group position={[0, size[1] + 0.5, 0]}>
        <mesh>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial
            color={isActive ? (isHazard ? '#ef4444' : '#10b981') : '#475569'}
            emissive={isActive ? (isHazard ? '#ef4444' : '#10b981') : '#000'}
            emissiveIntensity={isActive ? 3 : 0}
          />
        </mesh>
        {isActive && (
          <pointLight color={isHazard ? '#ef4444' : '#10b981'} intensity={1.5} distance={2} />
        )}
      </group>

      {/* Color-coded base point light */}
      {isActive && !isFurnace && (
        <pointLight position={[0, 1.5, 0]} color={color} intensity={2} distance={5} />
      )}

      {/* Label */}
      {!hideLabel && (
        <Html position={[0, size[1] + 1.2, 0]} center distanceFactor={16}>
          <div className="pointer-events-none select-none text-center whitespace-nowrap">
            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm border-2 ${
              isActive
                ? 'text-white bg-gradient-to-b from-slate-800 to-slate-900 border-white/30 shadow-lg'
                : 'text-white/80 bg-slate-700/90 border-white/10'
            }`} style={isActive ? { boxShadow: `0 0 12px ${color}80` } : {}}>
              {label}
            </div>
            {itemCount > 0 && (
              <div className="text-[9px] font-mono font-bold mt-1 px-2 py-0.5 rounded-full bg-cyan-500 text-white border border-cyan-300 shadow-md">
                {itemCount} item{itemCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// === MACHINE MODELS ===

function IntakeBay({ active, hovered }: { active: boolean; hovered: boolean }) {
  return (
    <group>
      {/* Main container — bright blue */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[3, 1.2, 2.5]} />
        <meshStandardMaterial
          color={active ? '#3b82f6' : '#60a5fa'}
          emissive={active ? '#3b82f6' : '#000'}
          emissiveIntensity={active ? 0.4 : 0}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      {/* Top rim — yellow safety */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[3.1, 0.12, 2.6]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} metalness={0.5} />
      </mesh>
      {/* Cargo containers inside */}
      <mesh position={[-0.7, 0.9, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.8]} />
        <meshStandardMaterial color="#dc2626" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0.7, 0.9, 0.5]}>
        <boxGeometry args={[0.8, 0.5, 0.8]} />
        <meshStandardMaterial color="#16a34a" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.9, -0.5]}>
        <boxGeometry args={[0.8, 0.5, 0.8]} />
        <meshStandardMaterial color="#7c3aed" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Ramp */}
      <mesh position={[0, 0.4, 1.5]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[2.5, 0.1, 1.6]} />
        <meshStandardMaterial color="#1e40af" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

function InspectionStation({ active, hovered }: { active: boolean; hovered: boolean }) {
  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[2.5, 0.4, 2]} />
        <meshStandardMaterial color="#1e40af" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Arch pillars */}
      <mesh position={[-1.1, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[1.1, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} metalness={0.6} />
      </mesh>
      {/* Arch top — scanner unit */}
      <mesh position={[0, 2.25, 0]}>
        <boxGeometry args={[2.4, 0.35, 0.6]} />
        <meshStandardMaterial
          color={active ? '#06b6d4' : '#0ea5e9'}
          emissive="#06b6d4"
          emissiveIntensity={active ? 0.8 : 0.2}
          metalness={0.5}
        />
      </mesh>
      {/* Scanner LEDs */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 2.05, 0.31]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={active ? '#10b981' : '#475569'} emissive={active ? '#10b981' : '#000'} emissiveIntensity={active ? 2 : 0} />
        </mesh>
      ))}
      {/* Green scan beam */}
      {active && (
        <>
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[2, 0.04, 0.04]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={4} transparent opacity={0.85} />
          </mesh>
          <pointLight position={[0, 1.2, 0]} color="#10b981" intensity={2} distance={3} />
        </>
      )}
    </group>
  )
}

function AISorter({ active, hovered, time }: { active: boolean; hovered: boolean; time: number }) {
  return (
    <group>
      {/* Base — bright purple */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.5, 1.4, 8]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={active ? 0.5 : 0.15}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>
      {/* Glowing accent ring */}
      <mesh position={[0, 1.45, 0]}>
        <torusGeometry args={[1.4, 0.08, 8, 16]} />
        <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={active ? 1.5 : 0.3} />
      </mesh>
      {/* Rotating beacon */}
      <group rotation={[0, active ? time * 2 : 0, 0]}>
        <mesh position={[0, 1.9, 0]}>
          <coneGeometry args={[0.7, 0.8, 6]} />
          <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={active ? 0.8 : 0.2} metalness={0.5} />
        </mesh>
        {/* AI indicator antennas */}
        {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 0.6, 2.2, Math.sin(a) * 0.6]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={active ? 3 : 0.5} />
          </mesh>
        ))}
      </group>
      {/* Top crown */}
      <mesh position={[0, 2.35, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 6]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={active ? 2 : 0.3} />
      </mesh>
      {active && <pointLight position={[0, 2.5, 0]} color="#a855f7" intensity={3} distance={5} />}
    </group>
  )
}

function Shredder({ active, hovered, time }: { active: boolean; hovered: boolean; time: number }) {
  return (
    <group>
      {/* Main body — orange */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2.5, 1.8, 2]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={active ? 0.4 : 0.1}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      {/* Hazard stripes on the side */}
      {[-0.6, 0.6].map((y, i) => (
        <mesh key={i} position={[1.26, 1 + y, 0]}>
          <boxGeometry args={[0.02, 0.2, 2]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      ))}
      {/* Hopper — yellow */}
      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[2.8, 0.4, 2.3]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={active ? 0.6 : 0.2} metalness={0.5} />
      </mesh>
      {/* Inner blade housing — visible from top */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[2.2, 0.15, 1.7]} />
        <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Rotating blades */}
      <group position={[0, 1, 0]} rotation={[active ? time * 6 : 0, 0, 0]}>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((r, i) => (
          <mesh key={i} rotation={[r, 0, 0]}>
            <boxGeometry args={[2, 0.1, 0.4]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.05} />
          </mesh>
        ))}
      </group>
      {/* Control panel */}
      <mesh position={[1.27, 1, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.8]} />
        <meshStandardMaterial color="#1e40af" metalness={0.6} />
      </mesh>
      <mesh position={[1.33, 1, 0]}>
        <boxGeometry args={[0.02, 0.5, 0.7]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={active ? 2 : 0.2} />
      </mesh>
    </group>
  )
}

function MagneticSeparator({ active, hovered, time }: { active: boolean; hovered: boolean; time: number }) {
  return (
    <group>
      {/* Housing — yellow */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[2, 1.4, 1.8]} />
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={active ? 0.4 : 0.1} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Magnetic drum — large rotating cylinder */}
      <mesh position={[0, 1.55, 0]} rotation={[Math.PI / 2, 0, active ? time * 2.5 : 0]}>
        <cylinderGeometry args={[0.7, 0.7, 1.7, 16]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={active ? 0.6 : 0.2} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* "N" and "S" magnetic poles indicators */}
      {[-0.65, 0.65].map((z, i) => (
        <mesh key={i} position={[0, 1.55, z]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.7, 16]} />
          <meshStandardMaterial color={i === 0 ? '#3b82f6' : '#dc2626'} emissive={i === 0 ? '#3b82f6' : '#dc2626'} emissiveIntensity={active ? 2 : 0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Side guards */}
      <mesh position={[0, 0.7, 1.05]}>
        <boxGeometry args={[2.1, 1.5, 0.1]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
    </group>
  )
}

function DensitySeparator({ active, hovered, time }: { active: boolean; hovered: boolean; time: number }) {
  return (
    <group>
      {/* Housing — orange */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[2, 1.4, 1.8]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={active ? 0.4 : 0.1} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Vibrating screen on top */}
      <mesh position={[0, 1.5, 0]} rotation={[active ? Math.sin(time * 8) * 0.05 : 0, 0, 0]}>
        <boxGeometry args={[1.8, 0.1, 1.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Air output pipes */}
      <mesh position={[0.7, 1.6, 0.7]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={active ? 0.5 : 0.1} metalness={0.7} />
      </mesh>
      <mesh position={[-0.7, 1.6, 0.7]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={active ? 0.5 : 0.1} metalness={0.7} />
      </mesh>
      {/* Status panel */}
      <mesh position={[0, 0.7, 0.95]}>
        <boxGeometry args={[1.2, 0.5, 0.05]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.7, 0.99]}>
        <boxGeometry args={[1, 0.3, 0.02]} />
        <meshStandardMaterial color={active ? '#10b981' : '#475569'} emissive={active ? '#10b981' : '#000'} emissiveIntensity={active ? 1 : 0} />
      </mesh>
    </group>
  )
}

function LeadFurnace({ active, hovered }: { active: boolean; hovered: boolean }) {
  return (
    <group>
      {/* Main body — dark steel with red accents */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.5, 2.4, 12]} />
        <meshStandardMaterial color="#7f1d1d" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Hot zone band */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.55, 1.55, 0.3, 12]} />
        <meshStandardMaterial color={active ? '#ff6b35' : '#dc2626'} emissive={active ? '#ff6b35' : '#dc2626'} emissiveIntensity={active ? 2 : 0.3} />
      </mesh>
      {/* Top dome */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[1.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#991b1b" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Chimney with smoke effect */}
      <mesh position={[0.6, 3.2, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 1.5, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.85} roughness={0.3} />
      </mesh>
      {active && (
        <mesh position={[0.6, 4.1, 0]}>
          <sphereGeometry args={[0.4, 8, 8]} />
          <meshStandardMaterial color="#94a3b8" emissive="#94a3b8" emissiveIntensity={0.2} transparent opacity={0.4} />
        </mesh>
      )}
      {/* GIANT GLOWING viewing port */}
      <mesh position={[0, 0.8, 1.55]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial
          color={active ? '#ff6b35' : '#1a1a1a'}
          emissive={active ? '#ff6b35' : '#000'}
          emissiveIntensity={active ? 5 : 0}
        />
      </mesh>
      {/* Window frame */}
      <mesh position={[0, 0.8, 1.54]}>
        <ringGeometry args={[0.4, 0.5, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={active ? 1 : 0.2} />
      </mesh>
      {/* Massive fire glow effect */}
      {active && (
        <>
          <pointLight position={[0, 0.5, 0]} color="#ff6b35" intensity={6} distance={8} />
          <pointLight position={[0, 2.2, 0]} color="#ff4500" intensity={2} distance={5} />
          <pointLight position={[0, 0.8, 1.8]} color="#ffa502" intensity={3} distance={4} />
        </>
      )}
      {/* Base ring with hazard pattern */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.15, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={active ? 0.8 : 0.2} />
      </mesh>
    </group>
  )
}

function LithiumTank({ active, hovered, time }: { active: boolean; hovered: boolean; time: number }) {
  return (
    <group>
      {/* Tank body — purple */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 2, 16]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={active ? 0.4 : 0.1} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Top dome */}
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7c3aed" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Liquid level inside (visible through glass area) */}
      <mesh position={[0, 0.8, 0.86]}>
        <boxGeometry args={[0.15, 1.4, 0.05]} />
        <meshStandardMaterial color={active ? '#c084fc' : '#1e293b'} emissive="#c084fc" emissiveIntensity={active ? 3 : 0} transparent opacity={0.9} />
      </mesh>
      {/* Bubbling animation indicator */}
      {active && (
        <>
          <mesh position={[0.3, 1 + Math.sin(time * 3) * 0.4, 0.3]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={2} />
          </mesh>
          <mesh position={[-0.3, 0.7 + Math.sin(time * 2 + 1) * 0.3, 0.4]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} />
          </mesh>
        </>
      )}
      {/* Pipes */}
      <mesh position={[0.95, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={active ? 0.5 : 0.1} metalness={0.7} />
      </mesh>
      <mesh position={[-0.95, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={active ? 0.5 : 0.1} metalness={0.7} />
      </mesh>
    </group>
  )
}

function CopperTank({ active, hovered, time }: { active: boolean; hovered: boolean; time: number }) {
  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 2, 16]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={active ? 0.4 : 0.1} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ea580c" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Liquid level */}
      <mesh position={[0, 0.8, 0.86]}>
        <boxGeometry args={[0.15, 1.4, 0.05]} />
        <meshStandardMaterial color={active ? '#fb923c' : '#1e293b'} emissive="#fb923c" emissiveIntensity={active ? 3 : 0} transparent opacity={0.9} />
      </mesh>
      {/* Electrolysis sparks */}
      {active && (
        <>
          <mesh position={[Math.cos(time * 4) * 0.5, 1.2, Math.sin(time * 4) * 0.5]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={3} />
          </mesh>
          <pointLight position={[0, 1.2, 0]} color="#f97316" intensity={1.5} distance={3} />
        </>
      )}
      {/* Pipes */}
      <mesh position={[0.95, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={active ? 0.5 : 0.1} metalness={0.7} />
      </mesh>
    </group>
  )
}

function PlasticExtruder({ active, hovered, time }: { active: boolean; hovered: boolean; time: number }) {
  return (
    <group>
      {/* Horizontal barrel — green */}
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 2.8, 12]} />
        <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={active ? 0.4 : 0.1} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Heating bands */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.2, 12]} />
          <meshStandardMaterial color={active ? '#dc2626' : '#7f1d1d'} emissive={active ? '#dc2626' : '#000'} emissiveIntensity={active ? 1 : 0} />
        </mesh>
      ))}
      {/* Hopper */}
      <mesh position={[-1, 1.1, 0]}>
        <coneGeometry args={[0.45, 0.7, 4]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={active ? 0.6 : 0.2} metalness={0.5} />
      </mesh>
      {/* Die head */}
      <mesh position={[1.6, 0.6, 0]}>
        <boxGeometry args={[0.3, 0.6, 0.6]} />
        <meshStandardMaterial color="#475569" metalness={0.85} />
      </mesh>
      {/* Pellet output */}
      {active && (
        <>
          {[0, 1, 2].map(i => (
            <mesh key={i} position={[1.9 + (time * 2 + i) % 1.2, 0.4 - ((time * 2 + i) % 1.2) * 0.4, (i - 1) * 0.1]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} />
            </mesh>
          ))}
        </>
      )}
      {/* Motor */}
      <mesh position={[-1.6, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.5, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} />
      </mesh>
      {/* Status light */}
      <mesh position={[-1.6, 0.95, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={active ? '#10b981' : '#475569'} emissive={active ? '#10b981' : '#000'} emissiveIntensity={active ? 2 : 0} />
      </mesh>
    </group>
  )
}

function HazardBay({ active, itemCount, hovered, time }: { active: boolean; itemCount: number; hovered: boolean; time: number }) {
  const hasItems = itemCount > 0
  return (
    <group>
      {/* Reinforced container — bright red */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[3, 1.4, 2.5]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={hasItems ? 0.6 : 0.2} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Hazard chevron stripes */}
      {[-1, 0, 1].map((x, i) => (
        <mesh key={i} position={[x, 1.4, 0]}>
          <boxGeometry args={[0.6, 0.12, 2.55]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#fbbf24' : '#000'} emissive={i % 2 === 0 ? '#fbbf24' : '#000'} emissiveIntensity={hasItems ? 1 : 0.2} />
        </mesh>
      ))}
      {/* Reinforcement bars */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0]}>
          <boxGeometry args={[0.15, 1.5, 2.55]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* Rotating warning beacon */}
      <group position={[0, 1.7, 0]} rotation={[0, hasItems ? time * 4 : 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.3, 8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <coneGeometry args={[0.15, 0.4, 6]} />
          <meshStandardMaterial color={hasItems ? '#ff4757' : '#475569'} emissive={hasItems ? '#ff4757' : '#000'} emissiveIntensity={hasItems ? 5 : 0} transparent opacity={0.8} />
        </mesh>
      </group>
      {/* Dome on top */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={hasItems ? 2 : 0.3} transparent opacity={0.5} />
      </mesh>
      {/* Massive red light when occupied */}
      {hasItems && (
        <>
          <pointLight position={[0, 2.5, 0]} color="#ff4757" intensity={6} distance={8} />
          <pointLight position={[0, 1, 0]} color="#dc2626" intensity={3} distance={5} />
        </>
      )}
    </group>
  )
}
