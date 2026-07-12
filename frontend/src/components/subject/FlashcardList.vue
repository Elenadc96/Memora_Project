<template>
  <div>
    <!-- Lista flashcard -->
    <div v-if="flashcards.length" class="flex flex-col gap-3">
      <div
        v-for="card in flashcards"
        :key="card.id"
        class="border border-border rounded-xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-surface group relative"
      >
        <!-- Badges -->
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" :class="statusClass(card.status)">
            {{ statusLabel(card.status) }}
          </span>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" :class="diffClass(card.difficulty)">
            {{ card.difficulty }}
          </span>
        </div>

        <!-- Domanda -->
        <p class="font-medium text-primary dark:text-on-surface text-sm mb-2">{{ card.question }}</p>
        <img
          v-if="card.questionImage"
          :src="card.questionImage"
          alt=""
          class="flashcard-list-img mb-2"
        />

        <!-- Risposta -->
        <p class="text-text-muted dark:text-on-surface/60 text-sm leading-relaxed">{{ card.answer }}</p>
        <img
          v-if="card.answerImage"
          :src="card.answerImage"
          alt=""
          class="flashcard-list-img mt-2"
        />

        <!-- Menu ⋮ -->
        <div class="absolute top-4 right-4">
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-accent/10 dark:hover:bg-white/10 transition-colors"
            @click.stop="toggleMenu(card.id)"
          >
            <MoreVertical class="w-4 h-4" />
          </button>

          <!-- Dropdown -->
          <div
            v-if="openMenuId === card.id"
            class="absolute right-0 top-8 w-40 bg-white dark:bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-10"
          >
            <button
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary dark:text-on-surface hover:bg-accent/5 dark:hover:bg-white/5 transition-colors"
              @click="openMenuId = null; emit('view-card', card)"
            >
              <Eye class="w-4 h-4" />
              {{ $t('common.view') }}
            </button>
            <button
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary dark:text-on-surface hover:bg-accent/5 dark:hover:bg-white/5 transition-colors"
              @click="openMenuId = null; emit('edit-card', card)"
            >
              <Pencil class="w-4 h-4" />
              {{ $t('common.edit') }}
            </button>
            <div class="border-t border-border mx-3" />
            <button
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              @click="requestDelete(card)"
            >
              <Trash2 class="w-4 h-4" />
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stato vuoto -->
    <div v-else class="flex flex-col items-center py-16 gap-3 text-text-muted dark:text-on-surface/50">
      <BookOpen class="w-10 h-10 opacity-40" />
      <p class="text-sm">{{ $t('subject.no_flashcards') }}</p>
    </div>

    <!-- Confirm delete flashcard -->
    <ConfirmDeleteDialog
      :open="!!deleteTarget"
      title="Elimina flashcard"
      description="La flashcard verrà rimossa definitivamente da questa lezione."
      :item-name="deleteTarget?.question ?? ''"
      @update:open="(v) => { if (!v) deleteTarget = null }"
      @confirm="onConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MoreVertical, Eye, Pencil, Trash2, BookOpen } from 'lucide-vue-next'
import { useTranslation } from 'i18next-vue'
import type { StudyFlashcard, CardStatus, DifficultyLevel } from '@/data/subjects'
import ConfirmDeleteDialog from './ConfirmDeleteDialog.vue'

const { t } = useTranslation()

defineProps<{
  flashcards: StudyFlashcard[]
}>()

const emit = defineEmits<{
  'delete-card': [id: string]
  'edit-card':   [card: StudyFlashcard]
  'view-card':   [card: StudyFlashcard]
}>()

const openMenuId = ref<string | null>(null)
const deleteTarget = ref<StudyFlashcard | null>(null)

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function requestDelete(card: StudyFlashcard) {
  deleteTarget.value = card
  openMenuId.value = null
}

function onConfirmDelete() {
  if (deleteTarget.value) {
    emit('delete-card', deleteTarget.value.id)
    deleteTarget.value = null
  }
}

function statusLabel(status: CardStatus): string {
  return t(`lesson.status_${status}`)
}

function statusClass(status: CardStatus): string {
  const map: Record<CardStatus, string> = {
    mastered: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    learning: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  }
  return map[status]
}

function diffClass(difficulty: DifficultyLevel): string {
  const map: Record<DifficultyLevel, string> = {
    Facile: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    Media: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400',
    Difficile: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  }
  return map[difficulty]
}
</script>

<style scoped>
.flashcard-list-img {
  max-height: 180px;
  max-width: 100%;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: rgba(0, 0, 0, 0.02);
}
</style>
