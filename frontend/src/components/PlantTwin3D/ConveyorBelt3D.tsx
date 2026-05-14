/**
 * 3D Conveyor belt — prominent, animated, clearly visible.
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ConveyorBelt3DProps {
  start: [number, number, number]
  end: [number, number, number]
  active: boolean
  color?: string
}

export function ConveyorBelt3D({ start, end, active, color = '#fbbf24' }: ConveyorBelt3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureOffsetRef = useRef(0)

  const dx = end[0] - start[0]
  const dz = end[2] - start[2]
  const length = Math.sqrt(dx * dx + dz * dz)
  const angle = Math.atan2(dz, dx)
  const midX = (start[0] + end[0]) / 2
  const midZ = (start[2] + end[2]) / 2

  // High-contrast belt texture with bold stripes
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    // Base belt color
    ctx.fillStyle = active ? '#2d3748' : '#475569'
    ctx.fillRect(0, 0, 256, 64)

    // Bright yellow safety stripes
    const stripeColor = active ? color : '#94a3b8'
    for (let i = 0; i < 256; i += 32) {
      ctx.fillStyle = stripeColor
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 24, 0)
      ctx.lineTo(i + 12, 64)
      ctx.lineTo(i - 12, 64)
      ctx.closePath()
      ctx.fill()
    }

    // Edge highlight
    ctx.fillStyle = active ? '#1e293b' : '#334155'
    ctx.fillRect(0, 0, 256, 4)
    ctx.fillRect(0, 60, 256, 4)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(length / 1.5, 1)
    return tex
  }, [active, length, color])

  useFrame((_, delta) => {
    if (active && texture) {
      textureOffsetRef.current += delta * 1.2
      texture.offset.x = textureOffsetRef.current
    }
  })

  const beltHeight = 0.5
  const beltWidth = 1.0

  return (
    <group>
      {/* Belt surface — wider and more visible */}
      <mesh
        ref={meshRef}
        position={[midX, beltHeight, midZ]}
        rotation={[0, -angle, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[length, 0.15, beltWidth]} />
        <meshStandardMaterial
          map={texture}
          emissive={active ? color : '#000'}
          emissiveIntensity={active ? 0.15 : 0}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Side rails — bright safety yellow */}
      <mesh position={[midX, beltHeight + 0.18, midZ - beltWidth / 2 - 0.05]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[length, 0.25, 0.08]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.2} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[midX, beltHeight + 0.18, midZ + beltWidth / 2 + 0.05]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[length, 0.25, 0.08]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.2} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Steel support frame */}
      {[0.15, 0.5, 0.85].map((t, i) => {
        const lx = start[0] + dx * t
        const lz = start[2] + dz * t
        return (
          <group key={i}>
            <mesh position={[lx, beltHeight - 0.3, lz - beltWidth / 2 - 0.05]}>
              <boxGeometry args={[0.12, 0.6, 0.12]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
            </mesh>
            <mesh position={[lx, beltHeight - 0.3, lz + beltWidth / 2 + 0.05]}>
              <boxGeometry args={[0.12, 0.6, 0.12]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
            </mesh>
          </group>
        )
      })}

      {/* Direction arrows on the belt when active */}
      {active && length > 2 && (
        <group position={[midX, beltHeight + 0.09, midZ]} rotation={[0, -angle, 0]}>
          {Array.from({ length: Math.floor(length / 1.5) }).map((_, i) => {
            const x = -length / 2 + 0.75 + i * 1.5
            return (
              <mesh key={i} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
                <coneGeometry args={[0.18, 0.3, 3]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
              </mesh>
            )
          })}
        </group>
      )}

      {/* End rollers */}
      <mesh position={[start[0], beltHeight, start[2]]} rotation={[Math.PI / 2, 0, -angle]}>
        <cylinderGeometry args={[0.18, 0.18, beltWidth + 0.2, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[end[0], beltHeight, end[2]]} rotation={[Math.PI / 2, 0, -angle]}>
        <cylinderGeometry args={[0.18, 0.18, beltWidth + 0.2, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}
