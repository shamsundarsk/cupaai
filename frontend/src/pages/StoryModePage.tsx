import { useStoryStore } from '../store/storyStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STEPS_PREVIEW = [
  { id: 1, title: 'Plant Boot-Up', page: 'Overview' },
  { id: 2, title: 'Scrap Intake', page: 'Overview' },
  { id: 3, title: 'Live Plant Floor', page: 'Plant Twin' },
  { id: 4, title: 'AI Routing', page: 'Plant Twin' },
  { id: 5, title: '⚡ Hazard Detected', page: 'Safety' },
  { id: 6, title: '🚨 Emergency Reroute', page: 'Safety' },
  { id: 7, title: 'Predictive Simulation', page: 'Simulation' },
  { id: 8, title: 'Revenue & Lead', page: 'Revenue' },
  { id: 9, title: 'AI Optimization', page: 'Optimization' },
  { id: 10, title: 'Impact Summary', page: 'Sustainability' },
]

export function StoryModePage() {
  const { isPlaying, setPlaying, setCurrentStep } = useStoryStore()

  const startStory = async () => {
    await fetch(`${API_URL}/api/plant/reset`, { method: 'POST' })
    setCurrentStep(0)
    setPlaying(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-bright">Story Mode</h2>
          <p className="text-[11px] text-text-muted">Guided demo that navigates through the platform, telling the full story automatically</p>
        </div>
        <button
          onClick={startStory}
          disabled={isPlaying}
          className="px-5 py-2.5 bg-accent-cyan/15 border border-accent-cyan/40 rounded text-sm text-accent-cyan hover:bg-accent-cyan/25 transition-all cursor-pointer font-medium disabled:opacity-50"
        >
          {isPlaying ? '● Playing...' : '▶ Start Guided Demo'}
        </button>
      </div>

      <div className="glass-panel p-4">
        <h3 className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-3">Demo Sequence (~90 seconds)</h3>
        <p className="text-[11px] text-text-secondary mb-3">The demo will automatically navigate between pages, inject events, and narrate what's happening.</p>
        <div className="space-y-1">
          {STEPS_PREVIEW.map((step) => (
            <div key={step.id} className="flex items-center gap-3 px-3 py-2 rounded bg-bg-primary/30">
              <div className="w-5 h-5 rounded-full bg-bg-card flex items-center justify-center text-[9px] font-mono text-text-muted">
                {step.id}
              </div>
              <span className="text-[11px] text-text-primary flex-1">{step.title}</span>
              <span className="text-[9px] text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded">{step.page}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        <h3 className="text-xs font-semibold text-text-primary mb-2">What happens</h3>
        <ul className="space-y-1 text-[11px] text-text-secondary">
          <li>• Resets the plant to a fresh state</li>
          <li>• Navigates: Overview → Plant Twin → Safety → Simulation → Revenue → Optimization → ESG</li>
          <li>• Injects a real hazard at step 5 — watch the AI detect and reroute it</li>
          <li>• Narration overlay stays visible on every page</li>
          <li>• Live metrics update throughout</li>
        </ul>
      </div>
    </div>
  )
}
