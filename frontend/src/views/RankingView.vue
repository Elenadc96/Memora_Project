<template>
  <main class="flex-1 overflow-y-auto p-8">

    <!-- Header -->
    <div class="mb-8">
      <h2 class="page-title">{{ $t('ranking.title') }}</h2>
      <p class="page-subtitle">{{ $t('ranking.subtitle') }}</p>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center h-64">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <p v-else-if="store.error" class="text-sm text-red-500">{{ $t('common.error') }}</p>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Classifica globale -->
        <div class="card lg:col-span-2 rounded-2xl p-6">
          <h3 class="font-semibold text-primary dark:text-on-surface flex items-center gap-2 mb-5">
            <Trophy class="w-5 h-5 text-amber-500" />
            {{ $t('ranking.global_title') }}
          </h3>

          <div class="space-y-2">
            <div
              v-for="user in store.leaderboard"
              :key="user.userId"
              :class="[
                'flex items-center gap-4 p-4 rounded-xl transition-colors',
                user.isCurrentUser
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-accent/5 hover:bg-accent/10'
              ]"
            >
              <!-- Rank icon -->
              <div class="w-8 flex items-center justify-center flex-shrink-0">
                <Crown v-if="user.rank === 1" class="w-5 h-5 text-amber-400" />
                <Medal v-else-if="user.rank === 2" class="w-5 h-5 text-gray-400" />
                <Medal v-else-if="user.rank === 3" class="w-5 h-5 text-amber-600" />
                <span v-else class="text-sm text-text-muted font-medium">#{{ user.rank }}</span>
              </div>

              <!-- Avatar -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                :style="{ backgroundColor: avatarColor(user.userId) }"
              >{{ initials(user.name) }}</div>

              <!-- Nome + punti -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 font-medium text-primary dark:text-on-surface">
                  <span class="truncate">{{ user.name }}</span>
                  <span
                    v-if="user.isCurrentUser"
                    class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex-shrink-0"
                  >{{ $t('ranking.you_label') }}</span>
                </div>
                <div class="text-sm text-text-muted">{{ $t('ranking.points_label', { count: formatPoints(user.points) }) }}</div>
              </div>

              <!-- Streak badge -->
              <div class="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg flex-shrink-0">
                <Flame class="w-4 h-4 text-amber-500" />
                <span class="text-sm font-medium text-amber-600 dark:text-amber-400">{{ $t('ranking.streak_days', { count: user.streak }) }}</span>
              </div>
            </div>

            <p v-if="store.leaderboard.length === 0" class="text-sm text-text-muted text-center py-6">
              {{ $t('common.error') }}
            </p>
          </div>

          <!-- Banner streak utente -->
          <div class="mt-5 p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Flame class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="font-medium text-primary dark:text-on-surface">{{ $t('ranking.streak_motivation', { count: myStats.streak }) }}</p>
              <p class="text-sm text-text-muted mt-0.5">
                <template v-if="daysToMarathon > 0">
                  {{ $t('ranking.streak_hint', { remaining: daysToMarathon, badge: marathonerName }) }}
                </template>
                <template v-else>
                  {{ $t('ranking.streak_hint_done', { badge: marathonerName }) }}
                </template>
              </p>
            </div>
          </div>
        </div>

        <!-- Statistiche personali -->
        <div class="card rounded-2xl p-6 h-fit">
          <h3 class="font-semibold text-primary dark:text-on-surface mb-4">{{ $t('ranking.your_stats') }}</h3>

          <div class="text-center p-5 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white mb-5">
            <p class="text-sm opacity-80 mb-1">{{ $t('ranking.position') }}</p>
            <p class="text-4xl font-bold">#{{ myRank ?? '–' }}</p>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-muted">{{ $t('ranking.total_points') }}</span>
              <span class="font-medium text-primary dark:text-on-surface">{{ formatPoints(myStats.totalPoints) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-muted">{{ $t('ranking.current_streak') }}</span>
              <span class="font-medium text-primary dark:text-on-surface flex items-center gap-1">
                <Flame class="w-4 h-4 text-amber-500" />
                {{ $t('ranking.streak_days', { count: myStats.streak }) }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-muted">{{ $t('ranking.badges_unlocked') }}</span>
              <span class="font-medium text-primary dark:text-on-surface">{{ unlockedCount }}/{{ totalCount }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-muted">{{ $t('ranking.cards_completed') }}</span>
              <span class="font-medium text-primary dark:text-on-surface">{{ myStats.cardsCompleted }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Collezione badge -->
      <div class="mt-6 card rounded-2xl p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-semibold text-primary dark:text-on-surface flex items-center gap-2">
            <Award class="w-5 h-5 text-accent" />
            {{ $t('ranking.badges_title') }}
          </h3>
          <span class="text-xs px-3 py-1 rounded-full bg-accent/10 text-primary dark:text-on-surface">
            {{ $t('ranking.badges_count', { unlocked: unlockedCount, total: totalCount }) }}
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="badge in displayBadges"
            :key="badge.id"
            :class="[
              'card p-5 rounded-xl text-center',
              badge.unlocked ? 'hover:shadow-lg transition-shadow' : 'opacity-60'
            ]"
          >
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
              :class="[badge.color, !badge.unlocked && 'grayscale']"
            >
              <component :is="badge.iconComponent" class="w-8 h-8 text-white" />
            </div>

            <p class="font-medium text-primary dark:text-on-surface text-sm mb-1">{{ badge.name }}</p>
            <p class="text-xs text-text-muted mb-3 leading-relaxed">{{ badge.description }}</p>

            <span
              v-if="badge.unlocked"
              class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              ✓ {{ badge.unlockedDate ? $t('ranking.unlocked_on', { date: formatDate(badge.unlockedDate) }) : '' }}
            </span>

            <div v-else class="w-full">
              <div class="flex justify-between text-xs text-text-muted mb-1.5">
                <span>{{ $t('ranking.progress_label') }}</span>
                <span>{{ badge.progress }}/{{ badge.total }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-accent/20 overflow-hidden">
                <div
                  class="h-full rounded-full bg-accent transition-all duration-700"
                  :style="{ width: badgeProgressPct(badge) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Component } from 'vue'
import { Trophy, Crown, Medal, Flame, Award, Star, BookOpen, Zap, Target, Clock } from 'lucide-vue-next'
import { useTranslation } from 'i18next-vue'
import { useRankingStore, type BadgeEntry } from '@/stores/ranking'
import { useUIStore } from '@/stores/ui'

const store = useRankingStore()
const uiStore = useUIStore()
const { t } = useTranslation()

onMounted(() => store.fetchAll())

// Mappa l'icona salvata nel DB (stringa) sul componente lucide, il colore del
// cerchio e lo slug i18n per nome/descrizione. Nome e descrizione restano
// tradotti lato frontend: il DB conserva solo dati non testuali.
const BADGE_META: Record<string, { slug: string; iconComponent: Component; color: string }> = {
  star:   { slug: 'beginner',      iconComponent: Star,     color: 'bg-cyan-500' },
  flame:  { slug: 'dedicated',     iconComponent: Flame,    color: 'bg-amber-500' },
  book:   { slug: 'quiz_master',   iconComponent: BookOpen, color: 'bg-blue-500' },
  bolt:   { slug: 'speedster',     iconComponent: Zap,      color: 'bg-green-500' },
  target: { slug: 'perfectionist', iconComponent: Target,   color: 'bg-purple-500' },
  medal:  { slug: 'marathoner',    iconComponent: Medal,    color: 'bg-amber-400' },
  crown:  { slug: 'legend',        iconComponent: Crown,    color: 'bg-purple-600' },
  clock:  { slug: 'nightowl',      iconComponent: Clock,    color: 'bg-cyan-400' },
}

// Colori letti dalle CSS variable --color-avatar-1..8 (main.css) invece di
// classi Tailwind fisse, così restano centralizzati con tutto il resto della
// palette invece di essere sparsi nel componente.
const AVATAR_COLORS = [
  'var(--color-avatar-1)', 'var(--color-avatar-2)', 'var(--color-avatar-3)', 'var(--color-avatar-4)',
  'var(--color-avatar-5)', 'var(--color-avatar-6)', 'var(--color-avatar-7)', 'var(--color-avatar-8)',
]

function avatarColor(userId: number): string {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length]
}

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function formatPoints(points: number): string {
  return points.toLocaleString(uiStore.language === 'it' ? 'it-IT' : 'en-US')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(uiStore.language === 'it' ? 'it-IT' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const myStats = computed(() => store.stats ?? {
  totalPoints: 0, streak: 0, cardsCompleted: 0, perfectSessions: 0, isSpeedster: false, isNightOwl: false,
})

const myRank = computed(() => store.leaderboard.find(u => u.isCurrentUser)?.rank ?? null)

const displayBadges = computed(() => store.badges.map((b: BadgeEntry) => {
  const meta = BADGE_META[b.icon] ?? BADGE_META.star
  return {
    ...b,
    iconComponent: meta.iconComponent,
    color: meta.color,
    name: t(`ranking.badges.${meta.slug}_name`),
    description: t(`ranking.badges.${meta.slug}_desc`),
  }
}))

const unlockedCount = computed(() => store.badges.filter(b => b.unlocked).length)
const totalCount = computed(() => store.badges.length)

const marathonerBadge = computed(() => store.badges.find(b => b.icon === 'medal'))
const marathonerName = computed(() => t('ranking.badges.marathoner_name'))
const daysToMarathon = computed(() => Math.max(0, (marathonerBadge.value?.total ?? 30) - myStats.value.streak))

function badgeProgressPct(badge: BadgeEntry): number {
  return badge.total ? Math.round((badge.progress / badge.total) * 100) : 0
}
</script>
