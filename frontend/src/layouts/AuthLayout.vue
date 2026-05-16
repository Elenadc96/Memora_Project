<template>
  <!-- Layout condiviso da tutte le pagine che richiedono autenticazione.
       La sidebar è definita qui una volta sola: Dashboard, Ranking,
       Settings e SubjectView la ereditano automaticamente via nested route. -->
  <div class="flex h-screen bg-page overflow-hidden">

    <AppSidebar />

    <!-- Il contenuto della rotta figlia viene iniettato qui da Vue Router -->
    <main class="flex-1 overflow-y-auto">
      <router-view />
    </main>

  </div>
</template>

<script>
import AppSidebar from '@/components/AppSidebar.vue'
import { useFlashcardStore } from '@/stores/flashcards'

export default {
  name: 'AuthLayout',
  components: { AppSidebar },

  setup() {
    const store = useFlashcardStore()
    // Carica le materie dal backend non appena l'utente entra nell'area autenticata.
    store.fetchSubjects()
    return { store }
  },
}
</script>
