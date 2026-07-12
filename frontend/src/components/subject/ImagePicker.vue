<!--
  ImagePicker — controllo riusabile per selezionare un'immagine opzionale.
  Usato da CreateFlashcardDialog e EditFlashcardDialog.

  Stati mostrati (in ordine di priorità):
    1. Anteprima del nuovo File selezionato   (v-model: File)
    2. Anteprima dell'immagine già sul server (prop existing-url)
    3. Pulsante "Aggiungi immagine"           (nessuna immagine)

  Emette 'error' con un messaggio traducibile se il file supera 5MB o non è
  un tipo valido; emette 'remove-existing' quando l'utente rimuove
  un'immagine caricata in precedenza (usato solo in EditFlashcardDialog).
-->
<template>
  <div class="space-y-1.5">
    <p v-if="label" class="text-xs text-text-muted dark:text-on-surface/60">{{ label }}</p>

    <!-- Preview: nuovo file selezionato -->
    <div v-if="previewUrl" class="image-picker-preview">
      <img :src="previewUrl" alt="anteprima" class="preview-img" />
      <button type="button" class="preview-remove" @click="clearNewFile" :aria-label="t('subject.image_picker.remove')">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Preview: immagine esistente sul server -->
    <div v-else-if="existingUrl" class="image-picker-preview">
      <img :src="existingUrl" alt="immagine attuale" class="preview-img" />
      <button type="button" class="preview-remove" @click="$emit('remove-existing')" :aria-label="t('subject.image_picker.remove')">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Pulsante di upload -->
    <label v-else class="image-picker-button">
      <ImageIcon class="w-4 h-4" />
      <span>{{ t('subject.image_picker.add') }}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileChange"
      />
    </label>

    <p class="text-[11px] text-text-muted dark:text-on-surface/50">
      {{ t('subject.image_picker.format_hint', { max: MAX_IMAGE_MB }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useTranslation } from 'i18next-vue'
import { X, Image as ImageIcon } from 'lucide-vue-next'

const { t } = useTranslation()

const props = defineProps<{
  modelValue: File | null
  existingUrl?: string | null
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
  'remove-existing': []
  'error': [message: string]
}>()

// Dimensione massima per ogni immagine. Deve corrispondere a MAX_IMAGE_MB in backend/middleware/upload.js
const MAX_IMAGE_MB = 5
const MAX_SIZE = MAX_IMAGE_MB * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// URL object generato dal File per la preview. Viene revocato quando il file
// cambia o il componente si smonta, per non tenere il Blob in memoria.
const objectUrl = ref<string | null>(null)

const previewUrl = computed(() => objectUrl.value)

watch(() => props.modelValue, (file) => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
  }
  if (file) {
    objectUrl.value = URL.createObjectURL(file)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
})

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = '' // reset così onchange scatta di nuovo anche per lo stesso file

  if (!file) return
  if (!ALLOWED_TYPES.includes(file.type)) {
    emit('error', t('subject.image_picker.error_type'))
    return
  }
  if (file.size > MAX_SIZE) {
    emit('error', t('subject.image_picker.error_size', { max: MAX_IMAGE_MB }))
    return
  }
  emit('update:modelValue', file)
}

function clearNewFile() {
  emit('update:modelValue', null)
}
</script>

<style scoped>
.image-picker-preview {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border, #e5e7eb);
  background: rgba(0, 0, 0, 0.03);
}
.preview-img {
  display: block;
  max-height: 120px;
  max-width: 100%;
  object-fit: contain;
}
.preview-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  transition: background 0.15s;
}
.preview-remove:hover {
  background: rgba(220, 38, 38, 0.9);
}

.image-picker-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px dashed var(--color-accent-30, #d1d5db);
  background: rgba(var(--color-accent-rgb, 59, 130, 246), 0.04);
  font-size: 13px;
  color: var(--color-primary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.image-picker-button:hover {
  background: rgba(var(--color-accent-rgb, 59, 130, 246), 0.1);
  border-color: var(--color-accent);
}
.dark .image-picker-button {
  color: var(--color-on-surface);
}
</style>
