<template>
  <div class="p-8">

    <!-- ── Header materia ─────────────────────────────────────────────── -->
    <div class="mb-6">
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
        <div class="flex items-center gap-2">
          <button
            class="btn-outline flex items-center gap-1.5"
            :title="$t('common.edit')"
            @click="showEditSubject = true"
          >
            <Pencil class="w-4 h-4" />
            {{ $t('common.edit') }}
          </button>
          <button
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            :title="$t('common.delete')"
            @click="showDeleteSubjectConfirm = true"
          >
            <Trash2 class="w-4 h-4" />
            {{ $t('common.delete') }}
          </button>
          <button class="btn-primary flex items-center gap-2" @click="showCreateLesson = true">
            <Plus class="w-4 h-4" />
            {{ $t('subject.add_lesson') }}
          </button>
        </div>
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

    <!-- Modifica materia -->
    <EditSubjectDialog
      :open="showEditSubject"
      :subject="subject"
      @update:open="showEditSubject = $event"
      @subject-updated="onSubjectUpdated"
    />

    <!-- Conferma eliminazione materia -->
    <ConfirmDialog
      v-model="showDeleteSubjectConfirm"
      title="Elimina materia"
      :message="`Stai per eliminare &quot;${subject?.subjectName}&quot; con tutte le sue lezioni e flashcard. L'operazione è irreversibile.`"
      :danger="true"
      :confirm-label="$t('common.delete')"
      @confirm="confirmDeleteSubject"
    />

  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Plus, BookOpen, Layers, Pencil, Trash2 } from 'lucide-vue-next'
import { useFlashcardStore }   from '@/stores/flashcards'
import type { Subject }        from '@/types'
import Swal                    from 'sweetalert2'
import LessonCard              from '@/components/subject/LessonCard.vue'
import CreateLessonDialog      from '@/components/subject/CreateLessonDialog.vue'
import CreateFlashcardDialog   from '@/components/subject/CreateFlashcardDialog.vue'
import EditSubjectDialog       from '@/components/subject/EditSubjectDialog.vue'
import ConfirmDialog           from '@/components/common/ConfirmDialog.vue'

export default defineComponent({
  name: 'SubjectView',

  components: {
    Plus, BookOpen, Layers, Pencil, Trash2,
    LessonCard, CreateLessonDialog, CreateFlashcardDialog, EditSubjectDialog, ConfirmDialog,
  },

  setup() {
    return { store: useFlashcardStore() }
  },

  data() {
    return {
      showCreateLesson:        false,
      showCreateFlashcard:     false,
      showDeleteConfirm:       false,
      showEditSubject:         false,
      showDeleteSubjectConfirm: false,
      targetLessonId:          null as number | null,
      pendingDeleteId:         null as number | null,
    }
  },

  computed: {
    subjectId(): number {
      return Number(this.$route.params.id)
    },

    subject(): Subject | null {
      return this.store.subjects.find((s) => s.id === this.subjectId) ?? null
    },

    totalCards(): number {
      return this.store.lessons.reduce((sum, l) => sum + (l.flashcardCount ?? 0), 0)
    },
  },

  watch: {
    subjectId(newId: number): void {
      this.store.selectSubject(newId)
    },
  },

  mounted(): void {
    this.store.selectSubject(this.subjectId)
  },

  methods: {
    async onCreateLesson(payload: { name: string; description: string }): Promise<void> {
      try {
        await this.store.createLesson({ subjectId: this.subjectId, name: payload.name, description: payload.description })
      } catch {
        Swal.fire({ icon: 'error', title: 'Errore', text: 'Impossibile creare la lezione. Riprova.' })
      }
    },

    onDeleteLesson(lessonId: number): void {
      this.pendingDeleteId   = lessonId
      this.showDeleteConfirm = true
    },

    async confirmDeleteLesson(): Promise<void> {
      if (!this.pendingDeleteId) return
      try {
        await this.store.deleteLesson(this.pendingDeleteId)
        this.pendingDeleteId = null
      } catch {
        Swal.fire({ icon: 'error', title: 'Errore', text: 'Impossibile eliminare la lezione. Riprova.' })
      }
    },

    openAddFlashcard(lessonId: number): void {
      this.targetLessonId      = lessonId
      this.showCreateFlashcard = true
    },

    onStartLesson(lessonId: number): void {
      console.warn('TODO: avvia sessione di studio per la lezione', lessonId)
    },

    async onCreateFlashcard(payload: { lessonId: number; question: string; answer: string; difficult: number }): Promise<void> {
      try {
        await this.store.createFlashcard({
          lessonId:  payload.lessonId,
          question:  payload.question,
          answer:    payload.answer,
          difficult: payload.difficult,
        })
      } catch {
        Swal.fire({ icon: 'error', title: 'Errore', text: 'Impossibile creare la flashcard. Riprova.' })
      }
    },

    async onSubjectUpdated(payload: { name: string; description: string; color: string; emoji: string }): Promise<void> {
      try {
        await this.store.updateSubject(this.subjectId, payload)
      } catch {
        Swal.fire({ icon: 'error', title: 'Errore', text: 'Impossibile modificare la materia. Riprova.' })
      }
    },

    async confirmDeleteSubject(): Promise<void> {
      try {
        await this.store.deleteSubject(this.subjectId)
        this.$router.push('/dashboard')
      } catch {
        Swal.fire({ icon: 'error', title: 'Errore', text: 'Impossibile eliminare la materia. Riprova.' })
      }
    },
  },
})
</script>
