<template>
  <aside class="w-64 bg-white dark:bg-surface border-r border-border flex flex-col h-full flex-shrink-0">

    <!-- ── Header: logo app ──────────────────────────────────────────── -->
    <div class="p-6 border-b border-border">
      <h1 class="text-primary dark:text-on-surface font-semibold flex items-center gap-2">
        <BookOpen class="w-6 h-6 text-accent" />
        {{ $t('sidebar.app_name') }}
      </h1>
    </div>

    <!-- ── Navigazione principale + materie (area scrollabile) ──────── -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">

      <!-- Dashboard -->
      <button
        class="sidebar-item"
        :class="{ 'sidebar-item--active': isRoute('/dashboard') }"
        @click="$router.push('/dashboard')"
      >
        <LayoutDashboard class="w-4 h-4" />
        {{ $t('sidebar.dashboard') }}
      </button>

      <!-- Ranking -->
      <button
        class="sidebar-item"
        :class="{ 'sidebar-item--active': isRoute('/ranking') }"
        @click="$router.push('/ranking')"
      >
        <Trophy class="w-4 h-4" />
        {{ $t('sidebar.ranking') }}
      </button>

      <!-- ── Sezione materie ────────────────────────────────────────── -->
      <div class="pt-4 pb-1 px-2 flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-on-surface/60">
          {{ $t('sidebar.subjects_title') }}
        </span>
        <!-- Il bottone + aprirà in futuro un dialog per aggiungere una materia -->
        <button
          class="w-6 h-6 flex items-center justify-center rounded hover:bg-accent/10 text-primary dark:text-on-surface"
          :title="$t('sidebar.add_subject')"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <!-- Lista materie — i dati vengono dallo store (API) o dai mock in dev -->
      <button
        v-for="subject in store.subjects"
        :key="subject.id"
        class="sidebar-item"
        :class="{ 'sidebar-item--active': isActiveSubject(subject.id) }"
        @click="selectSubject(subject.id)"
      >
        <!-- Pallino colorato: il colore è una proprietà della materia salvata nel DB -->
        <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: subject.color }" />
        <span class="flex-1 text-left truncate">{{ subject.subjectName }}</span>
        <!-- Badge con numero di carte: testo piccolo, sfondo tenue -->
        <span class="text-xs bg-accent/10 dark:bg-white/10 px-2 py-0.5 rounded-full">
          {{ subject.cardCount }}
        </span>
      </button>

      <!-- Stato vuoto: mostrato mentre il backend non è ancora collegato -->
      <p v-if="!store.subjects.length" class="px-3 py-2 text-sm text-text-muted dark:text-on-surface/50 italic">
        {{ store.loading ? $t('common.loading') : 'Nessuna materia' }}
      </p>

    </nav>

    <!-- ── Footer: impostazioni ──────────────────────────────────────── -->
    <div class="p-3 border-t border-border">
      <button
        class="sidebar-item"
        :class="{ 'sidebar-item--active': isRoute('/settings') }"
        @click="$router.push('/settings')"
      >
        <Settings class="w-4 h-4" />
        {{ $t('sidebar.settings') }}
      </button>
    </div>

  </aside>
</template>

<script>
import { BookOpen, LayoutDashboard, Trophy, Plus, Settings } from 'lucide-vue-next'
import { useFlashcardStore } from '@/stores/flashcards'

export default {
  name: 'AppSidebar',

  components: { BookOpen, LayoutDashboard, Trophy, Plus, Settings },

  setup() {
    const store = useFlashcardStore()
    return { store }
  },

  methods: {
    // Controlla se la rotta corrente corrisponde al percorso dato.
    // Usato per evidenziare la voce attiva nella sidebar.
    isRoute(path) {
      return this.$route.path === path
    },

    // Una materia è "attiva" se è selezionata nello store E siamo su /subject/:id
    isActiveSubject(id) {
      return this.$route.path === `/subject/${id}`
    },

    // Naviga alla pagina della materia e aggiorna lo store.
    // Lo store caricherà le flashcard di quella materia via API.
    selectSubject(id) {
      this.store.selectSubject(id)
      this.$router.push(`/subject/${id}`)
    },
  },
}
</script>
