/**
 * Hazard overlay — pulsing red zone around a station with active hazard.
 */

interface HazardOverlayProps {
  x: number
  y: number
  level: string
}

export function HazardOverlay({ x, y, level }: HazardOverlayProps) {
  const radius = level === 'critical' ? 45 : level === 'high' ? 35 : 25
  const opacity = level === 'critical' ? 0.4 : level === 'high' ? 0.3 : 0.2

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="#ef4444"
        opacity={opacity}
      >
        <animate
          attributeName="opacity"
          values={`${opacity};${opacity * 0.3};${opacity}`}
          dur={level === 'critical' ? '0.4s' : '0.8s'}
          repeatCount="indefinite"
        />
        <animate
          attributeName="r"
          values={`${radius};${radius + 5};${radius}`}
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  )
}
