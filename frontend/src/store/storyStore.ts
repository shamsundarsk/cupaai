/**
 * Story Mode state — persists across page navigations.
 */
import { create } from 'zustand'

interface StoryState {
  isPlaying: boolean
  currentStep: number
  progress: number
  setPlaying: (v: boolean) => void
  setCurrentStep: (v: number) => void
  setProgress: (v: number) => void
  reset: () => void
}

export const useStoryStore = create<StoryState>((set) => ({
  isPlaying: false,
  currentStep: -1,
  progress: 0,
  setPlaying: (v) => set({ isPlaying: v }),
  setCurrentStep: (v) => set({ currentStep: v }),
  setProgress: (v) => set({ progress: v }),
  reset: () => set({ isPlaying: false, currentStep: -1, progress: 0 }),
}))
