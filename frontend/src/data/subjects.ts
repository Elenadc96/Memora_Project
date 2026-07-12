export type DifficultyLevel = 'Facile' | 'Media' | 'Difficile'
export type CardStatus = 'mastered' | 'learning' | 'review'

export interface StudyFlashcard {
  id: string
  question: string
  answer: string
  status: CardStatus
  difficulty: DifficultyLevel
  lastReviewed: string
  questionImage?: string | null
  answerImage?: string | null
}

export interface StudyLesson {
  id: string
  title: string
  date: string
  description: string
  flashcards: StudyFlashcard[]
}

export function mapDifficulty(n: number): DifficultyLevel {
  if (n <= 1) return 'Facile'
  if (n <= 3) return 'Media'
  return 'Difficile'
}

export function toStudyFlashcard(
  f: { id: number; question: string; answer: string; difficult: number; questionImage?: string | null; answerImage?: string | null },
  status: CardStatus = 'learning',
): StudyFlashcard {
  return {
    id: String(f.id),
    question: f.question,
    answer: f.answer,
    status,
    difficulty: mapDifficulty(f.difficult),
    lastReviewed: new Date().toISOString().split('T')[0],
    questionImage: f.questionImage ?? null,
    answerImage:   f.answerImage   ?? null,
  }
}

// Mock data con stati misti per la materia Matematica (id=1)
export const mockLessonsPerSubject: Record<string, StudyLesson[]> = {
  '1': [
    {
      id: 'lesson-1',
      title: 'Teorema di Pitagora',
      date: '15 Gen 2025',
      description: 'Relazione tra i lati di un triangolo rettangolo',
      flashcards: [
        {
          id: 'fc-1',
          question: 'Enuncia il teorema di Pitagora.',
          answer: "In un triangolo rettangolo il quadrato dell'ipotenusa è uguale alla somma dei quadrati dei cateti: a² + b² = c²",
          status: 'mastered',
          difficulty: 'Facile',
          lastReviewed: '2025-01-15',
        },
        {
          id: 'fc-2',
          question: "Come si chiama il lato opposto all'angolo retto?",
          answer: 'Ipotenusa',
          status: 'mastered',
          difficulty: 'Facile',
          lastReviewed: '2025-01-15',
        },
        {
          id: 'fc-3',
          question: "Se i cateti misurano 3 e 4, quanto è lunga l'ipotenusa?",
          answer: '5 (perché 3² + 4² = 9 + 16 = 25 = 5²)',
          status: 'review',
          difficulty: 'Media',
          lastReviewed: '2025-01-15',
        },
      ],
    },
    {
      id: 'lesson-2',
      title: 'Trigonometria',
      date: '20 Gen 2025',
      description: 'Seno, coseno, tangente e relazioni fondamentali',
      flashcards: [
        {
          id: 'fc-4',
          question: 'Quanto vale sin(30°)?',
          answer: '0,5 (= 1/2)',
          status: 'learning',
          difficulty: 'Media',
          lastReviewed: '2025-01-20',
        },
        {
          id: 'fc-5',
          question: 'Qual è la relazione fondamentale della trigonometria?',
          answer: 'sin²α + cos²α = 1',
          status: 'learning',
          difficulty: 'Difficile',
          lastReviewed: '2025-01-20',
        },
      ],
    },
    {
      id: 'lesson-3',
      title: 'Derivate',
      date: '25 Gen 2025',
      description: 'Calcolo differenziale e regole di derivazione',
      flashcards: [],
    },
  ],
  '2': [],
  '3': [],
}
