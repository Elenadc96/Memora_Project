<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="open" class="dialog-overlay" @click.self="close">
        <div class="dialog-panel">

          <!-- Accent bar -->
          <div class="h-1.5 w-full flex-shrink-0" :style="accentStyle" />

          <!-- Header -->
          <div class="px-6 pt-5 pb-4 flex items-start justify-between flex-shrink-0">
            <div>
              <h2 class="text-lg font-semibold text-primary dark:text-on-surface">Crea nuova materia</h2>
              <p class="text-sm text-text-muted dark:text-on-surface/60 mt-0.5">Organizza i tuoi contenuti di studio</p>
            </div>
            <button class="close-btn" @click="close">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Body (scrollabile) -->
          <div class="px-6 pb-4 space-y-4 overflow-y-auto flex-1">

            <!-- Live preview -->
            <div class="preview-card">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                :style="iconStyle"
              >
                {{ selectedEmoji }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm truncate text-primary dark:text-on-surface">{{ previewName }}</span>
                  <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: selectedColor.hex }" />
                </div>
                <p v-if="description" class="text-xs text-text-muted dark:text-on-surface/60 truncate mt-0.5">{{ description }}</p>
              </div>
              <span class="text-xs bg-accent/10 dark:bg-white/10 px-2 py-0.5 rounded-full flex-shrink-0 text-text-muted dark:text-on-surface/60">
                0 carte
              </span>
            </div>

            <!-- Nome -->
            <div>
              <label class="field-label">Nome materia <span class="text-red-500">*</span></label>
              <input
                v-model="name"
                class="input-field mt-1.5"
                placeholder="Es. Matematica, Fisica..."
                autofocus
                @keydown.enter="handleCreate"
              />
              <p v-if="nameError" class="text-xs text-red-500 mt-1">{{ nameError }}</p>
            </div>

            <!-- Descrizione -->
            <div>
              <label class="field-label">
                Descrizione
                <span class="font-normal text-text-muted dark:text-on-surface/50">(opzionale)</span>
              </label>
              <textarea
                v-model="description"
                class="input-field mt-1.5"
                placeholder="Aggiungi una breve descrizione..."
                rows="2"
                style="resize: none"
              />
            </div>

            <!-- Colore -->
            <div>
              <label class="field-label">Colore</label>
              <div class="flex flex-wrap gap-2 mt-1.5">
                <button
                  v-for="color in COLOR_OPTIONS"
                  :key="color.hex"
                  class="color-swatch"
                  :class="selectedColor.hex === color.hex ? 'scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'"
                  :style="{
                    backgroundColor: color.hex,
                    outline: selectedColor.hex === color.hex ? `2px solid ${color.hex}` : 'none',
                    outlineOffset: '2px',
                  }"
                  :title="color.label"
                  @click="selectedColor = color"
                >
                  <Check v-if="selectedColor.hex === color.hex" class="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <!-- Emoji -->
            <div>
              <label class="field-label">Icona</label>
              <div class="grid grid-cols-12 gap-1 mt-1.5">
                <button
                  v-for="emoji in EMOJI_OPTIONS"
                  :key="emoji"
                  class="w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all duration-100"
                  :class="selectedEmoji !== emoji ? 'hover:bg-accent/10' : ''"
                  :style="selectedEmoji === emoji ? emojiActiveStyle(selectedColor.hex) : {}"
                  @click="selectedEmoji = emoji"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="border-t border-border px-6 py-4 flex justify-end gap-2 bg-accent/5 flex-shrink-0">
            <button class="btn-outline" @click="close">Annulla</button>
            <button
              class="btn-primary"
              :style="{ backgroundColor: selectedColor.hex, borderColor: selectedColor.hex }"
              :disabled="!name.trim()"
              @click="handleCreate"
            >
              Crea materia
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Check } from 'lucide-vue-next'

defineProps<{ open: boolean }>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'subject-created': [payload: { name: string; description: string; color: string; emoji: string }]
}>()

const COLOR_OPTIONS = [
  { label: 'Blu',     hex: '#2563EB' },
  { label: 'Ciano',   hex: '#06B6D4' },
  { label: 'Verde',   hex: '#10B981' },
  { label: 'Ambra',   hex: '#F59E0B' },
  { label: 'Viola',   hex: '#8B5CF6' },
  { label: 'Rosa',    hex: '#EC4899' },
  { label: 'Arancio', hex: '#F97316' },
  { label: 'Rosso',   hex: '#EF4444' },
]

const EMOJI_OPTIONS = [
  '📐','🔬','📚','🌍','🧬','⚗️','🏛️','🎭','🎨','💻','🧮','📝',
  '🎵','🗺️','🔭','🧲','📖','✏️','🧪','🏺','🌱','🎯','💡','🔢',
]

const name          = ref('')
const description   = ref('')
const selectedColor = ref(COLOR_OPTIONS[0])
const selectedEmoji = ref('📚')
const nameError     = ref('')

const previewName = computed(() => name.value.trim() || 'Nome materia')

const accentStyle = computed(() => ({
  background: `linear-gradient(90deg, ${selectedColor.value.hex}, ${selectedColor.value.hex}88)`,
}))

const iconStyle = computed(() => ({
  backgroundColor: selectedColor.value.hex + '22',
  border: `2px solid ${selectedColor.value.hex}44`,
}))

function emojiActiveStyle(hex: string) {
  return { backgroundColor: hex + '22', outline: `2px solid ${hex}`, outlineOffset: '0px' }
}

function close() {
  nameError.value = ''
  emit('update:open', false)
}

function handleCreate() {
  if (!name.value.trim()) {
    nameError.value = 'Il nome della materia è obbligatorio'
    return
  }
  nameError.value = ''

  emit('subject-created', {
    name:        name.value.trim(),
    description: description.value.trim(),
    color:       selectedColor.value.hex,
    emoji:       selectedEmoji.value,
  })

  emit('update:open', false)

  name.value          = ''
  description.value   = ''
  selectedColor.value = COLOR_OPTIONS[0]
  selectedEmoji.value = '📚'
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.dialog-panel {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%; max-width: 560px;
  max-height: 90vh;
  display: flex; flex-direction: column;
  overflow: hidden;
}

.dark .dialog-panel { background: var(--color-surface); }

.preview-card {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-accent-30);
  background: var(--color-accent-10);
}

.field-label {
  display: block;
  font-size: 0.8125rem; font-weight: 500;
  color: var(--color-primary);
}

.dark .field-label { color: var(--color-on-surface); }

.close-btn {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: 0.5rem;
  color: var(--color-primary); opacity: 0.5;
  flex-shrink: 0;
  transition: opacity 0.15s, background 0.15s;
}
.close-btn:hover { opacity: 1; background: var(--color-accent-10); }
.dark .close-btn { color: var(--color-on-surface); }

.color-swatch {
  width: 2rem; height: 2rem; border-radius: 9999px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}

/* Transizione apertura/chiusura */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s;
}
.dialog-fade-enter-active .dialog-panel,
.dialog-fade-leave-active .dialog-panel {
  transition: transform 0.2s, opacity 0.2s;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
.dialog-fade-enter-from .dialog-panel,
.dialog-fade-leave-to .dialog-panel {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
