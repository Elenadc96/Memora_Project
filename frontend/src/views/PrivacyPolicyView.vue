<!--
  PrivacyPolicyView — pagina standalone (nessun layout/sidebar), pensata per
  essere aperta in una nuova finestra dal pulsante nella sezione Impostazioni.
-->
<template>
  <div class="min-h-screen bg-page py-10 px-6">
    <div class="max-w-2xl mx-auto card space-y-6">
      <div>
        <h1 class="page-title">{{ $t('privacy_policy.title') }}</h1>
        <p class="page-subtitle text-sm">{{ $t('privacy_policy.last_updated') }}</p>
      </div>

      <section class="space-y-1">
        <h2 class="font-semibold text-primary dark:text-on-surface">{{ $t('privacy_policy.intro_title') }}</h2>
        <p class="text-sm text-text-muted leading-relaxed">{{ $t('privacy_policy.intro_text') }}</p>
      </section>

      <section class="space-y-1">
        <h2 class="font-semibold text-primary dark:text-on-surface">{{ $t('privacy_policy.data_title') }}</h2>
        <p class="text-sm text-text-muted leading-relaxed">{{ $t('privacy_policy.data_text') }}</p>
      </section>

      <section class="space-y-1">
        <h2 class="font-semibold text-primary dark:text-on-surface">{{ $t('privacy_policy.purpose_title') }}</h2>
        <p class="text-sm text-text-muted leading-relaxed">{{ $t('privacy_policy.purpose_text') }}</p>
      </section>

      <section class="space-y-1">
        <h2 class="font-semibold text-primary dark:text-on-surface">{{ $t('privacy_policy.retention_title') }}</h2>
        <p class="text-sm text-text-muted leading-relaxed">{{ $t('privacy_policy.retention_text') }}</p>
      </section>

      <section class="space-y-1">
        <h2 class="font-semibold text-primary dark:text-on-surface">{{ $t('privacy_policy.rights_title') }}</h2>
        <p class="text-sm text-text-muted leading-relaxed">{{ $t('privacy_policy.rights_text') }}</p>
      </section>

      <section class="space-y-1">
        <h2 class="font-semibold text-primary dark:text-on-surface">{{ $t('privacy_policy.cookies_title') }}</h2>
        <p class="text-sm text-text-muted leading-relaxed">{{ $t('privacy_policy.cookies_text') }}</p>
      </section>

      <section class="space-y-1">
        <h2 class="font-semibold text-primary dark:text-on-surface">{{ $t('privacy_policy.contact_title') }}</h2>
        <p class="text-sm text-text-muted leading-relaxed">{{ $t('privacy_policy.contact_text') }}</p>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({ name: 'PrivacyPolicyView' })
</script>
