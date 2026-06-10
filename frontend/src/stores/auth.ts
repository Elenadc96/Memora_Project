import { defineStore } from 'pinia'
import axios from 'axios'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
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
    token: null,
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
      this.token = data.token
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    },

    async register({ name, lastName, email, password }: RegisterPayload): Promise<void> {
      const { data } = await axios.post<AuthResponse>('/api/auth/register', { name, lastName, email, password })
      this.user  = data.user
      this.token = data.token
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    },

    logout(): void {
      this.user  = null
      this.token = null
      delete axios.defaults.headers.common['Authorization']
    },
  },

  persist: true,
})
