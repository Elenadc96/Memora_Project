export interface UserSettings {
  language?: Language
  theme?: 'light' | 'dark'
}

export interface User {
  id: number
  name: string
  lastName: string
  email: string
  settings?: UserSettings
}

export interface Subject {
  id: number
  subjectName: string
  description: string
  color: string
  emoji: string
  cardCount: number
  user_id: number
}

export interface Flashcard {
  id: number
  question: string
  answer: string
  difficult: number
  status?: CardStatus
}

export interface Lesson {
  id: number
  name: string
  description: string
  subject_id: number
  status: 0 | 1 | 2
  last_study: string | null
  last_lesson_duration: number
  flashcardCount: number
  mastered_count?: number
  review_count?: number
  created_at?: string
}

export type Language = 'it' | 'en'
export type CardStatus = 'mastered' | 'learning' | 'review'
export type DifficultyLevel = 'Facile' | 'Media' | 'Difficile'
