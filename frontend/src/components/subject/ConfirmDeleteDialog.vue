<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-backdrop" @click.self="close">
        <div class="dialog-panel" role="dialog">
          <!-- Barra rossa in cima -->
          <div class="h-1 w-full bg-red-500 rounded-t-2xl" />

          <!-- Header -->
          <div class="flex items-start gap-4 px-6 pt-5 pb-3">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle class="w-5 h-5 text-red-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-base font-semibold text-primary dark:text-on-surface">{{ title }}</h3>
              <p class="mt-1 text-sm text-text-muted dark:text-on-surface/60 leading-relaxed">{{ description }}</p>
            </div>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-accent/10 transition-colors"
              @click="close"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Riquadro elemento da eliminare -->
          <div class="mx-6 mb-4 rounded-lg border border-border bg-accent/5 dark:bg-white/5 px-4 py-3">
            <p class="text-xs text-text-muted dark:text-on-surface/60 mb-0.5">{{ $t('common.about_to_delete') }}</p>
            <p class="text-sm font-semibold text-primary dark:text-on-surface">{{ itemName }}</p>
          </div>

          <!-- Checkbox conferma -->
          <label class="flex items-center gap-3 mx-6 mb-5 cursor-pointer select-none">
            <input
              v-model="confirmed"
              type="checkbox"
              class="w-4 h-4 rounded border-border accent-red-500 cursor-pointer"
            />
            <span class="text-sm text-text-muted dark:text-on-surface/60">
              {{ $t('common.irreversible_confirm') }}
            </span>
          </label>

          <!-- Footer -->
          <div class="flex justify-end gap-3 px-6 pb-6">
            <button class="btn-ghost" @click="close">{{ $t('common.cancel') }}</button>
            <button
              :disabled="!confirmed"
              class="px-4 py-2 rounded-md bg-red-500 text-white text-sm font-medium
                     hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              @click="onConfirm"
            >
              {{ confirmLabel ?? 'Elimina' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { AlertTriangle, X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  title: string
  description: string
  itemName: string
  confirmLabel?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

const confirmed = ref(false)

watch(() => props.open, (val) => {
  if (!val) confirmed.value = false
})

function close() {
  emit('update:open', false)
}

function onConfirm() {
  emit('confirm')
  close()
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(27, 73, 101, 0.4);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.dialog-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  width: 100%; max-width: 440px;
  overflow: hidden;
}

.dark .dialog-panel {
  background: var(--color-surface);
}

.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s, transform 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-panel, .dialog-leave-to .dialog-panel { transform: scale(0.95) translateY(8px); }
</style>
