import { defineStore } from 'pinia'
import axios from 'axios'

export interface WeeklyActivity {
  day: string
  studied: number
  correct: number
}

export interface DashboardData {
  totalFlashcards: number
  studiedToday: number
  studyTimeSeconds: number
  successRate30d: number | null
  successRateAll: number | null
  streak: number
  weeklyActivity: WeeklyActivity[]
}

interface DashboardState {
  data: DashboardData | null
  loading: boolean
  error: string | null
}

export const useDashboardStore = defineStore('dashboard', {
  state: (): DashboardState => ({
    data: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchDashboard(): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.get<DashboardData>('/api/dashboard')
        this.data = data
      } catch (e) {
        this.error = (e as Error).message
      } finally {
        this.loading = false
      }
    },
  },
})
