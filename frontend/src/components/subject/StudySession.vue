<template>
  <!-- Overlay full-screen -->
  <div class="fixed inset-0 z-50 bg-page flex flex-col">

    <!-- ── Header ────────────────────────────────────────────────────── -->
    <div class="flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
      <button
        class="text-text-muted hover:text-primary dark:hover:text-on-surface transition-colors"
        @click="emit('close')"
      >
        <X class="w-5 h-5" />
      </button>

      <div class="flex-1">
        <div class="flex justify-between text-sm mb-1.5">
          <span class="text-text-muted dark:text-on-surface/60">{{ lessonTitle }}</span>
          <span class="font-medium text-primary dark:text-on-surface">
            {{ finished ? total : currentIndex + 1 }} / {{ total }}
          </span>
        </div>
        <div class="h-1.5 bg-accent/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: progress + '%', backgroundColor: subjectColor }"
          />
        </div>
      </div>

      <div class="flex items-center gap-1 text-sm text-text-muted dark:text-on-surface/60">
        <Clock class="w-3.5 h-3.5" />
        <span class="tabular-nums">{{ formatTime(elapsed) }}</span>
      </div>
    </div>

    <!-- ── Corpo sessione (studio) ────────────────────────────────────── -->
    <div v-if="!finished" class="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 gap-6 sm:gap-8">

      <!-- Contatori live -->
      <div class="flex gap-6 text-sm font-medium">
        <span class="text-green-600">✓ {{ knew }}</span>
        <span class="text-yellow-600">— {{ almost }}</span>
        <span class="text-red-600">✗ {{ forgot }}</span>
      </div>

      <!-- Flashcard con flip 3D -->
      <div :style="{ perspective: '1200px' }" class="w-full max-w-xl">
        <div
          class="cursor-pointer"
          :style="{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            opacity: exitDir ? 0 : 1,
            height: '280px',
            position: 'relative',
          }"
          @click="!flipped && (flipped = true)"
        >
          <!-- Fronte: domanda -->
          <div
            :style="{ backfaceVisibility: 'hidden' }"
            class="absolute inset-0 rounded-2xl border-2 border-border bg-white dark:bg-surface shadow-lg
                   flex flex-col items-center justify-center p-8 text-center overflow-y-auto"
          >
            <span
              class="text-xs font-semibold uppercase tracking-widest mb-6 px-3 py-1 rounded-full"
              :style="{ backgroundColor: subjectColor + '22', color: subjectColor }"
            >{{ $t('study.question') }}</span>
            <p class="text-xl font-medium text-primary dark:text-on-surface leading-relaxed">
              {{ current?.question }}
            </p>
            <img
              v-if="current?.questionImage"
              :src="current.questionImage"
              alt=""
              class="study-card-image mt-4"
            />
            <p class="text-text-muted dark:text-on-surface/60 text-sm mt-6">
              {{ $t('study.click_to_reveal') }}
            </p>
          </div>

          <!-- Retro: risposta -->
          <div
            :style="{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderColor: subjectColor + '88',
            }"
            class="absolute inset-0 rounded-2xl border-2 bg-white dark:bg-surface shadow-lg
                   flex flex-col items-center justify-center p-8 text-center overflow-y-auto"
          >
            <span
              class="text-xs font-semibold uppercase tracking-widest mb-6 px-3 py-1 rounded-full"
              :style="{ backgroundColor: subjectColor + '22', color: subjectColor }"
            >{{ $t('study.answer') }}</span>
            <p class="text-lg text-primary dark:text-on-surface leading-relaxed">
              {{ current?.answer }}
            </p>
            <img
              v-if="current?.answerImage"
              :src="current.answerImage"
              alt=""
              class="study-card-image mt-4"
            />
          </div>
        </div>
      </div>

      <!-- Pulsanti azione -->
      <div class="w-full max-w-xl">
        <!-- Prima del flip: mostra risposta -->
        <button
          v-if="!flipped"
          class="w-full py-3 rounded-xl text-white font-medium"
          :style="{ backgroundColor: subjectColor }"
          @click="flipped = true"
        >
          {{ $t('study.show_answer') }}
        </button>

        <!-- Dopo il flip: rating -->
        <div v-else class="flex gap-3">
          <button
            class="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-xl border-2
                   border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/30 dark:hover:bg-red-500/20 transition-colors"
            @click="advance('forgot')"
          >
            <XCircle class="w-6 h-6" />
            <span class="text-sm font-medium">{{ $t('study.forgot') }}</span>
          </button>
          <button
            class="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-xl border-2
                   border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:hover:bg-yellow-500/20 transition-colors"
            @click="advance('almost')"
          >
            <Minus class="w-6 h-6" />
            <span class="text-sm font-medium">{{ $t('study.almost') }}</span>
          </button>
          <button
            class="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-xl border-2
                   border-green-200 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:border-green-500/30 dark:hover:bg-green-500/20 transition-colors"
            @click="advance('knew')"
          >
            <CheckCircle2 class="w-6 h-6" />
            <span class="text-sm font-medium">{{ $t('study.knew') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Riepilogo ──────────────────────────────────────────────────── -->
    <div v-else class="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 overflow-y-auto">
      <div class="w-full max-w-md space-y-8">

        <!-- Score ring -->
        <div class="text-center">
          <div
            class="w-32 h-32 rounded-full mx-auto flex flex-col items-center justify-center border-4 mb-4"
            :style="{ borderColor: subjectColor }"
          >
            <span class="text-4xl font-bold text-primary dark:text-on-surface">{{ scorePercent }}%</span>
            <span class="text-xs text-text-muted dark:text-on-surface/60">{{ $t('study.correct') }}</span>
          </div>
          <h2 class="text-2xl font-semibold text-primary dark:text-on-surface mb-1">
            <template v-if="scorePercent >= 80">{{ $t('study.result_great') }}</template>
            <template v-else-if="scorePercent >= 50">{{ $t('study.result_good') }}</template>
            <template v-else>{{ $t('study.result_keep_going') }}</template>
          </h2>
          <p class="text-sm text-text-muted dark:text-on-surface/60">
            {{ total }} {{ $t('study.cards_studied') }} · {{ formatTime(elapsed) }}
          </p>
        </div>

        <!-- 3 stat card -->
        <div class="grid grid-cols-3 gap-2 sm:gap-4">
          <div class="rounded-xl border border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/30 p-4 text-center">
            <CheckCircle2 class="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p class="text-2xl font-bold text-green-700 dark:text-green-400">{{ knew }}</p>
            <p class="text-xs text-green-600 dark:text-green-400">{{ $t('study.knew_short') }}</p>
          </div>
          <div class="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/30 p-4 text-center">
            <Minus class="w-6 h-6 text-yellow-600 mx-auto mb-1" />
            <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{{ almost }}</p>
            <p class="text-xs text-yellow-600 dark:text-yellow-400">{{ $t('study.almost_short') }}</p>
          </div>
          <div class="rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 p-4 text-center">
            <XCircle class="w-6 h-6 text-red-600 mx-auto mb-1" />
            <p class="text-2xl font-bold text-red-700 dark:text-red-400">{{ forgot }}</p>
            <p class="text-xs text-red-600 dark:text-red-400">{{ $t('study.forgot_short') }}</p>
          </div>
        </div>

        <!-- Barre progresso per categoria -->
        <div class="space-y-3">
          <div
            v-for="item in summaryBars"
            :key="item.label"
            class="flex items-center gap-3"
          >
            <span class="text-sm text-text-muted dark:text-on-surface/60 w-24">{{ item.label }}</span>
            <div class="flex-1 h-2 rounded-full bg-accent/10 dark:bg-white/10 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="{ width: total > 0 ? (item.count / total * 100) + '%' : '0%', backgroundColor: item.color }"
              />
            </div>
            <span class="text-sm font-medium w-6 text-right text-primary dark:text-on-surface">
              {{ item.count }}
            </span>
          </div>
        </div>

        <!-- Azioni -->
        <div class="flex gap-3">
          <button
            class="flex-1 border border-border rounded-xl py-3 flex items-center justify-center gap-2
                   text-primary dark:text-on-surface hover:bg-accent/5 transition-colors"
            @click="restart"
          >
            <RotateCcw class="w-4 h-4" />
            {{ $t('study.repeat') }}
          </button>
          <button
            class="flex-1 text-white rounded-xl py-3 flex items-center justify-center gap-2"
            :style="{ backgroundColor: subjectColor }"
            @click="emit('close')"
          >
            {{ $t('study.back_to_lesson') }}
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X, Clock, CheckCircle2, XCircle, Minus, RotateCcw, ChevronRight } from 'lucide-vue-next'
import { useTranslation } from 'i18next-vue'
import type { StudyFlashcard } from '@/data/subjects'

const { t } = useTranslation()

type Rating = 'knew' | 'almost' | 'forgot'
interface SessionResult { cardId: string; rating: Rating }

const props = defineProps<{
  flashcards: StudyFlashcard[]
  lessonTitle: string
  subjectColor: string
}>()

const emit = defineEmits<{
  close: []
  complete: [results: SessionResult[], duration: number]
}>()

const queue = ref<StudyFlashcard[]>([...props.flashcards].sort(() => Math.random() - 0.5))
const currentIndex = ref(0)
const flipped = ref(false)
const results = ref<SessionResult[]>([])
const finished = ref(false)
const elapsed = ref(0)
const exitDir = ref<'left' | 'right' | null>(null)

const total = computed(() => queue.value.length)
const current = computed(() => queue.value[currentIndex.value])
const progress = computed(() =>
  finished.value || total.value === 0 ? 100 : (currentIndex.value / total.value) * 100,
)
const knew = computed(() => results.value.filter(r => r.rating === 'knew').length)
const almost = computed(() => results.value.filter(r => r.rating === 'almost').length)
const forgot = computed(() => results.value.filter(r => r.rating === 'forgot').length)
const scorePercent = computed(() =>
  total.value > 0 ? Math.round((knew.value / total.value) * 100) : 0,
)

const summaryBars = computed(() => [
  { label: t('study.knew_short'),   count: knew.value,   color: '#10B981' },
  { label: t('study.almost_short'), count: almost.value, color: '#F59E0B' },
  { label: t('study.forgot_short'), count: forgot.value, color: '#EF4444' },
])

let timerId: ReturnType<typeof setInterval> | null = null

function stopTimer(): void {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

onMounted(() => {
  timerId = setInterval(() => elapsed.value++, 1000)
})
onUnmounted(stopTimer)

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function advance(rating: Rating) {
  if (!current.value) return
  results.value.push({ cardId: current.value.id, rating })
  exitDir.value = rating === 'forgot' ? 'left' : 'right'
  setTimeout(() => {
    exitDir.value = null
    flipped.value = false
    if (currentIndex.value + 1 >= total.value) {
      finished.value = true
      stopTimer()
      emit('complete', results.value, elapsed.value)
    } else {
      currentIndex.value++
    }
  }, 320)
}

// Le immagini vengono mostrate ridimensionate — il container della card
// gestisce già l'overflow con overflow-y-auto se il contenuto supera l'altezza.

function restart() {
  queue.value = [...props.flashcards].sort(() => Math.random() - 0.5)
  currentIndex.value = 0
  flipped.value = false
  results.value = []
  finished.value = false
  elapsed.value = 0
  exitDir.value = null
  stopTimer()
  timerId = setInterval(() => elapsed.value++, 1000)
}
</script>

<style scoped>
.study-card-image {
  max-height: 200px;
  max-width: 100%;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
}
</style>
