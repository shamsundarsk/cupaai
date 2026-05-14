/**
 * Animated conveyor belt between two stations.
 */
interface ConveyorBeltProps {
  x1: number
  y1: number
  x2: number
  y2: number
  active: boolean
}

export function ConveyorBelt({ x1, y1, x2, y2, active }: ConveyorBeltProps) {
  return (
    <g>
      {/* Belt background */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#1e293b"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Belt animated dashes */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={active ? '#00d9ff' : '#334155'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="8 6"
        opacity={active ? 0.8 : 0.3}
      >
        {active && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-28"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </line>
    </g>
  )
}
