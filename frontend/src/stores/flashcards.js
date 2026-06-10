// Store Pinia per materie, lezioni e flashcard.
// Struttura dati DB: subject → lessons → flashcard_lesson → flashcard
//
// TODO: quando l'autenticazione sarà implementata, passare req.user.id
//       a tutti gli endpoint per filtrare per utente.

import { defineStore } from 'pinia'
import axios from 'axios'
import { mockLessons, mockFlashcards } from '../data/mockSubjectData'

export const useFlashcardStore = defineStore('flashcards', {
  state: () => ({
    // ── Materie ───────────────────────────────────────────────────────────
    subjects: [],
    selectedSubjectId: null,

    // ── Lezioni ───────────────────────────────────────────────────────────
    // Lezioni della materia attualmente aperta.
    // Ogni lezione ha: id, name, description, status, flashcardCount, ...
    lessons: [],

    // ── Flashcard ─────────────────────────────────────────────────────────
    // Mappa lessonId → flashcard[].
    // Cache: evita di ri-fetchare le card di una lezione già caricata.
    flashcardsByLesson: {},

    loading: false,
    error:   null,
  }),

  getters: {
    selectedSubject: (state) =>
      state.subjects.find((s) => s.id === state.selectedSubjectId) ?? null,

    totalCards: (state) =>
      state.subjects.reduce((sum, s) => sum + (s.cardCount ?? 0), 0),

    // Flashcard di una specifica lezione (già caricate)
    flashcardsForLesson: (state) => (lessonId) =>
      state.flashcardsByLesson[lessonId] ?? [],

    // Indica se le flashcard di una lezione sono già in cache
    hasFlashcardsLoaded: (state) => (lessonId) =>
      Object.prototype.hasOwnProperty.call(state.flashcardsByLesson, lessonId),
  },

  actions: {
    // ── Materie ─────────────────────────────────────────────────────────

    async fetchSubjects() {
      this.loading = true
      this.error   = null
      try {
        const { data } = await axios.get('/api/subjects')
        this.subjects = data
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    selectSubject(id) {
      this.selectedSubjectId = id
      if (id) {
        // Pulisce le lezioni della materia precedente
        this.lessons = []
        this.flashcardsByLesson = {}
        this.fetchLessons(id)
      }
    },

    // ── Lezioni ─────────────────────────────────────────────────────────

    async fetchLessons(subjectId) {
      this.loading = true
      this.error   = null
      try {
        const { data } = await axios.get(`/api/subjects/${subjectId}/lessons`)
        this.lessons = data
      } catch {
        // Fallback ai mock finché le API non sono collegate
        this.lessons = mockLessons[subjectId] ?? []
      } finally {
        this.loading = false
      }
    },

    async createLesson({ subjectId, name, description }) {
      try {
        const { data } = await axios.post(`/api/subjects/${subjectId}/lessons`, { name, description })
        this.lessons.push(data)
        return data
      } catch {
        // Mock: crea un oggetto locale con id temporaneo negativo
        const newLesson = {
          id: -(Date.now()),
          name, description,
          subject_id: subjectId,
          status: 0,
          last_study: null,
          last_lesson_duration: 0,
          flashcardCount: 0,
        }
        this.lessons.push(newLesson)
        return newLesson
      }
    },

    async deleteLesson(lessonId) {
      try {
        await axios.delete(`/api/lessons/${lessonId}`)
      } catch { /* mock: procede comunque */ }
      this.lessons = this.lessons.filter((l) => l.id !== lessonId)
      // Rimuove anche le flashcard dalla cache
      delete this.flashcardsByLesson[lessonId]
    },

    // ── Flashcard ────────────────────────────────────────────────────────

    async fetchFlashcardsForLesson(lessonId) {
      // Se già in cache, non ri-fetcha
      if (this.hasFlashcardsLoaded(lessonId)) return

      try {
        const { data } = await axios.get(`/api/lessons/${lessonId}/flashcards`)
        this.flashcardsByLesson = { ...this.flashcardsByLesson, [lessonId]: data }
      } catch {
        // Fallback ai mock
        const mock = mockFlashcards[lessonId] ?? []
        this.flashcardsByLesson = { ...this.flashcardsByLesson, [lessonId]: mock }
      }
    },

    async createFlashcard({ lessonId, question, answer, difficult = 0 }) {
      try {
        const { data } = await axios.post(`/api/lessons/${lessonId}/flashcards`, {
          question, answer, difficult,
        })
        this._appendFlashcard(lessonId, data)
        this._incrementLessonCount(lessonId)
        return data
      } catch {
        const newCard = { id: -(Date.now()), question, answer, difficult }
        this._appendFlashcard(lessonId, newCard)
        this._incrementLessonCount(lessonId)
        return newCard
      }
    },

    async deleteFlashcard({ flashcardId, lessonId }) {
      try {
        await axios.delete(`/api/flashcards/${flashcardId}`)
      } catch { /* mock: procede comunque */ }
      if (this.flashcardsByLesson[lessonId]) {
        this.flashcardsByLesson = {
          ...this.flashcardsByLesson,
          [lessonId]: this.flashcardsByLesson[lessonId].filter((f) => f.id !== flashcardId),
        }
      }
      this._decrementLessonCount(lessonId)
    },

    // ── Helpers privati ──────────────────────────────────────────────────

    _appendFlashcard(lessonId, card) {
      const current = this.flashcardsByLesson[lessonId] ?? []
      this.flashcardsByLesson = { ...this.flashcardsByLesson, [lessonId]: [...current, card] }
    },

    _incrementLessonCount(lessonId) {
      const lesson = this.lessons.find((l) => l.id === lessonId)
      if (lesson) lesson.flashcardCount = (lesson.flashcardCount ?? 0) + 1
    },

    _decrementLessonCount(lessonId) {
      const lesson = this.lessons.find((l) => l.id === lessonId)
      if (lesson) lesson.flashcardCount = Math.max(0, (lesson.flashcardCount ?? 1) - 1)
    },
  },
})
