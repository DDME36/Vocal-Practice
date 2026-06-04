import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { VocalRange } from '../lib/types'
import { type LatencySettings, loadLatencySettings } from '../lib/latencyCalibration'

interface SettingsState {
  vocalRange: VocalRange | null
  hasCompletedVocalRange: boolean
  latencySettings: LatencySettings
  hasCalibratedLatency: boolean
  hasSeenTutorial: boolean
  
  // Actions
  setVocalRange: (range: VocalRange) => void
  skipVocalRange: () => void
  setLatencySettings: (settings: LatencySettings) => void
  skipLatencyCalibration: () => void
  completeTutorial: () => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      vocalRange: null,
      hasCompletedVocalRange: false,
      latencySettings: loadLatencySettings(),
      hasCalibratedLatency: false,
      hasSeenTutorial: false,

      setVocalRange: (range) => {
        set({ vocalRange: range, hasCompletedVocalRange: true })
      },

      skipVocalRange: () => {
        set({ hasCompletedVocalRange: true })
      },

      setLatencySettings: (settings) => {
        set({ latencySettings: settings, hasCalibratedLatency: true })
      },

      skipLatencyCalibration: () => {
        set({ hasCalibratedLatency: true })
      },

      completeTutorial: () => {
        set({ hasSeenTutorial: true })
      },

      resetSettings: () => {
        set({
          vocalRange: null,
          hasCompletedVocalRange: false,
          latencySettings: loadLatencySettings(),
          hasCalibratedLatency: false,
          hasSeenTutorial: false
        })
      }
    }),
    {
      name: 'vocal-practice-settings',
    }
  )
)
