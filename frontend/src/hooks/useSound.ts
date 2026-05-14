/**
 * Sound Design — ambient factory hum, hazard klaxon, revenue ka-ching.
 * Uses Web Audio API for lightweight procedural sounds (no external files needed).
 */
import { useRef, useCallback, useEffect } from 'react'
import { usePlantStore } from '../store/plantStore'

let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

// --- Sound generators ---

function playKlaxon() {
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(440, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1)
  osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.4)
}

function playKaChing() {
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1200, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.05)
  osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.08)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}

function playBeep() {
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, ctx.currentTime)
  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.15)
}

// Ambient hum (continuous low drone)
let ambientNode: OscillatorNode | null = null
let ambientGain: GainNode | null = null

function startAmbient() {
  if (ambientNode) return
  const ctx = getAudioCtx()
  ambientNode = ctx.createOscillator()
  ambientGain = ctx.createGain()
  ambientNode.connect(ambientGain)
  ambientGain.connect(ctx.destination)
  ambientNode.type = 'sine'
  ambientNode.frequency.setValueAtTime(55, ctx.currentTime) // Low hum
  ambientGain.gain.setValueAtTime(0.02, ctx.currentTime)
  ambientNode.start()
}

function stopAmbient() {
  if (ambientNode) {
    ambientNode.stop()
    ambientNode = null
    ambientGain = null
  }
}

// --- Hook ---

export function useSound() {
  const prevRiskRef = useRef(0)
  const prevRevenueRef = useRef(0)
  const soundEnabledRef = useRef(false)
  const telemetry = usePlantStore((s) => s.telemetry)

  const enableSound = useCallback(() => {
    soundEnabledRef.current = true
    // Resume audio context (browsers require user gesture)
    getAudioCtx().resume()
    startAmbient()
  }, [])

  const disableSound = useCallback(() => {
    soundEnabledRef.current = false
    stopAmbient()
  }, [])

  const toggleSound = useCallback(() => {
    if (soundEnabledRef.current) {
      disableSound()
    } else {
      enableSound()
    }
    return soundEnabledRef.current
  }, [enableSound, disableSound])

  // React to telemetry changes
  useEffect(() => {
    if (!soundEnabledRef.current || !telemetry) return

    const currentRisk = telemetry.plant_risk_score
    const currentRevenue = telemetry.total_revenue_usd

    // Hazard klaxon when risk spikes above 60
    if (currentRisk > 60 && prevRiskRef.current <= 60) {
      playKlaxon()
    }

    // Ka-ching when revenue increases by $50+
    if (currentRevenue - prevRevenueRef.current > 50) {
      playKaChing()
      prevRevenueRef.current = currentRevenue
    }

    // Soft beep on new hazard alert
    if (telemetry.hazard_alerts.length > 0 && currentRisk > prevRiskRef.current + 20) {
      playBeep()
    }

    prevRiskRef.current = currentRisk
  }, [telemetry])

  return { enableSound, disableSound, toggleSound, isEnabled: () => soundEnabledRef.current }
}
