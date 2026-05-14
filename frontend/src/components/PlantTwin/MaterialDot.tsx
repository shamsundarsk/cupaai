/**
 * Material dot representing a battery/item in the system.
 */

interface MaterialDotProps {
  x: number
  y: number
  materialType: string
  health: string
  hazardScore: number
}

const MATERIAL_DOT_COLORS: Record<string, string> = {
  lead_acid: '#94a3b8',
  lithium_ion: '#a855f7',
  pcb: '#f97316',
  copper_heavy: '#f59e0b',
  plastic: '#22c55e',
  hazardous: '#ef4444',
  non_recyclable: '#6b7280',
}

export function MaterialDot({ x, y, materialType, health, hazardScore }: MaterialDotProps) {
  const color = MATERIAL_DOT_COLORS[materialType] || '#64748b'
  const isHazardous = hazardScore > 50
  const isDamaged = health === 'damaged'

  // Offset slightly so multiple dots at same station don't overlap perfectly
  const offsetX = (Math.random() - 0.5) * 20
  const offsetY = (Math.random() - 0.5) * 12

  return (
    <g>
      {/* Hazard glow */}
      {isHazardous && (
        <circle
          cx={x + offsetX}
          cy={y + offsetY}
          r="10"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          opacity="0.6"
        >
          <animate attributeName="r" values="8;14;8" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.8s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Main dot */}
      <circle
        cx={x + offsetX}
        cy={y + offsetY}
        r={isDamaged ? 5 : 4}
        fill={color}
        stroke={isHazardous ? '#ef4444' : 'none'}
        strokeWidth={isHazardous ? 1.5 : 0}
        opacity={0.9}
      >
        {/* Pulse for damaged items */}
        {isDamaged && (
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="0.6s" repeatCount="indefinite" />
        )}
      </circle>
    </g>
  )
}
