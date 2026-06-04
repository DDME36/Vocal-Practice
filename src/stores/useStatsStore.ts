import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PracticeSession {
  date: string;
  exerciseId: string;
  score: number;
  perfect: number;
  good: number;
  maxCombo: number;
}

export interface UserStats {
  totalExercises: number;
  perfectHits: number;
  maxCombo: number;
  currentStreak: number;
  lastPracticeDate: string | null;
  practiceHistory: PracticeSession[];
}

interface StatsState {
  stats: UserStats
  
  // Actions
  recordPracticeSession: (exerciseId: string, perfect: number, good: number, maxCombo: number, totalNotes: number) => void
  getLast7DaysActivity: () => boolean[]
  resetStats: () => void
}

const initialStats: UserStats = {
  totalExercises: 0,
  perfectHits: 0,
  maxCombo: 0,
  currentStreak: 0,
  lastPracticeDate: null,
  practiceHistory: []
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      stats: initialStats,

      recordPracticeSession: (exerciseId, perfect, good, maxCombo, totalNotes) => {
        const { stats } = get()
        const today = new Date().toISOString().split('T')[0]
        
        // เพิ่มจำนวนครั้งที่ฝึก
        const totalExercises = stats.totalExercises + 1
        
        // เพิ่ม perfect hits
        const perfectHits = stats.perfectHits + perfect
        
        // อัพเดท max combo ถ้าทำได้สูงกว่าเดิม
        const newMaxCombo = Math.max(stats.maxCombo, maxCombo)
        
        // คำนวณ streak
        let currentStreak = stats.currentStreak
        if (stats.lastPracticeDate) {
          const lastDate = new Date(stats.lastPracticeDate)
          const todayDate = new Date(today)
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diffDays === 0) {
            // ฝึกวันเดียวกัน - streak ไม่เปลี่ยน
          } else if (diffDays === 1) {
            // ฝึกติดต่อกัน - เพิ่ม streak
            currentStreak++
          } else {
            // ขาดวัน - รีเซ็ต streak
            currentStreak = 1
          }
        } else {
          // ครั้งแรก
          currentStreak = 1
        }
        
        // เพิ่มประวัติการฝึก
        const score = totalNotes > 0 ? Math.round(((perfect + good) / totalNotes) * 100) : 0
        const newSession: PracticeSession = {
          date: today,
          exerciseId,
          score,
          perfect,
          good,
          maxCombo
        }
        
        let practiceHistory = [...stats.practiceHistory, newSession]
        
        // เก็บแค่ 100 session ล่าสุด
        if (practiceHistory.length > 100) {
          practiceHistory = practiceHistory.slice(-100)
        }
        
        set({
          stats: {
            totalExercises,
            perfectHits,
            maxCombo: newMaxCombo,
            currentStreak,
            lastPracticeDate: today,
            practiceHistory
          }
        })
      },

      getLast7DaysActivity: () => {
        const { stats } = get()
        const today = new Date()
        const last7Days: boolean[] = []
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          
          const practiced = stats.practiceHistory.some(session => session.date === dateStr)
          last7Days.push(practiced)
        }
        
        return last7Days
      },

      resetStats: () => {
        set({ stats: initialStats })
      }
    }),
    {
      name: 'vocal-practice-stats',
    }
  )
)
