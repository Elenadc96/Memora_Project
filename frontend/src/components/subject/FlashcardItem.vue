<!--
  FlashcardItem — riga singola di una flashcard nella lista di una lezione.
  Mostra domanda, risposta (click per rivelare) e indicatore di difficoltà.
  Riusabile anche nelle sessioni di studio future.
-->
<template>
  <div class="flashcard-item" :class="{ 'flashcard-item--revealed': revealed }">
    <!-- Difficoltà -->
    <span class="difficulty-badge" :class="difficultyClass">
      {{ difficultyLabel }}
    </span>

    <!-- Domanda -->
    <div class="flashcard-question">
      {{ flashcard.question }}
    </div>

    <!-- Risposta (nascosta finché non si clicca) -->
    <div class="flashcard-answer" @click="revealed = !revealed">
      <span v-if="revealed">{{ flashcard.answer }}</span>
      <span v-else class="flashcard-answer--hidden">{{ $t('subject.tap_to_reveal') }}</span>
    </div>

    <!-- Azioni -->
    <button
      class="flashcard-delete"
      :aria-label="$t('common.delete')"
      @click.stop="$emit('delete', flashcard.id)"
    >
      <Trash2 class="w-4 h-4" />
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import type { Flashcard } from '@/types'

interface DifficultyInfo {
  label: string
  cls: string
}

const DIFFICULTY: Record<number, DifficultyInfo> = {
  0: { label: 'Facile',    cls: 'diff--easy'   },
  1: { label: 'Facile',    cls: 'diff--easy'   },
  2: { label: 'Medio',     cls: 'diff--medium' },
  3: { label: 'Medio',     cls: 'diff--medium' },
  4: { label: 'Difficile', cls: 'diff--hard'   },
  5: { label: 'Difficile', cls: 'diff--hard'   },
}

export default defineComponent({
  name: 'FlashcardItem',
  components: { Trash2 },

  props: {
    flashcard: {
      type: Object as PropType<Flashcard>,
      required: true,
    },
  },

  emits: ['delete'],

  data() {
    return {
      revealed: false,
    }
  },

  computed: {
    difficultyLabel(): string {
      return DIFFICULTY[this.flashcard.difficult]?.label ?? 'Facile'
    },
    difficultyClass(): string {
      return DIFFICULTY[this.flashcard.difficult]?.cls ?? 'diff--easy'
    },
  },
})
</script>

<style scoped>
.flashcard-item {
  display: grid;
  grid-template-columns: 72px 1fr 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(var(--color-accent-rgb), 0.04);
  border: 1px solid var(--color-accent-30);
  transition: background 0.15s;
}
.flashcard-item:hover { background: rgba(var(--color-accent-rgb), 0.08); }

.difficulty-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 2px 8px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.diff--easy   { background: #d1fae5; color: #065f46; }
.diff--medium { background: #fef3c7; color: #92400e; }
.diff--hard   { background: #fee2e2; color: #991b1b; }

.flashcard-question {
  font-size: 13px; color: var(--color-primary);
}
.dark .flashcard-question { color: var(--color-on-surface); }

.flashcard-answer {
  font-size: 13px; cursor: pointer;
  color: var(--color-primary); opacity: 0.75;
  transition: opacity 0.15s;
}
.flashcard-answer:hover { opacity: 1; }

.flashcard-answer--hidden {
  font-style: italic; font-size: 12px;
  color: var(--color-accent);
}

.flashcard-delete {
  opacity: 0; transition: opacity 0.15s;
  color: #ef4444; padding: 4px; border-radius: 6px;
}
.flashcard-item:hover .flashcard-delete { opacity: 1; }
.flashcard-delete:hover { background: #fee2e2; }
</style>
