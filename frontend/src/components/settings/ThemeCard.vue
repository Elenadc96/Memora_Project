<!--
  ThemeCard — selezione tra modalità chiara e scura.
  Si appoggia a useUIStore, che gestisce già la classe `dark` su <html>
  e la persistenza della preferenza.
-->
<template>
  <div class="card space-y-3">
    <h3 class="font-semibold text-primary dark:text-on-surface flex items-center gap-2">
      <SunMoon class="w-5 h-5 text-accent" />
      {{ $t('settings.theme') }}
    </h3>

    <div class="inline-flex rounded-md border border-border overflow-hidden">
      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
        :class="!uiStore.isDark ? 'bg-accent text-white' : 'text-primary dark:text-on-surface hover:bg-accent/10'"
        @click="setTheme(false)"
      >
        <Sun class="w-4 h-4" />
        {{ $t('settings.theme_light') }}
      </button>
      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
        :class="uiStore.isDark ? 'bg-accent text-white' : 'text-primary dark:text-on-surface hover:bg-accent/10'"
        @click="setTheme(true)"
      >
        <Moon class="w-4 h-4" />
        {{ $t('settings.theme_dark') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { SunMoon, Sun, Moon } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { showSaveError } from '@/utils/notify'

export default defineComponent({
  name: 'ThemeCard',
  components: { SunMoon, Sun, Moon },

  setup() {
    const uiStore = useUIStore()
    const authStore = useAuthStore()
    return { uiStore, authStore }
  },

  methods: {
    async setTheme(isDark: boolean): Promise<void> {
      // Settings è un blob unico: va inviato completo (tema + lingua),
      // non solo il campo che è cambiato.
      const settings = { ...this.uiStore.currentSettings, theme: isDark ? 'dark' as const : 'light' as const }
      try {
        await this.authStore.updateProfile({ settings })
        // Il tema viene applicato in UI solo dopo che l'API ha confermato il salvataggio.
        this.uiStore.setDarkMode(isDark)
      } catch {
        showSaveError()
      }
    },
  },
})
</script>
