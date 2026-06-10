<!--
  LessonCard — card collassabile per una lezione.
  Quando espansa carica le flashcard (lazy) e le mostra tramite FlashcardItem.
  Emette: delete (lessonId), add-flashcard (lessonId)
-->
<template>
  <div class="lesson-card" :class="{ 'lesson-card--expanded': isExpanded }">

    <!-- ── Header lezione (click per espandere/collassare) ────────────── -->
    <div class="lesson-header" @click="toggle">
      <!-- Icona expand -->
      <ChevronRight class="lesson-chevron w-5 h-5" :class="{ 'rotate-90': isExpanded }" />

      <!-- Info principale -->
      <div class="lesson-info">
        <span class="lesson-name">{{ lesson.name }}</span>
        <span v-if="lesson.description" class="lesson-desc">{{ lesson.description }}</span>
      </div>

      <!-- Metadata -->
      <div class="lesson-meta">
        <span class="lesson-badge" :class="statusClass">{{ statusLabel }}</span>

        <span class="lesson-count">
          <BookOpen class="w-3.5 h-3.5" />
          {{ lesson.flashcardCount ?? 0 }} card
        </span>

        <span v-if="lesson.last_study" class="lesson-duration">
          <Clock class="w-3.5 h-3.5" />
          {{ lesson.last_lesson_duration }} min
        </span>
      </div>

      <!-- Azioni (visibili su hover) -->
      <div class="lesson-actions" @click.stop>
        <!-- TODO: implementare la sessione di studio.
             Al click dovrebbe:
             1. Caricare le flashcard della lezione (già disponibili nello store)
             2. Navigare a una route /study/:lessonId (da creare)
             3. Avviare il componente StudySession che mostra le card una ad una,
                registra le risposte e aggiorna status + last_study + last_lesson_duration
                tramite una chiamata PATCH /api/lessons/:id -->
        <button class="btn-primary py-1 px-3 text-xs flex items-center gap-1" @click="$emit('start-lesson', lesson.id)">
          <Play class="w-3.5 h-3.5" />
          {{ $t('subject.start_lesson') }}
        </button>

        <button class="btn-outline py-1 px-3 text-xs flex items-center gap-1" @click="$emit('add-flashcard', lesson.id)">
          <Plus class="w-3.5 h-3.5" />
          {{ $t('subject.add_flashcard') }}
        </button>
        <button
          class="lesson-delete"
          :aria-label="$t('common.delete')"
          @click="$emit('delete', lesson.id)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- ── Body: lista flashcard ──────────────────────────────────────── -->
    <Transition name="lesson-body">
      <div v-if="isExpanded" class="lesson-body">
        <!-- Caricamento -->
        <p v-if="loadingCards" class="lesson-empty">{{ $t('common.loading') }}</p>

        <!-- Lista flashcard -->
        <template v-else-if="flashcards.length">
          <FlashcardItem
            v-for="card in flashcards"
            :key="card.id"
            :flashcard="card"
            @delete="onDeleteFlashcard"
          />
        </template>

        <!-- Stato vuoto -->
        <div v-else class="lesson-empty">
          <p>{{ $t('subject.no_flashcards') }}</p>
          <button class="btn-outline text-sm mt-2" @click="$emit('add-flashcard', lesson.id)">
            {{ $t('subject.add_flashcard') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { ChevronRight, BookOpen, Clock, Plus, Trash2, Play } from 'lucide-vue-next'
import { useFlashcardStore } from '@/stores/flashcards'
import type { Lesson, Flashcard } from '@/types'
import FlashcardItem from './FlashcardItem.vue'

interface StatusInfo {
  label: string
  cls: string
}

const STATUS: Record<number, StatusInfo> = {
  0: { label: 'Non iniziata', cls: 'status--idle'    },
  1: { label: 'In corso',     cls: 'status--active'  },
  2: { label: 'Completata',   cls: 'status--done'    },
}

export default defineComponent({
  name: 'LessonCard',
  components: { ChevronRight, BookOpen, Clock, Plus, Trash2, Play, FlashcardItem },

  props: {
    lesson: { type: Object as PropType<Lesson>, required: true },
  },

  emits: ['delete', 'add-flashcard', 'start-lesson'],

  setup() {
    return { store: useFlashcardStore() }
  },

  data() {
    return {
      isExpanded:   false,
      loadingCards: false,
    }
  },

  computed: {
    statusLabel(): string { return STATUS[this.lesson.status]?.label ?? 'Non iniziata' },
    statusClass(): string  { return STATUS[this.lesson.status]?.cls  ?? 'status--idle'  },

    flashcards(): Flashcard[] {
      return this.store.flashcardsForLesson(this.lesson.id)
    },
  },

  methods: {
    async toggle(): Promise<void> {
      this.isExpanded = !this.isExpanded
      if (this.isExpanded && !this.store.hasFlashcardsLoaded(this.lesson.id)) {
        this.loadingCards = true
        await this.store.fetchFlashcardsForLesson(this.lesson.id)
        this.loadingCards = false
      }
    },

    async onDeleteFlashcard(flashcardId: number): Promise<void> {
      await this.store.deleteFlashcard({ flashcardId, lessonId: this.lesson.id })
    },
  },
})
</script>

<style scoped>
.lesson-card {
  border: 1px solid var(--color-accent-30);
  border-radius: 12px;
  overflow: hidden;
  background: white;
  transition: box-shadow 0.2s;
}
.dark .lesson-card { background: var(--color-surface); }
.lesson-card--expanded { box-shadow: 0 4px 16px rgba(var(--color-accent-rgb), 0.12); }

.lesson-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.lesson-header:hover { background: rgba(var(--color-accent-rgb), 0.04); }

.lesson-chevron { color: var(--color-primary); opacity: 0.4; flex-shrink: 0; transition: transform 0.2s; }
.rotate-90 { transform: rotate(90deg); }

.lesson-info { flex: 1; min-width: 0; }
.lesson-name { display: block; font-weight: 600; font-size: 14px; color: var(--color-primary); }
.dark .lesson-name { color: var(--color-on-surface); }
.lesson-desc { display: block; font-size: 12px; color: var(--color-primary); opacity: 0.55; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.lesson-meta { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.lesson-badge {
  padding: 2px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.status--idle   { background: #f3f4f6; color: #6b7280; }
.status--active { background: rgba(var(--color-accent-rgb), 0.15); color: var(--color-accent); }
.status--done   { background: #d1fae5; color: #065f46; }

.lesson-count, .lesson-duration {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--color-primary); opacity: 0.55;
}

.lesson-actions {
  display: flex; align-items: center; gap: 6px;
  opacity: 0; transition: opacity 0.15s;
}
.lesson-header:hover .lesson-actions { opacity: 1; }

.lesson-delete {
  color: #ef4444; padding: 4px; border-radius: 6px;
  opacity: 0.7; transition: opacity 0.15s, background 0.15s;
}
.lesson-delete:hover { opacity: 1; background: #fee2e2; }

.lesson-body {
  padding: 4px 16px 16px;
  display: flex; flex-direction: column; gap: 8px;
  border-top: 1px solid var(--color-accent-30);
}

.lesson-empty {
  text-align: center; padding: 20px;
  font-size: 13px; color: var(--color-primary); opacity: 0.5;
}

/* Transizione apertura/chiusura body */
.lesson-body-enter-active, .lesson-body-leave-active { transition: opacity 0.2s; }
.lesson-body-enter-from, .lesson-body-leave-to { opacity: 0; }
</style>
