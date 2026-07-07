<!--
  CreateFlashcardDialog — form per aggiungere una flashcard a una lezione.
  Riceve `lessonId` per sapere a quale lezione appartiene la nuova card.
-->
<template>
  <BaseDialog v-model="isOpen" :title="$t('subject.create_flashcard.title')">
    <form @submit.prevent="submit" class="space-y-4">
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
      </div>

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

      <div class="flex justify-end gap-3 pt-2">
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

<script lang="ts">
import { defineComponent } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'

interface DifficultyLevel {
  value: number
  label: string
  cls: string
}

export default defineComponent({
  name: 'CreateFlashcardDialog',
  components: { BaseDialog },

  props: {
    modelValue: { type: Boolean, required: true },
    lessonId:   { type: Number,  default: null  },
  },

  emits: ['update:modelValue', 'created'],

  data() {
    return {
      form: { question: '', answer: '', difficult: 1 },
      difficultyLevels: [
        { value: 1, label: 'Facile',    cls: 'difficulty-pill--easy'   },
        { value: 3, label: 'Medio',     cls: 'difficulty-pill--medium' },
        { value: 5, label: 'Difficile', cls: 'difficulty-pill--hard'   },
      ] as DifficultyLevel[],
    }
  },

  computed: {
    isOpen: {
      get(): boolean { return this.modelValue },
      set(v: boolean): void { this.$emit('update:modelValue', v) },
    },
  },

  methods: {
    submit(): void {
      if (!this.form.question || !this.form.answer) return
      this.$emit('created', { lessonId: this.lessonId, ...this.form })
      this.form = { question: '', answer: '', difficult: 1 }
      this.isOpen = false
    },
  },
})
</script>
