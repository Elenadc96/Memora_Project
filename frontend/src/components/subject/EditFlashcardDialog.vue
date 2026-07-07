<template>
  <BaseDialog v-model="isOpen" title="Modifica flashcard">
    <form @submit.prevent="submit" class="space-y-4">
      <div class="space-y-1">
        <label class="block text-sm text-primary dark:text-on-surface font-medium">Domanda *</label>
        <textarea
          v-model.trim="form.question"
          class="input-field resize-none"
          rows="3"
          required
          autofocus
        />
      </div>

      <div class="space-y-1">
        <label class="block text-sm text-primary dark:text-on-surface font-medium">Risposta *</label>
        <textarea
          v-model.trim="form.answer"
          class="input-field resize-none"
          rows="3"
          required
        />
      </div>

      <div class="space-y-1">
        <label class="block text-sm text-primary dark:text-on-surface font-medium">Difficoltà</label>
        <div class="flex gap-2">
          <button
            v-for="level in difficultyLevels"
            :key="level.value"
            type="button"
            class="difficulty-pill"
            :class="[level.cls, { 'difficulty-pill--active': form.difficult === level.value }]"
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
  { value: 1, label: 'Facile',    cls: 'difficulty-pill--easy'   },
  { value: 3, label: 'Medio',     cls: 'difficulty-pill--medium' },
  { value: 5, label: 'Difficile', cls: 'difficulty-pill--hard'   },
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

