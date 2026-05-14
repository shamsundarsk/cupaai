import { usePlantStore } from '../store/plantStore'

export function EventLog() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const events = telemetry?.events || []

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan pulse-live" />
        <span className="text-[9px] text-text-muted uppercase tracking-wider font-medium">Event Stream</span>
        <span className="text-[9px] text-text-muted ml-auto">{events.length} events</span>
      </div>
      <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-[10px] text-text-muted italic">Awaiting events...</div>
        ) : (
          events.slice().reverse().map((event, i) => (
            <div key={i} className="text-[10px] font-mono text-text-secondary py-0.5 border-b border-border-subtle/50 last:border-0 leading-relaxed">
              {event}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
