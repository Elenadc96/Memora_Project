<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 w-64
           md:relative md:inset-auto md:z-auto md:translate-x-0
           bg-white dark:bg-surface border-r border-border flex flex-col h-full flex-shrink-0
           transition-transform duration-300"
    :class="open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >

    <!-- ── Header: logo app ──────────────────────────────────────────── -->
    <div class="p-6 border-b border-border flex items-center justify-between">
      <h1 class="text-primary dark:text-on-surface font-semibold flex items-center gap-2">
        <BookOpen class="w-6 h-6 text-accent" />
        {{ $t('sidebar.app_name') }}
      </h1>
      <button
        class="md:hidden p-1 rounded-lg hover:bg-accent/10 text-text-muted transition-colors"
        @click="$emit('close')"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- ── Navigazione principale + materie (area scrollabile) ──────── -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">

      <!-- Dashboard -->
      <button
        class="sidebar-item"
        :class="{ 'sidebar-item--active': isRoute('/dashboard') }"
        @click="$router.push('/dashboard'); $emit('close')"
      >
        <LayoutDashboard class="w-4 h-4" />
        {{ $t('sidebar.dashboard') }}
      </button>

      <!-- Ranking -->
      <button
        class="sidebar-item"
        :class="{ 'sidebar-item--active': isRoute('/ranking') }"
        @click="$router.push('/ranking'); $emit('close')"
      >
        <Trophy class="w-4 h-4" />
        {{ $t('sidebar.ranking') }}
      </button>

      <!-- ── Sezione materie ────────────────────────────────────────── -->
      <div class="pt-4 pb-1 px-2 flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-on-surface/60">
          {{ $t('sidebar.subjects_title') }}
        </span>
        <button
          class="w-6 h-6 flex items-center justify-center rounded hover:bg-accent/10 text-primary dark:text-on-surface"
          :title="$t('sidebar.add_subject')"
          @click="createOpen = true"
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
        @click="selectSubject(subject.id); $emit('close')"
      >
        <span
          class="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
          :style="{
            backgroundColor: subject.color + '22',
            border: `1.5px solid ${subject.color}55`,
          }"
        >{{ subject.emoji }}</span>
        <span class="flex-1 text-left truncate">{{ subject.subjectName }}</span>
        <span class="text-xs bg-accent/10 dark:bg-white/10 px-2 py-0.5 rounded-full">
          {{ subject.cardCount }}
        </span>
      </button>

      <!-- Stato vuoto -->
      <p v-if="!store.subjects.length && store.loading" class="px-3 py-2 text-sm text-text-muted dark:text-on-surface/50 italic">
        {{ $t('common.loading') }}
      </p>
      <button
        v-if="!store.subjects.length && !store.loading"
        class="w-full py-3 rounded-lg border border-dashed border-border text-text-muted dark:text-on-surface/50 text-sm hover:border-accent/50 hover:text-accent transition-colors"
        @click="createOpen = true"
      >
        + Aggiungi materia
      </button>

      <CreateSubjectDialog
        :open="createOpen"
        @update:open="createOpen = $event"
        @subject-created="handleSubjectCreated"
      />

    </nav>

    <!-- ── Footer: utente + logout ──────────────────────────────────── -->
    <div class="p-3 border-t border-border">
      <div class="relative flex items-center gap-2" ref="userMenu">

        <!-- Pulsante utente con dropdown -->
        <button
          class="sidebar-item flex-1 min-w-0"
          @click.stop="toggleDropdown"
        >
          <User class="w-4 h-4 flex-shrink-0" />
          <span class="flex-1 text-left truncate">{{ fullName }}</span>
          <ChevronDown
            class="w-4 h-4 flex-shrink-0 transition-transform duration-200"
            :class="{ 'rotate-180': showDropdown }"
          />
        </button>

        <!-- Pulsante logout rapido -->
        <button
          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors flex-shrink-0"
          :title="$t('sidebar.logout')"
          @click="confirmLogout"
        >
          <LogOut class="w-4 h-4" />
        </button>

        <!-- Menu a tendina (si apre verso l'alto) -->
        <div
          v-if="showDropdown"
          class="absolute bottom-full left-0 right-10 mb-2 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50"
        >
          <button
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary dark:text-on-surface hover:bg-accent/10 dark:hover:bg-white/10 transition-colors"
            @click="goToSettings"
          >
            <Settings class="w-4 h-4" />
            {{ $t('sidebar.settings') }}
          </button>

          <div class="border-t border-border mx-3" />

          <button
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            @click="confirmLogout"
          >
            <LogOut class="w-4 h-4" />
            {{ $t('sidebar.logout') }}
          </button>
        </div>

      </div>
    </div>

  </aside>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { BookOpen, LayoutDashboard, Trophy, Plus, Settings, User, ChevronDown, LogOut, X } from 'lucide-vue-next'
import { useFlashcardStore } from '@/stores/flashcards'
import { useAuthStore } from '@/stores/auth'
import CreateSubjectDialog from '@/components/subject/CreateSubjectDialog.vue'
import Swal from 'sweetalert2'
import { swalTheme } from '@/utils/notify'

export default defineComponent({
  name: 'AppSidebar',

  components: { BookOpen, LayoutDashboard, Trophy, Plus, Settings, User, ChevronDown, LogOut, X, CreateSubjectDialog },

  props: {
    open: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['close'],

  setup() {
    const store    = useFlashcardStore()
    const authStore = useAuthStore()
    return { store, authStore }
  },

  data() {
    return {
      showDropdown: false,
      createOpen: false,
    }
  },

  computed: {
    fullName(): string {
      return this.authStore.fullName || this.$t('sidebar.settings')
    },
  },

  mounted() {
    document.addEventListener('click', this.handleOutsideClick)
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick)
  },

  methods: {
    isRoute(path: string): boolean {
      return this.$route.path === path
    },

    isActiveSubject(id: number): boolean {
      return this.$route.path === `/subject/${id}`
    },

    selectSubject(id: number): void {
      this.store.selectSubject(id)
      this.$router.push(`/subject/${id}`)
    },

    async handleSubjectCreated(payload: { name: string; description: string; color: string; emoji: string }): Promise<void> {
      try {
        const subject = await this.store.createSubject(payload)
        this.store.selectSubject(subject.id)
        this.$router.push(`/subject/${subject.id}`)
      } catch {
        Swal.fire({ ...swalTheme(), icon: 'error', title: 'Errore', text: 'Impossibile creare la materia. Riprova.' })
      }
    },

    toggleDropdown(): void {
      this.showDropdown = !this.showDropdown
    },

    handleOutsideClick(event: MouseEvent): void {
      const menu = this.$refs.userMenu as HTMLElement | undefined
      if (menu && !menu.contains(event.target as Node)) {
        this.showDropdown = false
      }
    },

    goToSettings(): void {
      this.showDropdown = false
      this.$router.push('/settings')
    },

    async confirmLogout(): Promise<void> {
      this.showDropdown = false
      // SweetAlert2 è fuori dal sistema Tailwind e non legge le classi dark:,
      // quindi il colore va letto a runtime dalla CSS variable (che main.css
      // ridefinisce già per il tema scuro) invece di essere fisso qui.
      const dangerColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-danger')
        .trim()
      const result = await Swal.fire({
        ...swalTheme(),
        icon: 'question',
        title: this.$t('sidebar.logout_confirm_title'),
        text:  this.$t('sidebar.logout_confirm_text'),
        showCancelButton: true,
        confirmButtonText: this.$t('sidebar.logout_confirm_button'),
        cancelButtonText:  this.$t('common.cancel'),
        confirmButtonColor: dangerColor,
      })

      if (result.isConfirmed) {
        await this.authStore.logout()
        this.$router.push('/login')
      }
    },
  },
})
</script>
