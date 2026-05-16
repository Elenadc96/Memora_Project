// Store Pinia per materie, lezioni e flashcard.
// È il "magazzino" centrale dei dati di studio: Sidebar, Dashboard
// e SubjectPage leggono tutti da qui, senza chiamate API duplicate.
//
// STRUTTURA DB (da tenere a mente):
//   subject → lessons → flashcard_lesson → flashcard
//
// TODO: il frontend attualmente non gestisce il livello "lessons".
//       Quando verrà implementato, aggiungere:
//         - state.lessons (array di lezioni della materia aperta)
//         - fetchLessons(subjectId)
//         - selectLesson(id) che carica le flashcard di quella lezione
//       e aggiornare fetchFlashcards per usare l'id della lezione, non della materia.

import { defineStore } from 'pinia'
import axios from 'axios'

export const useFlashcardStore = defineStore('flashcards', {
  state: () => ({
    // Popolato da fetchSubjects() all'avvio del layout autenticato.
    // Struttura di ogni elemento: { id, subjectName, description, color, cardCount }
    subjects: [],

    // Le flashcard hanno content JSON nel DB: { question: "...", answer: "..." }
    // e un campo `difficult` (INT 0-5).
    // TODO: quando il livello lessons sarà implementato nel frontend,
    //       queste saranno le flashcard della lezione selezionata, non della materia.
    flashcards: [],

    selectedSubjectId: null, // id (INT) della materia selezionata nella sidebar
    loading: false,          // true mentre una chiamata API è in corso
    error: null,             // messaggio di errore dell'ultima chiamata fallita
  }),

  getters: {
    // Restituisce l'oggetto materia completo a partire dall'id selezionato.
    // ?? null evita undefined se nessuna materia è selezionata.
    selectedSubject: (state) =>
      state.subjects.find((s) => s.id === state.selectedSubjectId) ?? null,

    // Somma il cardCount di tutte le materie (usato nella dashboard generale).
    // Quando l'API sarà pronta, cardCount sarà calcolato lato backend.
    totalCards: (state) =>
      state.subjects.reduce((sum, s) => sum + (s.cardCount ?? 0), 0),
  },

  actions: {
    async fetchSubjects() {
      this.loading = true
      this.error   = null
      try {
        // L'API restituirà: [{ id, subjectName, description, color, cardCount }]
        // cardCount viene calcolato nel backend con COUNT su lessons + flashcard_lesson
        const { data } = await axios.get('/api/subjects')
        this.subjects = data
      } catch (e) {
        this.error = e.message
      } finally {
        // finally garantisce che loading torni false anche in caso di errore
        this.loading = false
      }
    },

    // TODO: quando lessons sarà implementato, questo diventerà fetchLessons(subjectId)
    //       e le flashcard si caricheranno solo dopo che l'utente sceglie una lezione.
    async fetchFlashcards(subjectId) {
      this.loading = true
      this.error   = null
      try {
        // L'API restituirà: [{ id, content: { question, answer }, difficult }]
        // Il backend "spacchetta" il campo JSON content prima di rispondere.
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
      // Il backend si aspetta il campo content come JSON: { question, answer }
      // Il campo difficult è opzionale, default 0
      const { data } = await axios.post(`/api/subjects/${subjectId}/flashcards`, {
        content: { question, answer },
        difficult: 0,
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
