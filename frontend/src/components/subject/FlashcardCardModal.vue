<template>
  <Teleport to="body">
    <Transition name="fc-modal">
      <div
        v-if="card"
        class="fixed inset-0 z-50 flex items-center justify-center p-6"
        style="background: rgba(27, 73, 101, 0.5); backdrop-filter: blur(4px)"
        @click.self="emit('close')"
      >
        <div class="relative w-full max-w-md">
          <!-- Chiudi -->
          <button
            class="absolute -top-10 right-0 flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
            Chiudi
          </button>

          <!-- Flip card -->
          <div class="flip-container cursor-pointer select-none" @click="flipped = !flipped">
            <div class="flip-inner" :class="{ flipped }">

              <!-- Fronte: domanda -->
              <div class="flip-face flip-front rounded-2xl border border-border shadow-xl bg-white dark:bg-surface">
                <div class="face-content">
                  <span class="face-label">Domanda</span>
                  <p class="face-text">{{ card.question }}</p>
                  <p class="face-hint">Tocca per girare</p>
                </div>
              </div>

              <!-- Retro: risposta -->
              <div class="flip-face flip-back rounded-2xl border border-border shadow-xl bg-accent/5 dark:bg-white/5">
                <div class="face-content">
                  <span class="face-label">Risposta</span>
                  <p class="face-text">{{ card.answer }}</p>
                  <p class="face-hint">Tocca per tornare</p>
                </div>
              </div>

            </div>
          </div>

          <!-- Badge stato e difficoltà -->
          <div class="flex items-center justify-center gap-2 mt-4">
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" :class="statusClass(card.status)">
              {{ statusLabel(card.status) }}
            </span>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" :class="diffClass(card.difficulty)">
              {{ card.difficulty }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { StudyFlashcard, CardStatus, DifficultyLevel } from '@/data/subjects'

const props = defineProps<{
  card: StudyFlashcard | null
}>()

const emit = defineEmits<{
  close: []
}>()

const flipped = ref(false)

watch(() => props.card, () => { flipped.value = false })

function statusLabel(status: CardStatus): string {
  const map: Record<CardStatus, string> = {
    mastered: 'Padroneggiata',
    learning: 'In studio',
    review:   'Da ripassare',
  }
  return map[status]
}

function statusClass(status: CardStatus): string {
  const map: Record<CardStatus, string> = {
    mastered: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    learning: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    review:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  }
  return map[status]
}

function diffClass(difficulty: DifficultyLevel): string {
  const map: Record<DifficultyLevel, string> = {
    Facile:   'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    Media:    'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400',
    Difficile:'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  }
  return map[difficulty]
}
</script>

<style scoped>
.flip-container {
  perspective: 1200px;
}

/*
 * Grid trick: entrambe le facce occupano la stessa cella (1/1).
 * Il browser calcola l'altezza della cella come max(altezza fronte, altezza retro),
 * quindi la card si adatta automaticamente al contenuto più lungo senza JS.
 */
.flip-inner {
  display: grid;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.flip-inner.flipped {
  transform: rotateY(180deg);
}

.flip-face {
  grid-area: 1 / 1;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* Rende la faccia un flex container così face-content può espandersi */
  display: flex;
  flex-direction: column;
  /* Limite per risposte lunghissime: la card non supera 65vh e scorre */
  max-height: 65vh;
  overflow-y: auto;
}

.flip-back {
  transform: rotateY(180deg);
}

/* Layout interno di ogni faccia */
.face-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  min-height: 200px;
  /* flex: 1 espande face-content fino all'altezza della faccia
     → justify-content: center centra il testo nell'intera card */
  flex: 1;
}

.face-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted, #9ca3af);
  margin-bottom: 1.25rem;
  flex-shrink: 0;
}

.face-text {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.55;
  color: var(--color-primary);
  word-break: break-word;
}

.face-hint {
  font-size: 0.72rem;
  color: var(--color-text-muted, #9ca3af);
  opacity: 0.6;
  margin-top: 1.5rem;
  flex-shrink: 0;
}

/* dark mode */
.dark .face-text  { color: var(--color-on-surface); }
.dark .face-label,
.dark .face-hint  { color: color-mix(in srgb, var(--color-on-surface) 50%, transparent); }

/* Transizione apertura overlay */
.fc-modal-enter-active,
.fc-modal-leave-active {
  transition: opacity 0.2s;
}
.fc-modal-enter-from,
.fc-modal-leave-to {
  opacity: 0;
}
</style>
