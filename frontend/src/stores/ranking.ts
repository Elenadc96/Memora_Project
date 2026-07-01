import { defineStore } from 'pinia'
import axios from 'axios'

export interface RankingEntry {
  rank: number
  userId: number
  name: string
  points: number
  streak: number
  isCurrentUser: boolean
}

// `icon` è la chiave salvata nel DB (star, flame, book, bolt, target, medal,
// crown, clock): nome/descrizione/colore/icona lucide vengono risolti nel
// componente tramite badgeMeta, così restano tradotti e coerenti con lo stile.
export interface BadgeEntry {
  id: number
  icon: string
  total: number
  progress: number
  unlocked: boolean
  unlockedDate: string | null
}

export interface UserGamificationStats {
  totalPoints: number
  streak: number
  cardsCompleted: number
  perfectSessions: number
  isSpeedster: boolean
  isNightOwl: boolean
}

interface BadgeMeResponse {
  badges: BadgeEntry[]
  stats: UserGamificationStats
}

interface RankingState {
  leaderboard: RankingEntry[]
  badges: BadgeEntry[]
  stats: UserGamificationStats | null
  loading: boolean
  error: string | null
}

export const useRankingStore = defineStore('ranking', {
  state: (): RankingState => ({
    leaderboard: [],
    badges: [],
    stats: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchAll(): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const [rankingRes, badgeRes] = await Promise.all([
          axios.get<RankingEntry[]>('/api/ranking'),
          axios.get<BadgeMeResponse>('/api/badge/me'),
        ])
        this.leaderboard = rankingRes.data
        this.badges = badgeRes.data.badges
        this.stats = badgeRes.data.stats
      } catch (e) {
        this.error = (e as Error).message
      } finally {
        this.loading = false
      }
    },
  },
})
