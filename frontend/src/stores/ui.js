// Store Pinia per le preferenze di interfaccia.
// Centralizza tema e lingua in modo che qualsiasi componente possa
// leggerli o modificarli senza passare props su e giù.

import { defineStore } from 'pinia'
import { changeLanguage } from '../i18n'

export const useUIStore = defineStore('ui', {
  state: () => ({
    isDark: false,    // true = dark mode attiva
    language: 'it',  // lingua corrente: 'it' | 'en'
  }),

  actions: {
    toggleDarkMode() {
      this.isDark = !this.isDark
      // La dark mode in Tailwind si attiva con la classe 'dark' su <html>.
      // toggle(classe, forza) aggiunge la classe se forza=true, la rimuove se false.
      document.documentElement.classList.toggle('dark', this.isDark)
    },

    setDarkMode(value) {
      this.isDark = value
      document.documentElement.classList.toggle('dark', value)
    },

    async setLanguage(lang) {
      this.language = lang
      // Aggiorna i18next a runtime: tutti i $t() nei componenti
      // si aggiornano immediatamente senza ricaricare la pagina.
      await changeLanguage(lang)
    },

    // Chiamata una volta sola in App.vue al mount dell'app.
    // Serve a riallineare il DOM con lo stato salvato in localStorage:
    // senza questo, Pinia ripristina isDark=true ma la classe 'dark'
    // sull'<html> non viene aggiunta (il DOM non sa dello store).
    init() {
      document.documentElement.classList.toggle('dark', this.isDark)
      changeLanguage(this.language)
    },
  },

  persist: true,   // isDark e language sopravvivono al refresh della pagina
})
