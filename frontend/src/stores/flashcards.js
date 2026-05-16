// Store Pinia per materie e flashcard.
// È il "magazzino" centrale dei dati di studio: Sidebar, Dashboard
// e SubjectPage leggono tutti da qui, senza chiamate API duplicate.

import { defineStore } from 'pinia'
import axios from 'axios'

export const useFlashcardStore = defineStore('flashcards', {
  state: () => ({
    subjects: [],            // lista di tutte le materie dell'utente
    flashcards: [],          // flashcard della materia attualmente aperta
    selectedSubjectId: null, // id della materia selezionata nella sidebar
    loading: false,          // true mentre una chiamata API è in corso
    error: null,             // messaggio di errore dell'ultima chiamata fallita
  }),

  getters: {
    // Restituisce l'oggetto materia completo a partire dall'id selezionato.
    // ?? null evita undefined se nessuna materia è selezionata.
    selectedSubject: (state) =>
      state.subjects.find((s) => s.id === state.selectedSubjectId) ?? null,

    // Somma il numero di carte di tutte le materie (usato nella dashboard generale)
    totalCards: (state) =>
      state.subjects.reduce((sum, s) => sum + (s.cardCount ?? 0), 0),
  },

  actions: {
    async fetchSubjects() {
      this.loading = true
      this.error   = null
      try {
        const { data } = await axios.get('/api/subjects')
        this.subjects = data
      } catch (e) {
        this.error = e.message
      } finally {
        // finally garantisce che loading torni false anche in caso di errore
        this.loading = false
      }
    },

    async fetchFlashcards(subjectId) {
      this.loading = true
      this.error   = null
      try {
        const { data } = await axios.get(`/api/subjects/${subjectId}/flashcards`)
        this.flashcards = data
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    // Seleziona una materia e carica subito le sue flashcard.
    // Chiamata dalla Sidebar quando l'utente clicca su una materia.
    selectSubject(id) {
      this.selectedSubjectId = id
      if (id) this.fetchFlashcards(id)
    },

    async createFlashcard({ subjectId, question, answer }) {
      const { data } = await axios.post(`/api/subjects/${subjectId}/flashcards`, {
        question,
        answer,
      })
      // Aggiunge la nuova carta direttamente all'array locale invece di
      // ri-fetchare tutte le flashcard: più veloce e risparmia una chiamata API.
      this.flashcards.push(data)
    },

    async deleteFlashcard(flashcardId) {
      await axios.delete(`/api/flashcards/${flashcardId}`)
      // filter crea un nuovo array escludendo la carta eliminata.
      // Vue 3 rileva il cambio di riferimento e aggiorna la UI automaticamente.
      this.flashcards = this.flashcards.filter((f) => f.id !== flashcardId)
    },
  },
})
