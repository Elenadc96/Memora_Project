import type { Subject, Lesson, Flashcard } from '@/types'

export const mockSubjects: Subject[] = [
  { id: 1, subjectName: 'Matematica', description: 'Studio della matematica di base', color: '#2563EB', emoji: '📐', cardCount: 3, user_id: 0 },
  { id: 2, subjectName: 'Fisica',     description: 'Fondamenti di fisica',            color: '#06B6D4', emoji: '🔬', cardCount: 4, user_id: 0 },
  { id: 3, subjectName: 'Storia',     description: 'Storia mondiale e italiana',      color: '#8B5CF6', emoji: '🏛️', cardCount: 7, user_id: 0 },
]

export const mockLessons: Record<number, Lesson[]> = {
  1: [
    { id: 1, name: 'Teorema di Pitagora', description: 'Relazione tra i lati di un triangolo rettangolo', subject_id: 1, status: 2, last_study: '2026-05-15T10:00:00', last_lesson_duration: 20, flashcardCount: 3 },
    { id: 2, name: 'Trigonometria',        description: 'Seno, coseno, tangente e relazioni fondamentali',  subject_id: 1, status: 1, last_study: '2026-05-16T09:00:00', last_lesson_duration: 15, flashcardCount: 5 },
    { id: 3, name: 'Derivate',             description: 'Calcolo differenziale e regole di derivazione',    subject_id: 1, status: 0, last_study: null, last_lesson_duration: 0, flashcardCount: 0 },
  ],
  2: [
    { id: 4, name: 'Leggi di Newton',  description: 'I tre principi della dinamica', subject_id: 2, status: 1, last_study: '2026-05-14T15:00:00', last_lesson_duration: 25, flashcardCount: 4 },
    { id: 5, name: 'Ottica',           description: 'Riflessione, rifrazione, lenti', subject_id: 2, status: 0, last_study: null, last_lesson_duration: 0, flashcardCount: 0 },
  ],
  3: [
    { id: 6, name: 'Il Rinascimento',        description: 'Arte, cultura e scienza nel XIV-XVI secolo', subject_id: 3, status: 2, last_study: '2026-05-13T11:00:00', last_lesson_duration: 30, flashcardCount: 4 },
    { id: 7, name: 'Rivoluzione Francese',   description: 'Cause, eventi e conseguenze (1789-1799)',    subject_id: 3, status: 1, last_study: '2026-05-16T14:00:00', last_lesson_duration: 20, flashcardCount: 3 },
    { id: 8, name: 'Prima Guerra Mondiale',  description: 'Il conflitto del 1914-1918',                 subject_id: 3, status: 0, last_study: null, last_lesson_duration: 0, flashcardCount: 0 },
  ],
}

export const mockFlashcards: Record<number, Flashcard[]> = {
  1: [
    { id: 1,  question: 'Enuncia il teorema di Pitagora.',                           answer: 'In un triangolo rettangolo, il quadrato dell\'ipotenusa è uguale alla somma dei quadrati dei cateti: a² + b² = c²', difficult: 1 },
    { id: 2,  question: 'Come si chiama il lato opposto all\'angolo retto?',          answer: 'Ipotenusa',                                                                                                            difficult: 1 },
    { id: 3,  question: 'Se i cateti misurano 3 e 4, quanto è lunga l\'ipotenusa?',  answer: '5 (perché 3² + 4² = 9 + 16 = 25 = 5²)',                                                                                difficult: 2 },
  ],
  2: [
    { id: 4,  question: 'Quanto vale sin(30°)?',                               answer: '0,5 (= 1/2)',                     difficult: 2 },
    { id: 5,  question: 'Quanto vale cos(60°)?',                               answer: '0,5 (= 1/2)',                     difficult: 2 },
    { id: 6,  question: 'Qual è la relazione fondamentale della trigonometria?', answer: 'sin²α + cos²α = 1',              difficult: 3 },
    { id: 7,  question: 'Come si calcola la tangente?',                        answer: 'tan(α) = sin(α) / cos(α)',        difficult: 2 },
    { id: 8,  question: 'Quanto vale sin(90°)?',                               answer: '1',                               difficult: 1 },
  ],
  4: [
    { id: 9,  question: 'Enuncia il primo principio della dinamica.',            answer: 'Un corpo rimane in quiete o in moto rettilineo uniforme se la risultante delle forze su di lui è zero.',   difficult: 2 },
    { id: 10, question: 'Formula del secondo principio di Newton.',              answer: 'F = m × a',                                                                                                difficult: 1 },
    { id: 11, question: 'Enuncia il terzo principio di Newton.',                 answer: 'Ad ogni azione corrisponde una reazione uguale e contraria.',                                              difficult: 2 },
    { id: 12, question: 'Qual è l\'unità di misura della forza?',               answer: 'Newton (N) = kg · m/s²',                                                                                  difficult: 1 },
  ],
  6: [
    { id: 13, question: 'In quale periodo si colloca il Rinascimento?',          answer: 'XIV-XVI secolo (1300-1600 circa)',     difficult: 1 },
    { id: 14, question: 'Cita tre grandi artisti del Rinascimento italiano.',    answer: 'Leonardo da Vinci, Michelangelo, Raffaello', difficult: 1 },
    { id: 15, question: 'Cosa significa il termine "Rinascimento"?',             answer: 'Rinascita della cultura classica greco-romana dopo il Medioevo', difficult: 2 },
    { id: 16, question: 'Chi scrisse il "Principe"?',                            answer: 'Niccolò Machiavelli (1513)',            difficult: 2 },
  ],
  7: [
    { id: 17, question: 'In che anno inizia la Rivoluzione Francese?',           answer: '1789',                                difficult: 1 },
    { id: 18, question: 'Quali erano i tre stati della società francese?',       answer: 'Clero (I stato), Nobiltà (II stato), Terzo Stato (popolo)', difficult: 2 },
    { id: 19, question: 'Cosa fu la Bastiglia?',                                 answer: 'Una prigione simbolo del potere reale, assaltata il 14 luglio 1789', difficult: 1 },
  ],
}
