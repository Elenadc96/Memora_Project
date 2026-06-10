<!--
  ConfirmDialog — modale di conferma riusabile in tutta l'app.

  Uso:
    <ConfirmDialog
      v-model="showConfirm"
      title="Elimina lezione"
      message="Vuoi davvero eliminare questa lezione e tutte le sue flashcard?"
      :danger="true"
      @confirm="doDelete"
    />

  Props:
    - modelValue (Boolean)  — v-model per aprire/chiudere
    - title     (String)    — titolo della modale
    - message   (String)    — testo del messaggio
    - danger    (Boolean)   — se true, il bottone conferma è rosso
    - confirmLabel (String) — testo del bottone conferma (default: $t('common.confirm'))
    - cancelLabel  (String) — testo del bottone annulla  (default: $t('common.cancel'))

  Emits: confirm, cancel
-->
<template>
  <BaseDialog v-model="isOpen" :title="title">
    <div class="space-y-5">

      <!-- Icona + messaggio -->
      <div class="flex gap-4">
        <div class="flex-shrink-0 mt-0.5">
          <div class="w-10 h-10 rounded-full flex items-center justify-center"
               :class="danger ? 'bg-red-100' : 'bg-amber-100'">
            <AlertTriangle class="w-5 h-5" :class="danger ? 'text-red-600' : 'text-amber-600'" />
          </div>
        </div>
        <p class="text-sm text-primary dark:text-on-surface leading-relaxed">
          {{ message }}
        </p>
      </div>

      <!-- Azioni -->
      <div class="flex justify-end gap-3">
        <button class="btn-ghost" @click="onCancel">
          {{ cancelLabel || $t('common.cancel') }}
        </button>
        <button
          class="btn-confirm"
          :class="danger ? 'btn-confirm--danger' : 'btn-confirm--warning'"
          @click="onConfirm"
        >
          {{ confirmLabel || $t('common.confirm') }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import BaseDialog from './BaseDialog.vue'

export default defineComponent({
  name: 'ConfirmDialog',
  components: { AlertTriangle, BaseDialog },

  props: {
    modelValue:   { type: Boolean, required: true },
    title:        { type: String,  required: true },
    message:      { type: String,  required: true },
    danger:       { type: Boolean, default: false },
    confirmLabel: { type: String,  default: null  },
    cancelLabel:  { type: String,  default: null  },
  },

  emits: ['update:modelValue', 'confirm', 'cancel'],

  computed: {
    isOpen: {
      get(): boolean { return this.modelValue },
      set(v: boolean): void { this.$emit('update:modelValue', v) },
    },
  },

  methods: {
    onConfirm(): void {
      this.$emit('confirm')
      this.isOpen = false
    },
    onCancel(): void {
      this.$emit('cancel')
      this.isOpen = false
    },
  },
})
</script>

<style scoped>
.btn-confirm {
  font-weight: 500;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  transition: background 0.15s, opacity 0.15s;
}
.btn-confirm--danger   { background: #ef4444; color: white; }
.btn-confirm--danger:hover   { background: #dc2626; }
.btn-confirm--warning  { background: #f59e0b; color: white; }
.btn-confirm--warning:hover  { background: #d97706; }
</style>
