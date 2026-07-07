import { defineStore } from 'pinia'
import axios from 'axios'
import type { User, UserSettings } from '@/types'
import { useUIStore } from './ui'

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

interface UpdateProfilePayload {
  name?: string
  lastName?: string
  settings?: UserSettings
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
      // skipAuthRedirect: un 401 qui è "credenziali sbagliate", non una
      // sessione scaduta — lo gestisce già il catch di chi chiama login().
      const { data } = await axios.post<AuthResponse>('/api/auth/login', { email, password }, { skipAuthRedirect: true })
      this.user  = data.user
    },

    async register({ name, lastName, email, password }: RegisterPayload): Promise<void> {
      // Default per un nuovo utente: lingua inglese fissa, tema preso dalla
      // preferenza del browser (il server non può saperlo, lo decidiamo qui).
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
      const settings: UserSettings = { language: 'en', theme: prefersDark ? 'dark' : 'light' }

      const { data } = await axios.post<AuthResponse>('/api/auth/register', { name, lastName, email, password, settings })
      this.user = data.user

      const uiStore = useUIStore()
      uiStore.setDarkMode(prefersDark)
      await uiStore.setLanguage('en')
    },

    setUser(user: User): void {
      this.user = user
    },

    // Aggiorna nome/cognome e/o le settings (tema, lingua) tramite l'unica
    // API di aggiornamento profilo. Usata dalla pagina Impostazioni.
    async updateProfile(payload: UpdateProfilePayload): Promise<void> {
      const { data } = await axios.patch<User>('/api/utenti', payload)
      this.user = { ...this.user, ...data } as User
    },

    async checkSession(): Promise<void> {
      try {
        const { data } = await axios.get('/api/auth/me')
        this.user = { ...this.user, ...data } as User

        // Applica tema e lingua salvati lato server allo store UI,
        // così le preferenze seguono l'utente anche su un nuovo dispositivo.
        const settings = data?.settings
        if (settings) {
          const uiStore = useUIStore()
          if (settings.theme) uiStore.setDarkMode(settings.theme === 'dark')
          if (settings.language) uiStore.setLanguage(settings.language)
        }
      } catch {
        this.user = null
      }
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
      // skipAuthRedirect: qui l'utente è già autenticato, quindi senza il
      // flag il check "eraAutenticato" dell'interceptor non basterebbe a
      // escludere questo caso — un 401 di "password attuale sbagliata"
      // andrebbe comunque a scatenare il redirect globale.
      await axios.patch('/api/utenti/password', { currentPassword, newPassword }, { skipAuthRedirect: true })
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
