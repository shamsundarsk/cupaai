import { usePlantStore } from '../store/plantStore'

export function EventLog() {
  const telemetry = usePlantStore((s) => s.telemetry)
  const events = telemetry?.events || []

  return (
    <div className="h-[80px] border-t border-border bg-bg-secondary/80 backdrop-blur-sm px-4 py-2 overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">Event Log</span>
        <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan pulse-live" />
      </div>
      <div className="space-y-0.5 overflow-y-auto max-h-[50px]">
        {events.length === 0 ? (
          <div className="text-[10px] text-text-muted">Waiting for events...</div>
        ) : (
          events.slice().reverse().map((event, i) => (
            <div key={i} className="text-[11px] font-mono text-text-secondary truncate">
              {event}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
