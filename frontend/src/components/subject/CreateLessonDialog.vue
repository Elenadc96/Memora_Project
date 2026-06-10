<!--
  CreateLessonDialog — form per aggiungere una lezione a una materia.
  Usa BaseDialog come contenitore riusabile.
-->
<template>
  <BaseDialog v-model="isOpen" :title="$t('subject.create_lesson.title')">
    <form @submit.prevent="submit" class="space-y-4">
      <div class="space-y-1">
        <label class="block text-sm text-primary font-medium">
          {{ $t('subject.create_lesson.name_label') }} *
        </label>
        <input
          v-model.trim="form.name"
          type="text"
          :placeholder="$t('subject.create_lesson.name_placeholder')"
          class="input-field"
          required
          autofocus
        />
      </div>

      <div class="space-y-1">
        <label class="block text-sm text-primary font-medium">
          {{ $t('subject.create_lesson.desc_label') }}
        </label>
        <textarea
          v-model.trim="form.description"
          :placeholder="$t('subject.create_lesson.desc_placeholder')"
          class="input-field resize-none"
          rows="3"
        />
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn-ghost" @click="isOpen = false">
          {{ $t('common.cancel') }}
        </button>
        <button type="submit" class="btn-primary" :disabled="!form.name">
          {{ $t('subject.create_lesson.submit') }}
        </button>
      </div>
    </form>
  </BaseDialog>
</template>

<script>
import BaseDialog from '@/components/common/BaseDialog.vue'

export default {
  name: 'CreateLessonDialog',
  components: { BaseDialog },

  props: {
    modelValue: { type: Boolean, required: true },
  },

  emits: ['update:modelValue', 'created'],

  data() {
    return {
      form: { name: '', description: '' },
    }
  },

  computed: {
    isOpen: {
      get() { return this.modelValue },
      set(v) { this.$emit('update:modelValue', v) },
    },
  },

  methods: {
    submit() {
      if (!this.form.name) return
      this.$emit('created', { ...this.form })
      this.form = { name: '', description: '' }
      this.isOpen = false
    },
  },
}
</script>
