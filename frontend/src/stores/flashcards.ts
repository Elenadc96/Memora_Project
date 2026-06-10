import { defineStore } from 'pinia'
import axios from 'axios'
import { mockLessons, mockFlashcards } from '../data/mockSubjectData'
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
    async fetchSubjects(): Promise<void> {
      this.loading = true
      this.error   = null
      try {
        const { data } = await axios.get<Subject[]>('/api/subjects')
        this.subjects = data
      } catch (e) {
        this.error = (e as Error).message
      } finally {
        this.loading = false
      }
    },

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
      try {
        const { data } = await axios.post<Lesson>(`/api/subjects/${subjectId}/lessons`, { name, description })
        this.lessons.push(data)
        return data
      } catch {
        const newLesson: Lesson = {
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

    async deleteLesson(lessonId: number): Promise<void> {
      try {
        await axios.delete(`/api/lessons/${lessonId}`)
      } catch { /* mock: procede comunque */ }
      this.lessons = this.lessons.filter((l) => l.id !== lessonId)
      delete this.flashcardsByLesson[lessonId]
    },

    async fetchFlashcardsForLesson(lessonId: number): Promise<void> {
      if (this.hasFlashcardsLoaded(lessonId)) return
      try {
        const { data } = await axios.get<Flashcard[]>(`/api/lessons/${lessonId}/flashcards`)
        this.flashcardsByLesson = { ...this.flashcardsByLesson, [lessonId]: data }
      } catch {
        const mock = mockFlashcards[lessonId] ?? []
        this.flashcardsByLesson = { ...this.flashcardsByLesson, [lessonId]: mock }
      }
    },

    async createFlashcard({ lessonId, question, answer, difficult = 0 }: CreateFlashcardPayload): Promise<Flashcard> {
      try {
        const { data } = await axios.post<Flashcard>(`/api/lessons/${lessonId}/flashcards`, {
          question, answer, difficult,
        })
        this._appendFlashcard(lessonId, data)
        this._incrementLessonCount(lessonId)
        return data
      } catch {
        const newCard: Flashcard = { id: -(Date.now()), question, answer, difficult }
        this._appendFlashcard(lessonId, newCard)
        this._incrementLessonCount(lessonId)
        return newCard
      }
    },

    async deleteFlashcard({ flashcardId, lessonId }: DeleteFlashcardPayload): Promise<void> {
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
