<template>
  <main class="flex-1 overflow-y-auto bg-[#E8F5F5] p-8">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-800">Panoramica Generale</h1>
      <p class="text-gray-500 text-sm mt-1">Le tue statistiche di studio delle flashcard</p>
    </header>

    <!-- Loading spinner -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="w-8 h-8 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div class="flex items-start justify-between">
            <p class="text-sm text-gray-500">{{ card.label }}</p>
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :class="card.iconBg"
            >
              <component :is="card.icon" class="w-5 h-5" :class="card.iconColor" />
            </div>
          </div>
          <p class="text-3xl font-bold text-gray-800 my-3">{{ card.value }}</p>
          <p class="text-xs text-gray-400">{{ card.trend }}</p>
        </div>
      </div>

      <!-- Grafico + Progresso affiancati -->
      <div class="flex gap-6">
        <!-- Card grafico attività settimanale -->
        <div class="flex-1 bg-white rounded-2xl p-6 shadow-sm">
          <h2 class="text-base font-semibold text-gray-800 mb-4">Attività di Studio Settimanale</h2>

          <div style="height: 220px">
            <LineChart :data="chartData" :options="chartOptions" />
          </div>

          <!-- Legenda custom -->
          <div class="flex gap-8 mt-4 justify-center">
            <span class="flex items-center gap-2 text-xs text-gray-500">
              <span class="w-5 h-0.5 bg-[#1B3A5C] inline-block rounded-full" />
              Flashcard Studiate
            </span>
            <span class="flex items-center gap-2 text-xs text-[#1ABFBF]">
              <span class="w-5 h-0.5 bg-[#1ABFBF] inline-block rounded-full" />
              Risposte Corrette
            </span>
          </div>
        </div>

        <!-- Card progresso per materia -->
        <div class="w-72 flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm h-fit">
          <h2 class="text-base font-semibold text-gray-800 mb-5">Progresso per Materia</h2>

          <p v-if="subjectProgress.length === 0" class="text-sm text-gray-400">
            Nessuna materia disponibile
          </p>

          <div
            v-for="s in subjectProgress"
            :key="s.name"
            class="mb-4 last:mb-0"
          >
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-gray-700 font-medium">{{ s.emoji }} {{ s.name }}</span>
              <span class="text-gray-500">{{ s.pct }}%</span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
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
import { useDashboardStore } from '@/stores/dashboard'
import { useFlashcardStore } from '@/stores/flashcards'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

const dashboardStore = useDashboardStore()
const flashcardStore = useFlashcardStore()

const loading = computed(() => dashboardStore.loading || flashcardStore.loading)

onMounted(async () => {
  await Promise.all([
    dashboardStore.fetchDashboard(),
    flashcardStore.subjects.length === 0 ? flashcardStore.fetchSubjects() : Promise.resolve(),
  ])
})

function formatStudyTime(minutes: number): string {
  if (minutes === 0) return '0m'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const d = computed(() => dashboardStore.data)

const statCards = computed(() => {
  const data = d.value
  return [
    {
      label: 'Flashcard Totali',
      value: data ? data.totalFlashcards.toString() : '–',
      trend: flashcardStore.subjects.length > 0
        ? `${flashcardStore.subjects.length} materi${flashcardStore.subjects.length === 1 ? 'a' : 'e'}`
        : 'Nessuna materia',
      icon: BookOpen,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Studiate Oggi',
      value: data ? data.studiedToday.toString() : '–',
      trend: data?.streak
        ? `Streak: ${data.streak} giorn${data.streak === 1 ? 'o' : 'i'} consecutiv${data.streak === 1 ? 'o' : 'i'}`
        : 'Inizia a studiare!',
      icon: CheckCircle,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-500',
    },
    {
      label: 'Tempo di Studio',
      value: data ? formatStudyTime(data.studyTimeMinutes) : '–',
      trend: 'Tempo studiato oggi',
      icon: Clock,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
    },
    {
      label: 'Tasso di Successo',
      value: data?.successRate30d != null ? `${data.successRate30d}%` : '–',
      trend: data?.successRateAll != null
        ? `Storico: ${data.successRateAll}%`
        : 'Nessun dato storico',
      icon: TrendingUp,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
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

const chartData = computed(() => {
  const activity = d.value?.weeklyActivity ?? []
  return {
    labels: activity.map(a => a.day),
    datasets: [
      {
        label: 'Flashcard Studiate',
        data: activity.map(a => a.studied),
        borderColor: '#1B3A5C',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: '#1B3A5C',
        pointRadius: 4,
        tension: 0.4,
      },
      {
        label: 'Risposte Corrette',
        data: activity.map(a => a.correct),
        borderColor: '#1ABFBF',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: '#1ABFBF',
        pointRadius: 4,
        tension: 0.4,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#9CA3AF', font: { size: 12 } },
    },
    y: {
      min: 0,
      ticks: { stepSize: 20, color: '#9CA3AF', font: { size: 12 } },
      grid: { color: '#F3F4F6' },
    },
  },
}
</script>
