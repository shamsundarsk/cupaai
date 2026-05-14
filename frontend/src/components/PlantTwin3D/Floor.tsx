/**
 * Factory floor — bright industrial environment with clear zone separation.
 */

export function Floor() {
  return (
    <group>
      {/* Main floor — light industrial grey */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, -0.5, 4]} receiveShadow>
        <planeGeometry args={[50, 30]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Grid lines - darker for contrast */}
      <gridHelper
        args={[50, 50, '#64748b', '#94a3b8']}
        position={[5, -0.49, 4]}
      />

      {/* === COLORED ZONE FLOORS === */}

      {/* INPUT ZONE — Blue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, -0.48, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.25} />
      </mesh>
      {/* Zone border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, -0.47, 0]}>
        <ringGeometry args={[3.9, 4, 4]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>

      {/* PROCESSING ZONE — Amber */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, -0.48, 1]}>
        <planeGeometry args={[10, 12]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.2} />
      </mesh>

      {/* RECOVERY ZONE — Green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[22, -0.48, 4]}>
        <planeGeometry args={[8, 18]} />
        <meshStandardMaterial color="#10b981" transparent opacity={0.2} />
      </mesh>

      {/* HAZARD ZONE — Red */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.48, 9]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.3} />
      </mesh>

      {/* === FLOOR MARKINGS — Yellow safety stripes === */}
      {/* Border around hazard zone */}
      {[-2.3, 2.3].map((x, i) => (
        <mesh key={`h-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[4 + x, -0.46, 9]}>
          <planeGeometry args={[0.15, 5]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      ))}
      {[6.5, 11.5].map((z, i) => (
        <mesh key={`hz-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.46, z]}>
          <planeGeometry args={[5, 0.15]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      ))}
    </group>
  )
}
