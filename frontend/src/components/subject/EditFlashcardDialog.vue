<template>
  <BaseDialog v-model="isOpen" title="Modifica flashcard">
    <form @submit.prevent="submit" class="space-y-4">
      <div class="space-y-1">
        <label class="block text-sm text-primary font-medium">Domanda *</label>
        <textarea
          v-model.trim="form.question"
          class="input-field resize-none"
          rows="3"
          required
          autofocus
        />
      </div>

      <div class="space-y-1">
        <label class="block text-sm text-primary font-medium">Risposta *</label>
        <textarea
          v-model.trim="form.answer"
          class="input-field resize-none"
          rows="3"
          required
        />
      </div>

      <div class="space-y-1">
        <label class="block text-sm text-primary font-medium">Difficoltà</label>
        <div class="flex gap-2">
          <button
            v-for="level in difficultyLevels"
            :key="level.value"
            type="button"
            class="diff-btn"
            :class="[level.cls, { 'diff-btn--active': form.difficult === level.value }]"
            @click="form.difficult = level.value"
          >
            {{ level.label }}
          </button>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn-ghost" @click="isOpen = false">Annulla</button>
        <button type="submit" class="btn-primary" :disabled="!form.question || !form.answer">Salva</button>
      </div>
    </form>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import type { StudyFlashcard, DifficultyLevel } from '@/data/subjects'

const props = defineProps<{
  modelValue: boolean
  card: StudyFlashcard | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [payload: { flashcardId: number; question: string; answer: string; difficult: number }]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const difficultyLevels = [
  { value: 1, label: 'Facile',    cls: 'diff-easy'   },
  { value: 3, label: 'Medio',     cls: 'diff-medium' },
  { value: 5, label: 'Difficile', cls: 'diff-hard'   },
]

function difficultyToNumber(d: DifficultyLevel): number {
  if (d === 'Facile') return 1
  if (d === 'Media')  return 3
  return 5
}

const form = ref({ question: '', answer: '', difficult: 1 })

watch(() => props.card, (card) => {
  if (card) {
    form.value = {
      question: card.question,
      answer:   card.answer,
      difficult: difficultyToNumber(card.difficulty),
    }
  }
}, { immediate: true })

function submit() {
  if (!form.value.question || !form.value.answer || !props.card) return
  emit('saved', {
    flashcardId: Number(props.card.id),
    question:   form.value.question,
    answer:     form.value.answer,
    difficult:  form.value.difficult,
  })
  isOpen.value = false
}
</script>

<style scoped>
.diff-btn {
  padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
  border: 2px solid transparent; opacity: 0.5; transition: opacity 0.15s, border-color 0.15s;
}
.diff-btn:hover    { opacity: 0.8; }
.diff-btn--active  { opacity: 1; border-color: currentColor; }
.diff-easy   { background: #d1fae5; color: #065f46; }
.diff-medium { background: #fef3c7; color: #92400e; }
.diff-hard   { background: #fee2e2; color: #991b1b; }
</style>
