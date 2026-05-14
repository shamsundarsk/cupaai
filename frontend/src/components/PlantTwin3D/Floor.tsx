/**
 * Factory floor with grid pattern.
 */
import { useRef } from 'react'
import * as THREE from 'three'

export function Floor() {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, -0.5, 4]} receiveShadow>
        <planeGeometry args={[45, 25]} />
        <meshStandardMaterial color="#0f1419" roughness={0.9} />
      </mesh>

      {/* Grid lines */}
      <gridHelper
        args={[45, 45, '#1a2332', '#1a2332']}
        position={[5, -0.49, 4]}
      />

      {/* Zone markers */}
      {/* Intake zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10, -0.48, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#1e3a5f" transparent opacity={0.3} />
      </mesh>

      {/* Processing zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[11, -0.48, 2]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#3d2e0a" transparent opacity={0.2} />
      </mesh>

      {/* Recovery zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[22, -0.48, 4]}>
        <planeGeometry args={[8, 18]} />
        <meshStandardMaterial color="#0a3d1a" transparent opacity={0.2} />
      </mesh>

      {/* Hazard zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.48, 9]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#3d0a0a" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}
