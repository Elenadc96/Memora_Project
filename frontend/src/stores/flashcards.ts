import { defineStore } from 'pinia'
import axios from 'axios'
import { toast } from 'vue-sonner'
import { apiErrorMessage } from '@/utils/notify'
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
  questionImage?: File | null
  answerImage?: File | null
}

interface DeleteFlashcardPayload {
  flashcardId: number
  lessonId: number
}

interface UpdateFlashcardPayload {
  flashcardId: number
  lessonId: number
  question: string
  answer: string
  difficult: number
  // Semantica dei campi immagine (allineata al backend PUT):
  //   undefined  → tieni l'immagine attuale
  //   File       → sostituisci con il nuovo file
  //   null       → rimuovi l'immagine attuale (nessuna sostituzione)
  questionImage?: File | null
  answerImage?: File | null
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
        this.error = apiErrorMessage(e)
        toast.error(this.error)
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

    selectSubject(id: number | null): Promise<void> | undefined {
      this.selectedSubjectId = id
      if (id) {
        this.lessons = []
        this.flashcardsByLesson = {}
        return this.fetchLessons(id)
      }
    },

    async fetchLessons(subjectId: number): Promise<void> {
      this.loading = true
      this.error   = null
      try {
        const { data } = await axios.get<Lesson[]>(`/api/subjects/${subjectId}/lessons`)
        this.lessons = data
      } catch (e) {
        this.lessons = []
        this.error = apiErrorMessage(e)
        toast.error(this.error)
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

    async updateLessonStatus(lessonId: number, payload: { status: 0 | 1 | 2; last_study: string; last_lesson_duration: number }): Promise<void> {
      await axios.patch(`/api/lessons/${lessonId}`, payload)
      const lesson = this.lessons.find(l => l.id === lessonId)
      if (lesson) {
        lesson.status = payload.status
        lesson.last_study = payload.last_study
        lesson.last_lesson_duration = payload.last_lesson_duration
      }
    },

    async saveSession(payload: {
      subjectId: number
      lessonId: number
      duration: number
      results: { cardId: string; rating: 'knew' | 'almost' | 'forgot' }[]
    }): Promise<void> {
      await axios.post('/api/sessions', payload)
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
      } catch (e) {
        // La chiave non viene scritta: hasFlashcardsLoaded resta false e un
        // prossimo accesso alla lezione ritenta il fetch.
        toast.error(apiErrorMessage(e))
      }
    },

    async createFlashcard({ lessonId, question, answer, difficult = 0, questionImage, answerImage }: CreateFlashcardPayload): Promise<Flashcard> {
      // Uso sempre FormData (anche senza file): il backend accetta multipart
      // sia per create che per update, così qui non ci sono due code path.
      const fd = new FormData()
      fd.append('question', question)
      fd.append('answer', answer)
      fd.append('difficult', String(difficult))
      if (questionImage) fd.append('questionImage', questionImage)
      if (answerImage)   fd.append('answerImage',   answerImage)

      const { data } = await axios.post<Flashcard>(`/api/lessons/${lessonId}/flashcards`, fd)
      this._appendFlashcard(lessonId, data)
      this._incrementLessonCount(lessonId)
      if (this.selectedSubjectId) await this._refreshSubjectCardCount(this.selectedSubjectId)
      return data
    },

    async updateFlashcard({ flashcardId, lessonId, question, answer, difficult, questionImage, answerImage }: UpdateFlashcardPayload): Promise<void> {
      const fd = new FormData()
      fd.append('question', question)
      fd.append('answer', answer)
      fd.append('difficult', String(difficult))
      // File nuovo → sostituisce | null → rimuovi | undefined → tieni
      if (questionImage instanceof File) fd.append('questionImage', questionImage)
      else if (questionImage === null)   fd.append('removeQuestionImage', 'true')
      if (answerImage instanceof File) fd.append('answerImage', answerImage)
      else if (answerImage === null)   fd.append('removeAnswerImage', 'true')

      const { data } = await axios.put<Flashcard>(`/api/flashcards/${flashcardId}`, fd)
      if (this.flashcardsByLesson[lessonId]) {
        this.flashcardsByLesson = {
          ...this.flashcardsByLesson,
          [lessonId]: this.flashcardsByLesson[lessonId].map((f) =>
            f.id === flashcardId
              ? { ...f, question, answer, difficult, questionImage: data.questionImage ?? null, answerImage: data.answerImage ?? null }
              : f,
          ),
        }
      }
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
