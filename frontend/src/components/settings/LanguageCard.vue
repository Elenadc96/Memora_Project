<!--
  LanguageCard — selezione della lingua dell'app.
  Le opzioni del menù a tendina sono lette direttamente dalla configurazione
  i18next (supportedLngs), così non serve aggiornare questo componente
  quando in futuro verrà aggiunta una nuova traduzione.
-->
<template>
  <div class="card space-y-3">
    <h3 class="font-semibold text-primary dark:text-on-surface flex items-center gap-2">
      <Globe class="w-5 h-5 text-accent" />
      {{ $t('settings.language') }}
    </h3>

    <select
      class="input-field max-w-xs"
      :value="uiStore.language"
      @change="onLanguageChange"
    >
      <option
        v-for="lang in availableLanguages"
        :key="lang"
        :value="lang"
        class="bg-white text-primary dark:bg-surface dark:text-on-surface"
      >
        {{ languageLabel(lang) }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Globe } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { i18next } from '@/i18n'
import { showSaveError } from '@/utils/notify'
import type { Language } from '@/types'

// Nomi nativi delle lingue conosciute. Se in futuro si aggiunge una lingua
// non presente in questa mappa, viene mostrato semplicemente il suo codice.
const LANGUAGE_NAMES: Record<string, string> = {
  it: 'Italiano',
  en: 'English',
}

export default defineComponent({
  name: 'LanguageCard',
  components: { Globe },

  setup() {
    const uiStore = useUIStore()
    const authStore = useAuthStore()
    return { uiStore, authStore }
  },

  computed: {
    availableLanguages(): string[] {
      const supported = (i18next.options.supportedLngs || []) as string[]
      return supported.filter(lang => lang !== 'cimode')
    },
  },

  methods: {
    languageLabel(lang: string): string {
      return LANGUAGE_NAMES[lang] || lang.toUpperCase()
    },

    async onLanguageChange(event: Event): Promise<void> {
      const select = event.target as HTMLSelectElement
      const value = select.value as Language

      // Settings è un blob unico: va inviato completo (tema + lingua),
      // non solo il campo che è cambiato.
      const settings = { ...this.uiStore.currentSettings, language: value }
      try {
        await this.authStore.updateProfile({ settings })
        // La lingua viene applicata in UI solo dopo che l'API ha confermato il salvataggio.
        await this.uiStore.setLanguage(value)
      } catch {
        // La select mostra già visivamente il nuovo valore scelto: la
        // riportiamo a quello corrente perché il salvataggio non è andato a buon fine.
        select.value = this.uiStore.language
        showSaveError()
      }
    },
  },
})
</script>
