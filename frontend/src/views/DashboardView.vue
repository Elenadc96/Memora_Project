<template>
  <main class="flex-1 overflow-y-auto p-4 md:p-8">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-primary dark:text-on-surface">{{ $t('dashboard.title') }}</h1>
      <p class="text-text-muted text-sm mt-1">{{ $t('dashboard.subtitle') }}</p>
    </header>

    <!-- Loading spinner -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="card rounded-2xl p-5"
        >
          <div class="flex items-start justify-between">
            <p class="text-sm text-text-muted">{{ card.label }}</p>
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :class="card.iconBg"
            >
              <component :is="card.icon" class="w-5 h-5" :class="card.iconColor" />
            </div>
          </div>
          <p class="text-3xl font-bold text-primary dark:text-on-surface my-3">{{ card.value }}</p>
          <p class="text-xs text-text-muted">{{ card.trend }}</p>
        </div>
      </div>

      <!-- Grafico + Progresso affiancati -->
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Card grafico attività settimanale -->
        <div class="card flex-1 rounded-2xl p-6">
          <h2 class="text-base font-semibold text-primary dark:text-on-surface mb-4">{{ $t('chart.title') }}</h2>

          <div style="height: 220px">
            <LineChart :data="chartData" :options="chartOptions" />
          </div>

          <!-- Legenda custom -->
          <div class="flex gap-8 mt-4 justify-center">
            <span class="flex items-center gap-2 text-xs text-text-muted">
              <span class="w-5 h-0.5 inline-block rounded-full" :style="{ backgroundColor: lineColors.studied }" />
              {{ $t('chart.studied') }}
            </span>
            <span class="flex items-center gap-2 text-xs text-text-muted">
              <span class="w-5 h-0.5 inline-block rounded-full" :style="{ backgroundColor: lineColors.correct }" />
              {{ $t('chart.correct') }}
            </span>
          </div>
        </div>

        <!-- Card progresso per materia -->
        <div class="card w-full lg:w-72 flex-shrink-0 rounded-2xl p-6 h-fit">
          <h2 class="text-base font-semibold text-primary dark:text-on-surface mb-5">{{ $t('progress.title') }}</h2>

          <p v-if="subjectProgress.length === 0" class="text-sm text-text-muted">
            {{ $t('progress.empty') }}
          </p>

          <div
            v-for="s in subjectProgress"
            :key="s.name"
            class="mb-4 last:mb-0"
          >
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-primary dark:text-on-surface font-medium">{{ s.emoji }} {{ s.name }}</span>
              <span class="text-text-muted">{{ s.pct }}%</span>
            </div>
            <div class="h-2 rounded-full bg-accent/10 dark:bg-white/10 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="{ width: s.pct + '%', backgroundColor: s.color }"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Line as LineChart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js'
import { BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-vue-next'
import { useTranslation } from 'i18next-vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useFlashcardStore } from '@/stores/flashcards'
import { useUIStore } from '@/stores/ui'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

const { t } = useTranslation()
const dashboardStore = useDashboardStore()
const flashcardStore = useFlashcardStore()
const uiStore = useUIStore()

const loading = computed(() => dashboardStore.loading || flashcardStore.loading)

onMounted(async () => {
  await Promise.all([
    dashboardStore.fetchDashboard(),
    flashcardStore.subjects.length === 0 ? flashcardStore.fetchSubjects() : Promise.resolve(),
  ])
})

function formatStudyTime(seconds: number): string {
  if (seconds === 0) return '0m'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const d = computed(() => dashboardStore.data)

const statCards = computed(() => {
  const data = d.value
  const subjectCount = flashcardStore.subjects.length
  return [
    {
      label: t('stats.total_cards'),
      value: data ? data.totalFlashcards.toString() : '–',
      trend: subjectCount > 0
        ? t('dashboard.subjects_count', { count: subjectCount })
        : t('dashboard.no_subjects'),
      icon: BookOpen,
      iconBg: 'bg-blue-500/10 dark:bg-blue-400/15',
      iconColor: 'text-blue-500 dark:text-blue-300',
    },
    {
      label: t('stats.studied_today'),
      value: data ? data.studiedToday.toString() : '–',
      trend: data?.streak
        ? t('dashboard.streak_trend', { count: data.streak })
        : t('dashboard.start_studying'),
      icon: CheckCircle,
      iconBg: 'bg-teal-500/10 dark:bg-teal-400/15',
      iconColor: 'text-teal-500 dark:text-teal-300',
    },
    {
      label: t('stats.study_time'),
      value: data ? formatStudyTime(data.studyTimeSeconds) : '–',
      trend: t('dashboard.study_time_trend'),
      icon: Clock,
      iconBg: 'bg-yellow-500/10 dark:bg-yellow-400/15',
      iconColor: 'text-yellow-500 dark:text-yellow-300',
    },
    {
      label: t('stats.success_rate'),
      value: data?.successRate30d != null ? `${data.successRate30d}%` : '–',
      trend: data?.successRateAll != null
        ? t('dashboard.historical_rate', { pct: data.successRateAll })
        : t('dashboard.no_historical_data'),
      icon: TrendingUp,
      iconBg: 'bg-purple-500/10 dark:bg-purple-400/15',
      iconColor: 'text-purple-500 dark:text-purple-300',
    },
  ]
})

const subjectProgress = computed(() =>
  flashcardStore.subjects
    .filter(s => s.cardCount > 0)
    .map(s => ({
      name: s.subjectName,
      emoji: s.emoji,
      color: s.color,
      pct: Math.round(((s.masteredCount ?? 0) / s.cardCount) * 100),
    }))
    .sort((a, b) => b.pct - a.pct),
)

// Il colore "Flashcard Studiate" deve restare leggibile sulla card, che in
// dark mode diventa quasi lo stesso blu del tratto originale (#1B3A5C) —
// per questo cambia con il tema. "Risposte Corrette" (teal) resta invece
// leggibile su entrambi i fondi e non ha bisogno di una variante.
const lineColors = computed(() => ({
  studied: uiStore.isDark ? '#CAE9FF' : '#1B4965',
  correct: '#1ABFBF',
}))

const chartData = computed(() => {
  const activity = d.value?.weeklyActivity ?? []
  return {
    labels: activity.map(a => a.day),
    datasets: [
      {
        label: t('chart.studied'),
        data: activity.map(a => a.studied),
        borderColor: lineColors.value.studied,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: lineColors.value.studied,
        pointRadius: 4,
        tension: 0.4,
      },
      {
        label: t('chart.correct'),
        data: activity.map(a => a.correct),
        borderColor: lineColors.value.correct,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: lineColors.value.correct,
        pointRadius: 4,
        tension: 0.4,
      },
    ],
  }
})

// Chart.js disegna su <canvas>: le classi dark: di Tailwind non hanno alcun
// effetto qui, va scelto il colore giusto a mano in base al tema corrente.
const chartOptions = computed(() => {
  const tickColor = uiStore.isDark ? '#8aa0a3' : '#9CA3AF'
  const gridColor = uiStore.isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6'
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 12 } },
      },
      y: {
        min: 0,
        ticks: { stepSize: 20, color: tickColor, font: { size: 12 } },
        grid: { color: gridColor },
      },
    },
  }
})
</script>
