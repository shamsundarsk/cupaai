/**
 * Story Overlay — renders at the bottom of the screen during story mode.
 * Lives in App.tsx so it persists across page navigations.
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStoryStore } from '../store/storyStore'
import { usePlantStore } from '../store/plantStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface StoryStep {
  id: number
  title: string
  narration: string
  duration: number
  navigateTo: string
  action?: () => Promise<void>
}

const STORY_STEPS: StoryStep[] = [
  { id: 1, title: 'Plant Boot-Up', narration: 'The recycling facility comes online. 14 IoT sensors activate across 12 processing stations. The digital twin synchronizes — watch the machines light up as they start processing.', duration: 7, navigateTo: '/' },
  { id: 2, title: 'Scrap Intake', narration: 'A delivery truck arrives with batteries — lead-acid, lithium-ion, and damaged EV packs. Each item is weighed, classified, and tracked. Look at "What\'s Entering the Plant" on the left.', duration: 8, navigateTo: '/' },
  { id: 3, title: 'Live Plant Floor', narration: 'This is the 3D digital twin. Every glowing machine is actively processing. The brighter the color, the more work it\'s doing. Conveyor belts animate when material flows through them.', duration: 9, navigateTo: '/plant' },
  { id: 4, title: 'AI Routing', narration: 'Watch the AI Sorting station (purple glow). It classifies each item in milliseconds: lead-acid → furnace, lithium → recovery, hazardous → isolation. 300 decisions per hour, zero errors.', duration: 8, navigateTo: '/plant' },
  { id: 5, title: 'Hazard Detected', narration: 'A damaged EV battery just entered the system. Its temperature is climbing: 55°C → 67°C → 78°C. Gas levels spiking. The AI hazard model has detected a thermal runaway signature...', duration: 9, navigateTo: '/hazards', action: async () => { await fetch(`${API_URL}/api/plant/inject-hazard`, { method: 'POST' }) } },
  { id: 6, title: 'Emergency Reroute', narration: 'Hazard score hit 85. The system OVERRIDES normal routing and diverts the battery to the isolation bay. Look at the risk score — thermal runaway prevented 3 minutes before it would have exploded.', duration: 9, navigateTo: '/hazards' },
  { id: 7, title: 'Predictive Simulation', narration: 'The twin doesn\'t just show NOW — it predicts the FUTURE. Here it simulates 30 minutes ahead: revenue trajectory, risk peaks, and which machines will need attention. You can also test "what-if" scenarios.', duration: 9, navigateTo: '/simulation' },
  { id: 8, title: 'Revenue & Lead Extraction', narration: 'The lead furnace is our money machine. Smelting at 450°C, it produces $18 per car battery in pure lead. Lead alone generates $9,000/day. Watch the revenue counter climb in real-time.', duration: 9, navigateTo: '/revenue' },
  { id: 9, title: 'AI Optimization', narration: 'The AI continuously analyzes all 14 stations and generates specific recommendations: "Reduce shredder load 20%", "Increase furnace temp for better purity". Result: +12% efficiency, -23% waste.', duration: 8, navigateTo: '/optimization' },
  { id: 10, title: 'The Circular Economy, Working', narration: 'End of shift: $8,892 revenue generated. 4.2 tonnes of materials recovered. 12.4 tonnes of CO₂ avoided. 4 thermal hazards prevented. Zero incidents. This is how urban mining pays for itself.', duration: 10, navigateTo: '/sustainability' },
]

export function StoryOverlayController() {
  const navigate = useNavigate()
  const { isPlaying, currentStep, progress, setCurrentStep, setProgress, reset } = useStoryStore()
  const telemetry = usePlantStore((s) => s.telemetry)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isPlaying || currentStep < 0 || currentStep >= STORY_STEPS.length) {
      if (currentStep >= STORY_STEPS.length) {
        reset()
        navigate('/story')
      }
      return
    }

    const step = STORY_STEPS[currentStep]

    // Navigate
    navigate(step.navigateTo)

    // Execute action
    if (step.action) step.action()

    // Progress
    setProgress(0)
    const progressInterval = setInterval(() => {
      setProgress(useStoryStore.getState().progress + (100 / (step.duration * 20)))
    }, 50)
    timerRef.current = progressInterval

    // Next step
    stepTimerRef.current = setTimeout(() => {
      clearInterval(progressInterval)
      setCurrentStep(currentStep + 1)
    }, step.duration * 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
    }
  }, [currentStep, isPlaying])

  if (!isPlaying || currentStep < 0 || currentStep >= STORY_STEPS.length) return null

  const step = STORY_STEPS[currentStep]

  return (
    <div className="fixed bottom-4 left-[230px] right-4 z-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-panel-glow p-4 max-w-[750px] mx-auto shadow-2xl"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">
                {currentStep + 1}/{STORY_STEPS.length}
              </span>
              <h3 className="text-sm font-semibold text-text-bright">{step.title}</h3>
            </div>
            <button
              onClick={() => { reset(); navigate('/story') }}
              className="text-[10px] text-text-muted hover:text-hazard-red transition-colors cursor-pointer px-2 py-1 rounded hover:bg-hazard-red/10"
            >
              ■ Stop
            </button>
          </div>

          <p className="text-[12px] text-text-secondary leading-relaxed mb-3">{step.narration}</p>

          <div className="h-1 bg-bg-primary rounded-full overflow-hidden">
            <div className="h-full bg-accent-cyan rounded-full transition-all duration-100" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>

          {telemetry && (
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border-subtle">
              <MiniStat label="Revenue" value={`$${telemetry.total_revenue_usd?.toFixed(0) || 0}`} color="text-revenue-green" />
              <MiniStat label="Risk" value={`${telemetry.plant_risk_score?.toFixed(0) || 0}`} color={telemetry.plant_risk_score > 60 ? 'text-hazard-red' : 'text-accent-green'} />
              <MiniStat label="Items" value={`${telemetry.batteries_in_system?.length || 0}`} color="text-accent-cyan" />
              <MiniStat label="Alerts" value={`${telemetry.hazard_alerts?.length || 0}`} color="text-warning-amber" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-text-muted uppercase">{label}</span>
      <span className={`text-[11px] font-mono font-semibold ${color}`}>{value}</span>
    </div>
  )
}
