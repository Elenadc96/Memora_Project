<template>
  <div>
    <!-- ── Breadcrumb ─────────────────────────────────────────────────── -->
    <nav class="flex items-center gap-2 text-sm text-text-muted dark:text-on-surface/60 mb-6">
      <button
        class="flex items-center gap-1 hover:text-primary dark:hover:text-on-surface transition-colors"
        @click="emit('back')"
      >
        <ArrowLeft class="w-4 h-4" />
        {{ subjectName }}
      </button>
      <span>/</span>
      <span class="text-primary dark:text-on-surface font-medium">{{ lesson.name }}</span>
    </nav>

    <!-- ── Header lezione ─────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h2 class="page-title">{{ lesson.name }}</h2>
        <p v-if="lessonDate" class="text-xs text-text-muted dark:text-on-surface/60 mt-0.5">
          {{ lessonDate }}
        </p>
        <p v-if="lesson.description" class="page-subtitle mt-1">{{ lesson.description }}</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button class="btn-outline flex items-center gap-2 text-sm" @click="createFlashcardOpen = true">
          <Plus class="w-4 h-4" />
          {{ $t('subject.add_flashcard') }}
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white
                 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-90 transition-all duration-150"
          :style="{ backgroundColor: subjectColor }"
          :disabled="rawFlashcards.length === 0"
          @click="sessionOpen = true"
        >
          <Play class="w-4 h-4" />
          {{ $t('subject.study') }}
        </button>
      </div>
    </div>

    <!-- ── 3 stat card ────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="rounded-xl border border-border bg-white dark:bg-surface p-4 flex items-center gap-3">
        <BookOpen class="w-8 h-8 text-accent opacity-70" />
        <div>
          <p class="text-2xl font-bold text-primary dark:text-on-surface">{{ rawFlashcards.length }}</p>
          <p class="text-xs text-text-muted dark:text-on-surface/60">{{ $t('lesson.total_cards') }}</p>
        </div>
      </div>
      <div class="rounded-xl border border-border bg-white dark:bg-surface p-4 flex items-center gap-3">
        <CheckCircle2 class="w-8 h-8 text-green-500 opacity-80" />
        <div>
          <p class="text-2xl font-bold text-primary dark:text-on-surface">{{ mastered }}</p>
          <p class="text-xs text-text-muted dark:text-on-surface/60">{{ $t('lesson.mastered') }}</p>
        </div>
      </div>
      <div class="rounded-xl border border-border bg-white dark:bg-surface p-4 flex items-center gap-3">
        <Target class="w-8 h-8 text-yellow-500 opacity-80" />
        <div>
          <p class="text-2xl font-bold text-primary dark:text-on-surface">{{ toReview }}</p>
          <p class="text-xs text-text-muted dark:text-on-surface/60">{{ $t('lesson.to_review') }}</p>
        </div>
      </div>
    </div>

    <!-- ── Barra di progresso ─────────────────────────────────────────── -->
    <div v-if="rawFlashcards.length > 0" class="mb-6">
      <div class="flex justify-between text-xs text-text-muted dark:text-on-surface/60 mb-1.5">
        <span>{{ $t('lesson.progress') }}</span>
        <span>{{ $t('lesson.mastered_pct', { pct: masteredPct }) }}</span>
      </div>
      <div class="h-2 rounded-full bg-accent/10 dark:bg-white/10 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-700"
          :style="{ width: masteredPct + '%', backgroundColor: subjectColor }"
        />
      </div>
    </div>

    <!-- ── Search + Filtro ───────────────────────────────────────────── -->
    <div class="flex gap-3 mb-6">
      <div class="flex-1 relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-on-surface/40 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('lesson.search_placeholder')"
          class="input-field pl-9"
        />
      </div>
      <BaseSelect v-model="filterStatus" class="w-44" :options="filterOptions" />
    </div>

    <!-- ── Lista flashcard ───────────────────────────────────────────── -->
    <FlashcardList
      :flashcards="filtered"
      @delete-card="deleteFlashcard"
      @edit-card="(card) => { editTarget = card }"
      @view-card="(card) => { viewTarget = card }"
    />

    <!-- ── Dialog crea flashcard ─────────────────────────────────────── -->
    <CreateFlashcardDialog
      v-model="createFlashcardOpen"
      :lesson-id="lesson.id"
      @created="onCreateFlashcard"
    />

    <!-- ── Modifica flashcard ────────────────────────────────────────── -->
    <EditFlashcardDialog
      :model-value="editTarget !== null"
      :card="editTarget"
      @update:model-value="(v) => { if (!v) editTarget = null }"
      @saved="onSaveFlashcard"
    />

    <!-- ── Visualizza flashcard (flip card) ──────────────────────────── -->
    <FlashcardCardModal
      :card="viewTarget"
      @close="viewTarget = null"
    />

    <!-- ── Sessione di studio (overlay full-screen) ──────────────────── -->
    <StudySession
      v-if="sessionOpen"
      :flashcards="studyFlashcards"
      :lesson-title="lesson.name"
      :subject-color="subjectColor"
      @close="sessionOpen = false"
      @complete="(results, duration) => onSessionComplete(results, duration)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, BookOpen, CheckCircle2, Target, Search, Plus, Play } from 'lucide-vue-next'
import { useTranslation } from 'i18next-vue'
import { useFlashcardStore } from '@/stores/flashcards'
import type { Lesson } from '@/types'
import type { StudyFlashcard, CardStatus } from '@/data/subjects'
import { toStudyFlashcard } from '@/data/subjects'
import { toast } from 'vue-sonner'
import FlashcardList from './FlashcardList.vue'
import StudySession from './StudySession.vue'
import CreateFlashcardDialog from './CreateFlashcardDialog.vue'
import EditFlashcardDialog from './EditFlashcardDialog.vue'
import FlashcardCardModal from './FlashcardCardModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'

