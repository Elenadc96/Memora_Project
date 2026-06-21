import { defineStore } from 'pinia'
import axios from 'axios'
import type { User } from '@/types'

interface AuthState {
  user: User | null
}

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  name: string
  lastName: string
  email: string
  password: string
}

interface AuthResponse {
  user: User
  token: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user,

    fullName: (state): string => state.user
      ? `${state.user.name} ${state.user.lastName}`
      : '',
  },

  actions: {
    async login({ email, password }: LoginPayload): Promise<void> {
      const { data } = await axios.post<AuthResponse>('/api/auth/login', { email, password })
      this.user  = data.user
    },

    async register({ name, lastName, email, password }: RegisterPayload): Promise<void> {
      const { data } = await axios.post<AuthResponse>('/api/auth/register', { name, lastName, email, password })
      this.user  = data.user
    },

    setUser(user: User): void {
      this.user = user
    },

    async logout(): Promise<void> {
      try {
        await axios.post('/api/auth/logout')
      } finally {
        this.user = null
      }
    },
  },
  persist: true,
})
