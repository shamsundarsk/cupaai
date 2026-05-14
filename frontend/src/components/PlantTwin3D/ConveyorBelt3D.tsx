/**
 * 3D Conveyor belt with animated texture.
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

export function ConveyorBelt3D({ start, end, active, color = '#2a3441' }: ConveyorBelt3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureOffsetRef = useRef(0)

  // Calculate belt geometry
  const dx = end[0] - start[0]
  const dz = end[2] - start[2]
  const length = Math.sqrt(dx * dx + dz * dz)
  const angle = Math.atan2(dz, dx)
  const midX = (start[0] + end[0]) / 2
  const midZ = (start[2] + end[2]) / 2

  // Create belt texture with stripes
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#1a2332'
    ctx.fillRect(0, 0, 128, 32)
    // Stripes
    for (let i = 0; i < 128; i += 16) {
      ctx.fillStyle = active ? '#00d9ff' : '#2a3441'
      ctx.fillRect(i, 0, 8, 32)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(length / 2, 1)
    return tex
  }, [active, length])

  // Animate texture offset for movement
  useFrame((_, delta) => {
    if (active && texture) {
      textureOffsetRef.current += delta * 0.8
      texture.offset.x = textureOffsetRef.current
    }
  })

  return (
    <group>
      {/* Belt surface */}
      <mesh
        ref={meshRef}
        position={[midX, 0.15, midZ]}
        rotation={[0, -angle, 0]}
        castShadow
      >
        <boxGeometry args={[length, 0.1, 0.6]} />
        <meshStandardMaterial
          map={texture}
          emissive={active ? color === '#ef4444' ? '#ef4444' : '#00d9ff' : '#000000'}
          emissiveIntensity={active ? 0.2 : 0}
        />
      </mesh>

      {/* Side rails */}
      <mesh position={[midX, 0.25, midZ - 0.35]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[length, 0.2, 0.05]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[midX, 0.25, midZ + 0.35]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[length, 0.2, 0.05]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Support legs */}
      {[0.25, 0.75].map((t, i) => {
        const lx = start[0] + dx * t
        const lz = start[2] + dz * t
        return (
          <mesh key={i} position={[lx, -0.15, lz]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshStandardMaterial color="#1f2937" metalness={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}
