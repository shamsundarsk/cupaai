/**
 * Station node in the plant visualization.
 */
interface StationProps {
  id: string
  x: number
  y: number
  label: string
  state: string
  isHazard?: boolean
  isFurnace?: boolean
}

const STATE_COLORS: Record<string, string> = {
  idle: '#334155',
  processing: '#00d9ff',
  faulted: '#ef4444',
  maintenance: '#ffb800',
}

export function Station({ id, x, y, label, state, isHazard, isFurnace }: StationProps) {
  const color = STATE_COLORS[state] || STATE_COLORS.idle
  const size = isFurnace ? 28 : isHazard ? 24 : 20

  return (
    <g>
      {/* Station body */}
      {isFurnace ? (
        // Hexagonal furnace
        <polygon
          points={hexPoints(x, y, size)}
          fill="#1a1f2e"
          stroke={color}
          strokeWidth="2"
          opacity={state === 'processing' ? 1 : 0.6}
        />
      ) : isHazard ? (
        // Diamond for hazard isolation
        <polygon
          points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`}
          fill="#1a1f2e"
          stroke={state === 'processing' ? '#ef4444' : color}
          strokeWidth="2"
          opacity={state === 'processing' ? 1 : 0.6}
        />
      ) : (
        // Standard rounded rect
        <rect
          x={x - size}
          y={y - size / 1.5}
          width={size * 2}
          height={size * 1.3}
          rx="4"
          fill="#1a1f2e"
          stroke={color}
          strokeWidth="1.5"
          opacity={state === 'processing' ? 1 : 0.6}
        />
      )}

      {/* Status indicator dot */}
      <circle
        cx={x + size - 4}
        cy={y - size / 1.5 + 4}
        r="3"
        fill={color}
        opacity={state === 'processing' ? 1 : 0.5}
      >
        {state === 'processing' && (
          <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Label */}
      <text
        x={x}
        y={y + size + 12}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="8"
        fontFamily="monospace"
      >
        {label}
      </text>
    </g>
  )
}

function hexPoints(cx: number, cy: number, r: number): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
  }
  return points.join(' ')
}
