import { defineStore } from 'pinia'
import { changeLanguage } from '../i18n'
import type { Language } from '@/types'

interface UIState {
  isDark: boolean
  language: Language
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    isDark: false,
    language: 'it',
  }),

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
