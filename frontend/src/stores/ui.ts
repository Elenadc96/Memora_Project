import { defineStore } from 'pinia'
import { changeLanguage } from '../i18n'
import type { Language, UserSettings } from '@/types'

interface UIState {
  isDark: boolean
  language: Language
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    isDark: false,
    language: 'it',
  }),

  getters: {
    // Le settings (tema + lingua) sono un blob unico nel DB, senza colonne
    // dedicate: va sempre inviato per intero, mai un campo alla volta,
    // altrimenti il salvataggio di uno sovrascriverebbe l'altro.
    currentSettings(state): UserSettings {
      return {
        theme: state.isDark ? 'dark' : 'light',
        language: state.language,
      }
    },
  },

  actions: {
    toggleDarkMode(): void {
      this.isDark = !this.isDark
      document.documentElement.classList.toggle('dark', this.isDark)
    },

    setDarkMode(value: boolean): void {
      this.isDark = value
      document.documentElement.classList.toggle('dark', value)
    },

    async setLanguage(lang: Language): Promise<void> {
      this.language = lang
      await changeLanguage(lang)
    },

    init(): void {
      document.documentElement.classList.toggle('dark', this.isDark)
      changeLanguage(this.language)
    },
  },

  persist: true,
})
