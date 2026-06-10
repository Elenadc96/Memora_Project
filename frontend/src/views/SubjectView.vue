<template>
  <div class="p-8">

    <!-- ── Header materia ─────────────────────────────────────────────── -->
    <div class="mb-6">
      <!-- Breadcrumb / back -->
      <button class="flex items-center gap-1 text-sm mb-4 btn-ghost py-1 px-2 -ml-2" @click="$router.push('/dashboard')">
        <ChevronLeft class="w-4 h-4" />
        {{ $t('subject.back') }}
      </button>

      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <!-- Pallino colorato della materia -->
          <span
            class="w-4 h-4 rounded-full flex-shrink-0 mt-1"
            :style="{ backgroundColor: subject?.color ?? '#5FA8D3' }"
          />
          <div>
            <h2 class="page-title">{{ subject?.subjectName ?? $t('common.loading') }}</h2>
            <p v-if="subject?.description" class="page-subtitle">{{ subject.description }}</p>
          </div>
        </div>

        <!-- Azioni header -->
        <button class="btn-primary flex items-center gap-2" @click="showCreateLesson = true">
          <Plus class="w-4 h-4" />
          {{ $t('subject.add_lesson') }}
        </button>
      </div>

      <!-- Stats della materia -->
      <div class="flex gap-6 mt-4 text-sm text-text-muted dark:text-on-surface/60">
        <span class="flex items-center gap-1">
          <BookOpen class="w-4 h-4" />
          {{ store.lessons.length }} {{ $t('subject.lessons_count') }}
        </span>
        <span class="flex items-center gap-1">
          <Layers class="w-4 h-4" />
          {{ totalCards }} {{ $t('subject.cards_count') }}
        </span>
      </div>
    </div>

    <!-- ── Stato di caricamento ────────────────────────────────────────── -->
    <div v-if="store.loading" class="flex justify-center py-16">
      <p class="text-text-muted">{{ $t('common.loading') }}</p>
    </div>

    <!-- ── Lista lezioni ──────────────────────────────────────────────── -->
    <template v-else>
      <div v-if="store.lessons.length" class="flex flex-col gap-3">
        <LessonCard
          v-for="lesson in store.lessons"
          :key="lesson.id"
          :lesson="lesson"
          @delete="onDeleteLesson"
          @add-flashcard="openAddFlashcard"
          @start-lesson="onStartLesson"
        />
      </div>

      <!-- Stato vuoto -->
      <div v-else class="card flex flex-col items-center py-16 gap-4">
        <BookOpen class="w-12 h-12 text-accent opacity-40" />
        <p class="page-subtitle text-center">{{ $t('subject.no_lessons') }}</p>
        <button class="btn-primary" @click="showCreateLesson = true">
          {{ $t('subject.add_lesson') }}
        </button>
      </div>
    </template>

    <!-- ── Dialogs ─────────────────────────────────────────────────────── -->
    <CreateLessonDialog
      v-model="showCreateLesson"
      @created="onCreateLesson"
    />

    <CreateFlashcardDialog
      v-model="showCreateFlashcard"
      :lesson-id="targetLessonId"
      @created="onCreateFlashcard"
    />

    <!-- Conferma eliminazione lezione -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="$t('subject.delete_lesson_title')"
      :message="$t('subject.delete_lesson_message')"
      :danger="true"
      :confirm-label="$t('common.delete')"
      @confirm="confirmDeleteLesson"
    />

  </div>
</template>

<script>
import { ChevronLeft, Plus, BookOpen, Layers } from 'lucide-vue-next'
import { useFlashcardStore }   from '@/stores/flashcards'
import LessonCard              from '@/components/subject/LessonCard.vue'
import CreateLessonDialog      from '@/components/subject/CreateLessonDialog.vue'
import CreateFlashcardDialog   from '@/components/subject/CreateFlashcardDialog.vue'
import ConfirmDialog           from '@/components/common/ConfirmDialog.vue'

export default {
  name: 'SubjectView',

  components: {
    ChevronLeft, Plus, BookOpen, Layers,
    LessonCard, CreateLessonDialog, CreateFlashcardDialog, ConfirmDialog,
  },

  setup() {
    return { store: useFlashcardStore() }
  },

  data() {
    return {
      showCreateLesson:    false,
      showCreateFlashcard: false,
      showDeleteConfirm:   false,
      targetLessonId:      null,   // lezione a cui aggiungere la prossima flashcard
      pendingDeleteId:     null,   // lezione in attesa di conferma eliminazione
    }
  },

  computed: {
    // L'id della materia viene dal parametro URL (:id)
    subjectId() {
      return Number(this.$route.params.id)
    },

    subject() {
      return this.store.subjects.find((s) => s.id === this.subjectId) ?? null
    },

    totalCards() {
      return this.store.lessons.reduce((sum, l) => sum + (l.flashcardCount ?? 0), 0)
    },
  },

  watch: {
    // Ricarica le lezioni se l'utente naviga a una materia diversa
    subjectId(newId) {
      this.store.selectSubject(newId)
    },
  },

  mounted() {
    // Seleziona la materia nello store e carica le sue lezioni
    this.store.selectSubject(this.subjectId)
  },

  methods: {
    async onCreateLesson(payload) {
      await this.store.createLesson({
        subjectId:   this.subjectId,
        name:        payload.name,
        description: payload.description,
      })
    },

    // Primo click su "elimina lezione" → apre il ConfirmDialog
    onDeleteLesson(lessonId) {
      this.pendingDeleteId   = lessonId
      this.showDeleteConfirm = true
    },

    // Chiamato solo dopo che l'utente ha confermato nel ConfirmDialog
    async confirmDeleteLesson() {
      if (!this.pendingDeleteId) return
      await this.store.deleteLesson(this.pendingDeleteId)
      this.pendingDeleteId = null
    },

    // Apre il dialog flashcard puntando alla lezione corretta
    openAddFlashcard(lessonId) {
      this.targetLessonId      = lessonId
      this.showCreateFlashcard = true
    },

    // TODO: navigare a /study/:lessonId quando la sessione di studio sarà implementata.
    //       Vedi il commento in LessonCard.vue per i dettagli del flusso.
    onStartLesson(lessonId) {
      console.warn('TODO: avvia sessione di studio per la lezione', lessonId)
    },

    async onCreateFlashcard(payload) {
      await this.store.createFlashcard({
        lessonId:  payload.lessonId,
        question:  payload.question,
        answer:    payload.answer,
        difficult: payload.difficult,
      })
    },
  },
}
</script>
