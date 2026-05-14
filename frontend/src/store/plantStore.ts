/**
 * Zustand store for plant telemetry state.
 * Single source of truth for all real-time data.
 */
import { create } from 'zustand'

// --- Types matching backend schemas ---

export interface SensorReading {
  station_id: string
  temperature_c: number
  vibration_hz: number
  gas_ppm: number
  conveyor_speed_ms: number
  load_percent: number
  power_kw: number
  timestamp: number
}

export interface BatteryItem {
  id: string
  material_type: string
  weight_kg: number
  health: string
  temperature_c: number
  voltage_v: number
  gas_ppm: number
  current_station: string
  route: string | null
  hazard_score: number
  entered_at: number
  lead_content_kg: number
  lithium_content_kg: number
  copper_content_kg: number
  cobalt_content_kg: number
  plastic_content_kg: number
}

export interface HazardAlert {
  battery_id: string
  station_id: string
  hazard_level: string
  hazard_score: number
  message: string
  timestamp: number
}

export interface PlantTelemetry {
  tick: number
  sim_time: number
  shift_elapsed_s: number
  stations: Record<string, string>
  sensors: SensorReading[]
  batteries_in_system: BatteryItem[]
  hazard_alerts: HazardAlert[]
  recovery_totals: Record<string, number>
  revenue_totals: Record<string, number>
  total_revenue_usd: number
  total_co2_avoided_kg: number
  total_landfill_diverted_kg: number
  total_energy_kwh: number
  plant_risk_score: number
  events: string[]
}

interface PlantState {
  // Connection
  connected: boolean
  setConnected: (v: boolean) => void

  // Telemetry
  telemetry: PlantTelemetry | null
  updateTelemetry: (data: PlantTelemetry) => void

  // History (last 60 ticks for sparklines)
  revenueHistory: number[]
  riskHistory: number[]
  recoveryHistory: Record<string, number[]>

  // UI state
  selectedStation: string | null
  setSelectedStation: (id: string | null) => void
  showStoryMode: boolean
  setShowStoryMode: (v: boolean) => void
}

export const usePlantStore = create<PlantState>((set, get) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  telemetry: null,
  updateTelemetry: (data) => {
    const state = get()
    const revenueHistory = [...(state.revenueHistory || []), data.total_revenue_usd].slice(-120)
    const riskHistory = [...(state.riskHistory || []), data.plant_risk_score].slice(-120)

    const recoveryHistory = { ...state.recoveryHistory }
    for (const [mat, val] of Object.entries(data.recovery_totals)) {
      if (!recoveryHistory[mat]) recoveryHistory[mat] = []
      recoveryHistory[mat] = [...recoveryHistory[mat], val].slice(-120)
    }

    set({
      telemetry: data,
      revenueHistory,
      riskHistory,
      recoveryHistory,
    })
  },

  revenueHistory: [],
  riskHistory: [],
  recoveryHistory: {},

  selectedStation: null,
  setSelectedStation: (id) => set({ selectedStation: id }),
  showStoryMode: false,
  setShowStoryMode: (v) => set({ showStoryMode: v }),
}))
