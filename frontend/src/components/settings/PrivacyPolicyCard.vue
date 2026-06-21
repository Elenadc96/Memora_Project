<!--
  PrivacyPolicyCard — apre la pagina della Privacy Policy in una nuova finestra/tab.
-->
<template>
  <div class="card space-y-3">
    <h3 class="font-semibold text-primary dark:text-on-surface flex items-center gap-2">
      <Shield class="w-5 h-5 text-accent" />
      {{ $t('settings.privacy.title') }}
    </h3>

    <p class="text-sm text-text-muted">{{ $t('settings.privacy.description') }}</p>

    <button type="button" class="btn-outline inline-flex items-center gap-2" @click="openPrivacyPolicy">
      <ExternalLink class="w-4 h-4" />
      {{ $t('settings.privacy.read_policy') }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Shield, ExternalLink } from 'lucide-vue-next'

export default defineComponent({
  name: 'PrivacyPolicyCard',
  components: { Shield, ExternalLink },

  methods: {
    openPrivacyPolicy(): void {
      window.open('/privacy-policy', '_blank', 'noopener,noreferrer')
    },
  },
})
</script>
