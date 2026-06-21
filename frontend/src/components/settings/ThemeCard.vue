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
        @click="uiStore.setDarkMode(false)"
      >
        <Sun class="w-4 h-4" />
        {{ $t('settings.theme_light') }}
      </button>
      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
        :class="uiStore.isDark ? 'bg-accent text-white' : 'text-primary dark:text-on-surface hover:bg-accent/10'"
        @click="uiStore.setDarkMode(true)"
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

export default defineComponent({
  name: 'ThemeCard',
  components: { SunMoon, Sun, Moon },

  setup() {
    const uiStore = useUIStore()
    return { uiStore }
  },
})
</script>
