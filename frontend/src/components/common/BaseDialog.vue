<!--
  BaseDialog — modale riusabile in tutta l'app.
  Uso: <BaseDialog v-model="isOpen" title="Titolo">...contenuto...</BaseDialog>
  Chiude sul click del backdrop o sul tasto Esc.
-->
<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-backdrop" @click.self="close">
        <div class="dialog-panel" role="dialog" :aria-label="title">
          <!-- Header -->
          <div class="dialog-header">
            <h3 class="dialog-title">{{ title }}</h3>
            <button class="dialog-close" :aria-label="$t('common.cancel')" @click="close">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Contenuto fornito dal parent -->
          <div class="dialog-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { X } from 'lucide-vue-next'

export default defineComponent({
  name: 'BaseDialog',
  components: { X },

  props: {
    modelValue: { type: Boolean, required: true },
    title:      { type: String,  required: true },
  },

  emits: ['update:modelValue'],

  mounted(): void {
    window.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount(): void {
    window.removeEventListener('keydown', this.onKeydown)
  },

  methods: {
    close(): void {
      this.$emit('update:modelValue', false)
    },
    onKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && this.modelValue) this.close()
    },
  },
})
</script>

<style scoped>
.dialog-backdrop {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(27, 73, 101, 0.4);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.dialog-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  width: 100%; max-width: 480px;
  overflow: hidden;
}

.dark .dialog-panel {
  background: var(--color-surface);
}

.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-accent-30);
}

.dialog-title {
  font-size: 1.05rem; font-weight: 600;
  color: var(--color-primary);
}

.dark .dialog-title { color: var(--color-on-surface); }

.dialog-close {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  color: var(--color-primary); opacity: 0.5;
  transition: opacity 0.15s, background 0.15s;
}
.dark .dialog-close { color: var(--color-on-surface); }
.dialog-close:hover { opacity: 1; background: var(--color-accent-10); }
.dark .dialog-close:hover { background: var(--color-white-10); }

.dialog-body {
  padding: 1.5rem;
}

/* Transizione apertura/chiusura */
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s, transform 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-panel, .dialog-leave-to .dialog-panel { transform: scale(0.95) translateY(8px); }
</style>
