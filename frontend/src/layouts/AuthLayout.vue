<template>
  <!-- Layout condiviso da tutte le pagine che richiedono autenticazione.
       La sidebar è definita qui una volta sola: Dashboard, Ranking,
       Settings e SubjectView la ereditano automaticamente via nested route. -->
  <div class="flex h-screen bg-page overflow-hidden">

    <!-- Top bar visibile solo su mobile (hamburger + logo) -->
    <div class="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center gap-3 px-4 bg-white dark:bg-surface border-b border-border flex-shrink-0">
      <button
        class="p-1.5 rounded-lg hover:bg-accent/10 text-primary dark:text-on-surface transition-colors"
        @click="sidebarOpen = true"
      >
        <Menu class="w-5 h-5" />
      </button>
      <span class="font-semibold text-primary dark:text-on-surface flex items-center gap-2">
        <BookOpen class="w-5 h-5 text-accent" />
        Memora
      </span>
    </div>

    <!-- Backdrop su mobile quando la sidebar è aperta -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="md:hidden fixed inset-0 z-40 bg-black/40"
        @click="sidebarOpen = false"
      />
    </Transition>

    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Il contenuto della rotta figlia viene iniettato qui da Vue Router -->
    <main class="flex-1 overflow-y-auto pt-14 md:pt-0">
      <router-view />
    </main>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { Menu, BookOpen } from 'lucide-vue-next'
import AppSidebar from '@/components/AppSidebar.vue'
import { useFlashcardStore } from '@/stores/flashcards'

export default defineComponent({
  name: 'AuthLayout',
  components: { AppSidebar, Menu, BookOpen },

  setup() {
    const store = useFlashcardStore()
    store.fetchSubjects()
    const sidebarOpen = ref(false)
    return { store, sidebarOpen }
  },
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
