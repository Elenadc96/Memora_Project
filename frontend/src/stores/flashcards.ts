import { defineStore } from 'pinia'
import axios from 'axios'
import { mockSubjects, mockLessons, mockFlashcards } from '../data/mockSubjectData'
import type { Subject, Lesson, Flashcard } from '@/types'

interface FlashcardState {
  subjects: Subject[]
  selectedSubjectId: number | null
  lessons: Lesson[]
  flashcardsByLesson: Record<number, Flashcard[]>
  loading: boolean
  error: string | null
}

interface CreateLessonPayload {
  subjectId: number
  name: string
  description: string
}

interface CreateFlashcardPayload {
  lessonId: number
  question: string
  answer: string
  difficult?: number
}

interface DeleteFlashcardPayload {
  flashcardId: number
  lessonId: number
}

export const useFlashcardStore = defineStore('flashcards', {
  state: (): FlashcardState => ({
    subjects: [],
    selectedSubjectId: null,
    lessons: [],
    flashcardsByLesson: {},
    loading: false,
    error: null,
  }),

  getters: {
    selectedSubject: (state): Subject | null =>
      state.subjects.find((s) => s.id === state.selectedSubjectId) ?? null,

    totalCards: (state): number =>
      state.subjects.reduce((sum, s) => sum + (s.cardCount ?? 0), 0),

    flashcardsForLesson: (state) => (lessonId: number): Flashcard[] =>
      state.flashcardsByLesson[lessonId] ?? [],

    hasFlashcardsLoaded: (state) => (lessonId: number): boolean =>
      Object.prototype.hasOwnProperty.call(state.flashcardsByLesson, lessonId),
  },

  actions: {
    // ── Subjects ────────────────────────────────────────────────────────────

    async fetchSubjects(): Promise<void> {
      this.loading = true
      this.error   = null
      try {
        const { data } = await axios.get<Subject[]>('/api/subjects')
        this.subjects = data
      } catch (e) {
        this.error    = (e as Error).message
        this.subjects = mockSubjects
      } finally {
        this.loading = false
      }
    },

    // Aggiorna il cardCount di una materia rileggendolo dal DB.
    // Non-bloccante: se fallisce lascia il valore precedente.
    async _refreshSubjectCardCount(subjectId: number): Promise<void> {
      try {
        const { data } = await axios.get<Subject>(`/api/subjects/${subjectId}`)
        const idx = this.subjects.findIndex((s) => s.id === subjectId)
        if (idx !== -1) this.subjects[idx].cardCount = data.cardCount
      } catch { /* non critico */ }
    },

    async createSubject(payload: { name: string; description: string; color: string; emoji: string }): Promise<Subject> {
      const { data } = await axios.post<Subject>('/api/subjects', {
        subjectName: payload.name,
        description: payload.description,
        color:       payload.color,
        emoji:       payload.emoji,
      })
      this.subjects.push(data)
      return data
    },

    async updateSubject(id: number, payload: { name: string; description: string; color: string; emoji: string }): Promise<void> {
      await axios.put(`/api/subjects/${id}`, {
        subjectName: payload.name,
        description: payload.description,
        color:       payload.color,
        emoji:       payload.emoji,
      })
      const idx = this.subjects.findIndex((s) => s.id === id)
      if (idx !== -1) {
        this.subjects[idx] = {
          ...this.subjects[idx],
          subjectName: payload.name,
          description: payload.description,
          color:       payload.color,
          emoji:       payload.emoji,
        }
      }
    },

    async deleteSubject(id: number): Promise<void> {
      await axios.delete(`/api/subjects/${id}`)
      this.subjects = this.subjects.filter((s) => s.id !== id)
      if (this.selectedSubjectId === id) this.selectedSubjectId = null
    },

    // ── Lessons ─────────────────────────────────────────────────────────────

    selectSubject(id: number | null): void {
      this.selectedSubjectId = id
      if (id) {
        this.lessons = []
        this.flashcardsByLesson = {}
        this.fetchLessons(id)
      }
    },

    async fetchLessons(subjectId: number): Promise<void> {
      this.loading = true
      this.error   = null
      try {
        const { data } = await axios.get<Lesson[]>(`/api/subjects/${subjectId}/lessons`)
        this.lessons = data
      } catch {
        this.lessons = mockLessons[subjectId] ?? []
      } finally {
        this.loading = false
      }
    },

    async createLesson({ subjectId, name, description }: CreateLessonPayload): Promise<Lesson> {
      const { data } = await axios.post<Lesson>(`/api/subjects/${subjectId}/lessons`, { name, description })
      this.lessons.push(data)
      await this._refreshSubjectCardCount(subjectId)
      return data
    },

    async deleteLesson(lessonId: number): Promise<void> {
      const lesson = this.lessons.find((l) => l.id === lessonId)
      await axios.delete(`/api/lessons/${lessonId}`)
      this.lessons = this.lessons.filter((l) => l.id !== lessonId)
      delete this.flashcardsByLesson[lessonId]
      if (lesson?.subject_id) await this._refreshSubjectCardCount(lesson.subject_id)
    },

    // ── Flashcards ──────────────────────────────────────────────────────────

    async fetchFlashcardsForLesson(lessonId: number): Promise<void> {
      if (this.hasFlashcardsLoaded(lessonId)) return
      try {
        const { data } = await axios.get<Flashcard[]>(`/api/lessons/${lessonId}/flashcards`)
        this.flashcardsByLesson = { ...this.flashcardsByLesson, [lessonId]: data }
      } catch {
        this.flashcardsByLesson = { ...this.flashcardsByLesson, [lessonId]: mockFlashcards[lessonId] ?? [] }
      }
    },

    async createFlashcard({ lessonId, question, answer, difficult = 0 }: CreateFlashcardPayload): Promise<Flashcard> {
      const { data } = await axios.post<Flashcard>(`/api/lessons/${lessonId}/flashcards`, { question, answer, difficult })
      this._appendFlashcard(lessonId, data)
      this._incrementLessonCount(lessonId)
      if (this.selectedSubjectId) await this._refreshSubjectCardCount(this.selectedSubjectId)
      return data
    },

    async deleteFlashcard({ flashcardId, lessonId }: DeleteFlashcardPayload): Promise<void> {
      await axios.delete(`/api/flashcards/${flashcardId}`)
      if (this.flashcardsByLesson[lessonId]) {
        this.flashcardsByLesson = {
          ...this.flashcardsByLesson,
          [lessonId]: this.flashcardsByLesson[lessonId].filter((f) => f.id !== flashcardId),
        }
      }
      this._decrementLessonCount(lessonId)
      if (this.selectedSubjectId) await this._refreshSubjectCardCount(this.selectedSubjectId)
    },

    // ── Helpers privati ─────────────────────────────────────────────────────

    _appendFlashcard(lessonId: number, card: Flashcard): void {
      const current = this.flashcardsByLesson[lessonId] ?? []
      this.flashcardsByLesson = { ...this.flashcardsByLesson, [lessonId]: [...current, card] }
    },

    _incrementLessonCount(lessonId: number): void {
      const lesson = this.lessons.find((l) => l.id === lessonId)
      if (lesson) lesson.flashcardCount = (lesson.flashcardCount ?? 0) + 1
    },

    _decrementLessonCount(lessonId: number): void {
      const lesson = this.lessons.find((l) => l.id === lessonId)
      if (lesson) lesson.flashcardCount = Math.max(0, (lesson.flashcardCount ?? 1) - 1)
    },
  },
})
