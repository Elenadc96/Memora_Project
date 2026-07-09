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

    <BaseSelect
      class="max-w-xs"
      :model-value="uiStore.language"
      :options="languageOptions"
      @update:model-value="onLanguageChange"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Globe } from 'lucide-vue-next'
import BaseSelect from '@/components/common/BaseSelect.vue'
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
  components: { Globe, BaseSelect },

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

    languageOptions(): { value: string; label: string }[] {
      return this.availableLanguages.map(lang => ({ value: lang, label: this.languageLabel(lang) }))
    },
  },

  methods: {
    languageLabel(lang: string): string {
      return LANGUAGE_NAMES[lang] || lang.toUpperCase()
    },

    async onLanguageChange(value: string): Promise<void> {
      // Settings è un blob unico: va inviato completo (tema + lingua),
      // non solo il campo che è cambiato.
      const settings = { ...this.uiStore.currentSettings, language: value as Language }
      try {
        await this.authStore.updateProfile({ settings })
        // La lingua viene applicata in UI solo dopo che l'API ha confermato il salvataggio.
        // Il BaseSelect mostra sempre uiStore.language, quindi se la chiamata
        // fallisce e non aggiorniamo lo store non serve alcun rollback visivo.
        await this.uiStore.setLanguage(value as Language)
      } catch {
        showSaveError()
      }
    },
  },
})
</script>
