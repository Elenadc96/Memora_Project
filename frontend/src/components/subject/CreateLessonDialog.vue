<template>
  <BaseDialog v-model="isOpen" :title="$t('subject.create_lesson.title')">
    <form @submit.prevent="handleCreate" class="space-y-4">

      <!-- Titolo -->
      <div class="space-y-1">
        <label class="block text-sm text-primary dark:text-on-surface font-medium">
          {{ $t('subject.create_lesson.name_label') }} *
        </label>
        <input
          v-model.trim="form.title"
          type="text"
          :placeholder="$t('subject.create_lesson.name_placeholder')"
          class="input-field"
          required
          autofocus
          @keydown.enter.prevent="handleCreate"
        />
      </div>

      <!-- Data -->
      <div class="space-y-1">
        <label class="block text-sm text-primary dark:text-on-surface font-medium">Data</label>
        <input v-model="form.date" type="date" class="input-field" />
      </div>

      <!-- Descrizione -->
      <div class="space-y-1">
        <label class="block text-sm text-primary dark:text-on-surface font-medium">
          {{ $t('subject.create_lesson.desc_label') }}
        </label>
        <textarea
          v-model.trim="form.description"
          :placeholder="$t('subject.create_lesson.desc_placeholder')"
          class="input-field resize-none"
          rows="3"
        />
      </div>

      <!-- Anteprima live -->
      <div
        v-if="form.title"
        class="border border-border rounded-lg px-4 py-3 bg-accent/5 dark:bg-white/5 flex items-center gap-3"
      >
        <BookOpen class="w-5 h-5 text-accent flex-shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-semibold text-primary dark:text-on-surface truncate">{{ form.title }}</p>
          <p class="text-xs text-text-muted dark:text-on-surface/60">
            {{ formattedDate }} · 0 flashcard
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn-ghost" @click="isOpen = false">
          {{ $t('common.cancel') }}
        </button>
        <button type="submit" class="btn-primary" :disabled="!form.title">
          {{ $t('subject.create_lesson.submit') }}
        </button>
      </div>
    </form>
  </BaseDialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { BookOpen } from 'lucide-vue-next'
import BaseDialog from '@/components/common/BaseDialog.vue'

export default defineComponent({
  name: 'CreateLessonDialog',
  components: { BaseDialog, BookOpen },

  props: {
    modelValue:  { type: Boolean, required: true },
    subjectName: { type: String,  default: '' },
  },

  emits: ['update:modelValue', 'created'],

  data() {
    return {
      form: {
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      },
    }
  },

  computed: {
    isOpen: {
      get(): boolean { return this.modelValue },
      set(v: boolean): void { this.$emit('update:modelValue', v) },
    },

    formattedDate(): string {
      if (!this.form.date) return ''
      try {
        return new Date(this.form.date).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      } catch {
        return ''
      }
    },
  },

  methods: {
    handleCreate(): void {
      if (!this.form.title) return
      this.$emit('created', {
        name: this.form.title,
        description: this.form.description,
        date: this.formattedDate,
      })
      this.form = { title: '', description: '', date: new Date().toISOString().split('T')[0] }
      this.isOpen = false
    },
  },
})
</script>
