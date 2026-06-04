import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProgress } from '../lib/progressionSystem'
import { createNewProgress, updateProgress, shouldLevelUp } from '../lib/progressionSystem'
import { EXERCISES } from '../lib/exercises'

interface ProgressState {
  progress: UserProgress | null
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | null
  hasCompletedOnboarding: boolean
  newlyUnlockedAchievements: string[]
  
  // Actions
  setSkillLevel: (level: 'beginner' | 'intermediate' | 'advanced' | null) => void
  completeOnboarding: () => void
  recordExerciseScore: (
    exerciseId: string, 
    score: number, 
    perfectCount: number, 
    goodCount: number, 
    totalNotes: number,
    exerciseName?: string,
    maxCombo?: number
  ) => void
  checkLevelUp: () => boolean
  performLevelUp: () => void
  clearNewlyUnlocked: () => void
  resetProgress: () => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: null,
      skillLevel: null,
      hasCompletedOnboarding: false,
      newlyUnlockedAchievements: [],

      setSkillLevel: (level) => {
        set({ 
          skillLevel: level,
          progress: level ? createNewProgress(level) : null 
        })
      },

      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true })
      },

      recordExerciseScore: (exerciseId, score, perfectCount, goodCount, totalNotes, exerciseName = '', maxCombo = 0) => {
        const { progress } = get()
        if (!progress) return

        const oldUnlocked = progress.unlockedAchievements || []
        const exerciseData = EXERCISES.map(ex => ({ id: ex.id, category: ex.category }));
        
        const updatedProgress = updateProgress(
          progress,
          exerciseId,
          score,
          perfectCount,
          goodCount,
          totalNotes,
          exerciseData,
          exerciseName,
          maxCombo
        )

        const newUnlocked = updatedProgress.unlockedAchievements || []
        const newlyUnlocked = newUnlocked.filter(id => !oldUnlocked.includes(id))

        set({ 
          progress: updatedProgress,
          ...(newlyUnlocked.length > 0 ? { newlyUnlockedAchievements: newlyUnlocked } : {})
        })
      },

      checkLevelUp: () => {
        const { progress } = get()
        if (!progress) return false
        return shouldLevelUp(progress)
      },

      performLevelUp: () => {
        const { skillLevel, progress } = get()
        if (!skillLevel || !progress) return

        const newLevel = skillLevel === 'beginner' ? 'intermediate' : 'advanced'
        
        set({
          skillLevel: newLevel,
          progress: {
            ...progress,
            skillLevel: newLevel
          }
        })
      },

      clearNewlyUnlocked: () => {
        set({ newlyUnlockedAchievements: [] })
      },

      resetProgress: () => {
        set({ progress: null, skillLevel: null, hasCompletedOnboarding: false, newlyUnlockedAchievements: [] })
      }
    }),
    {
      name: 'vocal-practice-progress',
    }
  )
)
