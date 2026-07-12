<!--
  CreateFlashcardDialog — form per aggiungere una flashcard a una lezione.
  Riceve `lessonId` per sapere a quale lezione appartiene la nuova card.
  Supporta immagini opzionali per domanda e risposta (max 5MB, JPG/PNG/WebP).
-->
<template>
  <BaseDialog v-model="isOpen" :title="$t('subject.create_flashcard.title')">
    <form @submit.prevent="submit" class="dialog-form">
      <!-- Campi scrollabili -->
      <div class="dialog-form-fields space-y-4">
        <!-- Domanda -->
        <div class="space-y-1">
          <label class="block text-sm text-primary dark:text-on-surface font-medium">
            {{ $t('subject.create_flashcard.question_label') }} *
          </label>
          <textarea
            v-model.trim="form.question"
            :placeholder="$t('subject.create_flashcard.question_placeholder')"
            class="input-field resize-none"
            rows="3"
            required
            autofocus
          />
          <ImagePicker
            v-model="form.questionImage"
            :label="$t('subject.image_picker.question_label')"
            @error="onImageError"
          />
        </div>

        <!-- Risposta -->
        <div class="space-y-1">
          <label class="block text-sm text-primary dark:text-on-surface font-medium">
            {{ $t('subject.create_flashcard.answer_label') }} *
          </label>
          <textarea
            v-model.trim="form.answer"
            :placeholder="$t('subject.create_flashcard.answer_placeholder')"
            class="input-field resize-none"
            rows="3"
            required
          />
          <ImagePicker
            v-model="form.answerImage"
            :label="$t('subject.image_picker.answer_label')"
            @error="onImageError"
          />
        </div>

        <!-- Difficoltà -->
        <div class="space-y-1">
          <label class="block text-sm text-primary dark:text-on-surface font-medium">
            {{ $t('subject.create_flashcard.difficulty_label') }}
          </label>
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
        <button type="button" class="btn-ghost" @click="isOpen = false">
          {{ $t('common.cancel') }}
        </button>
        <button type="submit" class="btn-primary" :disabled="!form.question || !form.answer">
          {{ $t('subject.create_flashcard.submit') }}
        </button>
      </div>
    </form>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import BaseDialog from '@/components/common/BaseDialog.vue'
import ImagePicker from './ImagePicker.vue'

interface DifficultyLevel {
  value: number
  label: string
  cls: string
}

const props = defineProps<{
  modelValue: boolean
  lessonId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [payload: { lessonId: number | null; question: string; answer: string; difficult: number; questionImage: File | null; answerImage: File | null }]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const emptyForm = () => ({
  question: '',
  answer: '',
  difficult: 1,
  questionImage: null as File | null,
  answerImage:   null as File | null,
})

const form = ref(emptyForm())

const difficultyLevels: DifficultyLevel[] = [
  { value: 1, label: 'Facile',    cls: 'difficulty-pill--easy'   },
  { value: 3, label: 'Medio',     cls: 'difficulty-pill--medium' },
  { value: 5, label: 'Difficile', cls: 'difficulty-pill--hard'   },
]

function onImageError(msg: string) {
  toast.error(msg)
}

function submit(): void {
  if (!form.value.question || !form.value.answer) return
  emit('created', {
    lessonId:      props.lessonId,
    question:      form.value.question,
    answer:        form.value.answer,
    difficult:     form.value.difficult,
    questionImage: form.value.questionImage,
    answerImage:   form.value.answerImage,
  })
  form.value = emptyForm()
  isOpen.value = false
}
</script>

<style scoped>
/* La form occupa tutto lo spazio del dialog-body e si divide in:
   - .dialog-form-fields: cresce e scrolla se necessario
   - .dialog-actions: altezza fissa, sempre visibile in fondo */
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
  /* 3px di padding: dà respiro al focus ring che altrimenti viene clippato
     da overflow-y (il browser imposta implicitamente overflow-x: hidden). */
  padding: 3px;
  margin: -3px;
  /* Scrollbar visibile solo all'hover sul modale */
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
