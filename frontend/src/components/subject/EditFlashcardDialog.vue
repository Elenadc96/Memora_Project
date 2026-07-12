<template>
  <BaseDialog v-model="isOpen" :title="$t('subject.edit_flashcard.title')">
    <form @submit.prevent="submit" class="dialog-form">
      <!-- Campi scrollabili -->
      <div class="dialog-form-fields space-y-4">
        <!-- ── Domanda ────────────────────────────────────────────────── -->
        <div class="space-y-1">
          <label class="block text-sm text-primary dark:text-on-surface font-medium">{{ $t('subject.edit_flashcard.question_label') }} *</label>
          <textarea
            v-model.trim="form.question"
            class="input-field resize-none"
            rows="3"
            required
            autofocus
          />
          <ImagePicker
            v-model="form.questionImage"
            :existing-url="form.existingQuestionImage"
            :label="$t('subject.image_picker.question_label')"
            @remove-existing="form.existingQuestionImage = null"
            @error="onImageError"
          />
        </div>

        <!-- ── Risposta ───────────────────────────────────────────────── -->
        <div class="space-y-1">
          <label class="block text-sm text-primary dark:text-on-surface font-medium">{{ $t('subject.edit_flashcard.answer_label') }} *</label>
          <textarea
            v-model.trim="form.answer"
            class="input-field resize-none"
            rows="3"
            required
          />
          <ImagePicker
            v-model="form.answerImage"
            :existing-url="form.existingAnswerImage"
            :label="$t('subject.image_picker.answer_label')"
            @remove-existing="form.existingAnswerImage = null"
            @error="onImageError"
          />
        </div>

        <!-- ── Difficoltà ─────────────────────────────────────────────── -->
        <div class="space-y-1">
          <label class="block text-sm text-primary dark:text-on-surface font-medium">{{ $t('subject.edit_flashcard.difficulty_label') }}</label>
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
      </div>

      <!-- Pulsanti fuori dall'area scrollabile: sempre visibili -->
      <div class="dialog-actions">
        <button type="button" class="btn-ghost" @click="isOpen = false">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn-primary" :disabled="!form.question || !form.answer">{{ $t('subject.edit_flashcard.submit') }}</button>
      </div>
    </form>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import BaseDialog from '@/components/common/BaseDialog.vue'
import ImagePicker from './ImagePicker.vue'
import type { StudyFlashcard, DifficultyLevel } from '@/data/subjects'

const props = defineProps<{
  modelValue: boolean
  card: StudyFlashcard | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  // questionImage/answerImage:
  //   undefined → tieni | File → sostituisci | null → rimuovi
  saved: [payload: {
    flashcardId: number
    question: string
    answer: string
    difficult: number
    questionImage?: File | null
    answerImage?: File | null
  }]
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

// Stato del form:
// - questionImage / answerImage      → nuovo File selezionato (o null)
// - existingQuestionImage / existing → URL dell'immagine attuale sul server;
//   se l'utente clicca "rimuovi" viene messo a null e il submit segnala la
//   rimozione al backend.
const form = ref({
  question: '',
  answer: '',
  difficult: 1,
  questionImage: null as File | null,
  answerImage:   null as File | null,
  existingQuestionImage: null as string | null,
  existingAnswerImage:   null as string | null,
})

watch(() => props.card, (card) => {
  if (card) {
    form.value = {
      question: card.question,
      answer:   card.answer,
      difficult: difficultyToNumber(card.difficulty),
      questionImage: null,
      answerImage:   null,
      existingQuestionImage: card.questionImage ?? null,
      existingAnswerImage:   card.answerImage   ?? null,
    }
  }
}, { immediate: true })

function onImageError(msg: string) {
  toast.error(msg)
}

// Decide il valore da inviare per un campo immagine, dato:
// - il nuovo File (o null) selezionato dall'utente
// - se l'immagine esistente è stata rimossa
// - il valore originale
function resolveImagePayload(
  newFile: File | null,
  currentExisting: string | null,
  originalExisting: string | null | undefined,
): File | null | undefined {
  if (newFile) return newFile
  if (originalExisting && !currentExisting) return null // rimozione esplicita
  return undefined // tieni ciò che c'era
}

function submit() {
  if (!form.value.question || !form.value.answer || !props.card) return
  const originalQ = props.card.questionImage ?? null
  const originalA = props.card.answerImage   ?? null
  emit('saved', {
    flashcardId:   Number(props.card.id),
    question:      form.value.question,
    answer:        form.value.answer,
    difficult:     form.value.difficult,
    questionImage: resolveImagePayload(form.value.questionImage, form.value.existingQuestionImage, originalQ),
    answerImage:   resolveImagePayload(form.value.answerImage,   form.value.existingAnswerImage,   originalA),
  })
  isOpen.value = false
}
</script>

<style scoped>
.dialog-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 1rem;
}

.dialog-form-fields {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 3px;
  margin: -3px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
.dialog-form-fields:hover {
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}
.dialog-form-fields::-webkit-scrollbar       { width: 5px; }
.dialog-form-fields::-webkit-scrollbar-track { background: transparent; }
.dialog-form-fields::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; }
.dialog-form-fields:hover::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.2); }
.dark .dialog-form-fields:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.25); }

.dialog-actions {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-accent-30);
}
</style>