const props = defineProps<{
  lesson: Lesson
  subjectName: string
  subjectColor: string
}>()

const emit = defineEmits<{
  back: []
  'session-done': [payload: { lessonId: number; mastered: number; review: number }]
}>()

const store = useFlashcardStore()
const { t } = useTranslation()

const searchQuery = ref('')
const filterStatus = ref('all')

const filterOptions = computed(() => [
  { value: 'all', label: t('lesson.filter_all') },
  { value: 'mastered', label: t('lesson.filter_mastered') },
  { value: 'learning', label: t('lesson.filter_learning') },
  { value: 'review', label: t('lesson.filter_review') },
])
const createFlashcardOpen = ref(false)
const sessionOpen = ref(false)
const editTarget = ref<StudyFlashcard | null>(null)
const viewTarget = ref<StudyFlashcard | null>(null)
const sessionDuration = ref(0)
const cardStatus = ref<Record<string, CardStatus>>({})

const rawFlashcards = computed(() => store.flashcardsForLesson(props.lesson.id))

const studyFlashcards = computed((): StudyFlashcard[] =>
  rawFlashcards.value.map(f =>
    toStudyFlashcard(f, cardStatus.value[String(f.id)] ?? 'learning'),
  ),
)

const mastered = computed(() =>
  studyFlashcards.value.filter(c => c.status === 'mastered').length,
)
const toReview = computed(() =>
  studyFlashcards.value.filter(c => c.status === 'review' || c.status === 'learning').length,
)
const masteredPct = computed(() =>
  studyFlashcards.value.length > 0
    ? Math.round((mastered.value / studyFlashcards.value.length) * 100)
    : 0,
)

const filtered = computed(() =>
  studyFlashcards.value.filter(c => {
    const matchSearch =
      c.question.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.answer.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchStatus = filterStatus.value === 'all' || c.status === filterStatus.value
    return matchSearch && matchStatus
  }),
)

const lessonDate = computed((): string => {
  const raw = props.lesson.last_study ?? props.lesson.created_at
  if (!raw) return ''
  try {
    return new Date(raw).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
})

onMounted(async () => {
  if (!store.hasFlashcardsLoaded(props.lesson.id)) {
    await store.fetchFlashcardsForLesson(props.lesson.id)
  }
  // Ripristina lo status per card dal DB (persiste tra i reload)
  store.flashcardsForLesson(props.lesson.id).forEach(card => {
    if (card.status) cardStatus.value[String(card.id)] = card.status
  })
})

function onSessionComplete(results: { cardId: string; rating: 'knew' | 'almost' | 'forgot' }[], duration = 0) {
  results.forEach(r => {
    cardStatus.value[r.cardId] =
      r.rating === 'knew' ? 'mastered' : r.rating === 'forgot' ? 'review' : 'learning'
  })
  sessionDuration.value = duration

  // Propaga i conteggi aggiornati al parent (SubjectView) per aggiornare la lista lezioni
  emit('session-done', {
    lessonId: props.lesson.id,
    mastered: mastered.value,
    review:   toReview.value,
  })

  if (results.length === 0) return

  const knewCount = results.filter(r => r.rating === 'knew').length
  const newStatus: 0 | 1 | 2 = knewCount === results.length ? 2 : 1

  // Salva la sessione sul backend. Il salvataggio è transazionale lato server
  // (sessione + stato flashcard + punti/streak + badge sono un unico blocco):
  // se questa chiamata fallisce, NULLA di tutto ciò è stato salvato, quindi
  // l'utente va avvisato invece di far finta che sia andato tutto bene.
  store.saveSession({
    subjectId: props.lesson.subject_id,
    lessonId:  props.lesson.id,
    duration,
    results,
  }).catch(() => {
    toast.error('Impossibile salvare la sessione. Punti, streak e badge non sono stati aggiornati.')
  })

  // Aggiorna lo status della lezione
  store.updateLessonStatus(props.lesson.id, {
    status: newStatus,
    last_study: new Date().toISOString(),
    last_lesson_duration: duration,
  }).catch(() => {
    toast.error('Impossibile aggiornare lo stato della lezione. Riprova più tardi.')
  })
}

async function deleteFlashcard(id: string) {
  try {
    await store.deleteFlashcard({ flashcardId: Number(id), lessonId: props.lesson.id })
    delete cardStatus.value[id]
    toast.success('Flashcard eliminata.')
  } catch {
    toast.error('Impossibile eliminare la flashcard. Riprova.')
  }
}

async function onSaveFlashcard(payload: { flashcardId: number; question: string; answer: string; difficult: number; questionImage?: File | null; answerImage?: File | null }) {
  try {
    await store.updateFlashcard({ ...payload, lessonId: props.lesson.id })
    toast.success('Flashcard aggiornata.')
  } catch {
    toast.error('Impossibile aggiornare la flashcard. Riprova.')
  }
}

async function onCreateFlashcard(payload: { lessonId: number | null; question: string; answer: string; difficult: number; questionImage: File | null; answerImage: File | null }) {
  if (payload.lessonId == null) return
  try {
    await store.createFlashcard({
      lessonId:      payload.lessonId,
      question:      payload.question,
      answer:        payload.answer,
      difficult:     payload.difficult,
      questionImage: payload.questionImage,
      answerImage:   payload.answerImage,
    })
    toast.success('Flashcard aggiunta!')
  } catch {
    toast.error('Impossibile creare la flashcard. Riprova.')
  }
}
</script>
