/**
 * 3D Machine node — clickable, shows status, glows when active.
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
}

export function Machine3D({
  id, position, size, color, label, isActive, itemCount, onClick,
  isHazard, isFurnace, isSpecial
}: Machine3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const glowRef = useRef(0)

  // Animate glow for active machines
  useFrame((_, delta) => {
    if (meshRef.current) {
      if (isActive || isHazard) {
        glowRef.current += delta * 3
        const intensity = 0.2 + Math.sin(glowRef.current) * 0.1
        ;(meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity
      } else {
        ;(meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = hovered ? 0.15 : 0
      }

      // Vibration for shredder
      if (id === 'shredder' && isActive) {
        meshRef.current.position.x = position[0] + (Math.random() - 0.5) * 0.03
        meshRef.current.position.z = position[2] + (Math.random() - 0.5) * 0.03
      }
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick(id)
  }

  return (
    <group position={position}>
      {/* Machine body */}
      <mesh
        ref={meshRef}
        castShadow
        onClick={handleClick}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      >
        {isFurnace ? (
          <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 8]} />
        ) : isSpecial ? (
          <octahedronGeometry args={[size[0] / 1.5]} />
        ) : (
          <boxGeometry args={size} />
        )}
        <meshStandardMaterial
          color={hovered ? '#ffffff' : color}
          emissive={isHazard ? '#ef4444' : color}
          emissiveIntensity={0}
          metalness={0.4}
          roughness={0.6}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Top indicator light */}
      <mesh position={[0, size[1] / 2 + 0.2, 0]}>
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial
          color={isActive ? (isHazard ? '#ef4444' : '#00ff9d') : '#374151'}
          emissive={isActive ? (isHazard ? '#ef4444' : '#00ff9d') : '#000000'}
          emissiveIntensity={isActive ? 1 : 0}
        />
      </mesh>

      {/* Furnace fire glow */}
      {isFurnace && isActive && (
        <pointLight position={[0, 0, 0]} color="#f97316" intensity={2} distance={5} />
      )}

      {/* Hazard warning light */}
      {isHazard && itemCount > 0 && (
        <pointLight position={[0, 2, 0]} color="#ef4444" intensity={3} distance={6} />
      )}

      {/* Label (HTML overlay) */}
      <Html position={[0, size[1] / 2 + 0.8, 0]} center distanceFactor={15}>
        <div className="pointer-events-none select-none text-center whitespace-nowrap">
          <div className="text-[10px] font-semibold text-white bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {label}
          </div>
          {itemCount > 0 && (
            <div className="text-[9px] font-mono text-cyan-400 bg-black/60 px-1 py-0.5 rounded mt-0.5">
              {itemCount} item{itemCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
