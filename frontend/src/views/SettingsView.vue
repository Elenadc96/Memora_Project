<template>
  <div class="min-h-full bg-page p-6 md:p-8">
    <div class="max-w-2xl mx-auto space-y-6">

      <div>
        <h2 class="page-title">{{ $t('settings.title') }}</h2>
        <p class="page-subtitle">{{ $t('settings.subtitle') }}</p>
      </div>

      <PersonalInfoCard />
      <LanguageCard />
      <ThemeCard />
      <PrivacyPolicyCard />

      <!-- Zona pericolosa: elimina account -->
      <div class="card space-y-3 border-red-200">
        <h3 class="font-semibold text-red-600 flex items-center gap-2">
          <AlertOctagon class="w-5 h-5" />
          {{ $t('settings.danger_zone.title') }}
        </h3>
        <p class="text-sm text-text-muted">{{ $t('settings.danger_zone.delete_account_description') }}</p>
        <button
          type="button"
          class="btn-outline inline-flex items-center gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          @click="showDeleteConfirm = true"
        >
          <Trash2 class="w-4 h-4" />
          {{ $t('settings.danger_zone.delete_account') }}
        </button>
      </div>

    </div>

    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="$t('settings.danger_zone.delete_confirm_title')"
      :message="$t('settings.danger_zone.delete_confirm_message')"
      :danger="true"
      @confirm="onDeleteAccount"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AlertOctagon, Trash2 } from 'lucide-vue-next'
import Swal from 'sweetalert2'
import PersonalInfoCard from '@/components/settings/PersonalInfoCard.vue'
import LanguageCard from '@/components/settings/LanguageCard.vue'
import ThemeCard from '@/components/settings/ThemeCard.vue'
import PrivacyPolicyCard from '@/components/settings/PrivacyPolicyCard.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { apiErrorMessage, swalTheme } from '@/utils/notify'

export default defineComponent({
  name: 'SettingsView',

  components: {
    AlertOctagon,
    Trash2,
    PersonalInfoCard,
    LanguageCard,
    ThemeCard,
    PrivacyPolicyCard,
    ConfirmDialog,
  },

  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },

  data() {
    return {
      showDeleteConfirm: false,
    }
  },

  methods: {
    async onDeleteAccount(): Promise<void> {
      try {
        await this.authStore.deleteAccount()
        this.$router.push('/login')
      } catch (err: unknown) {
        Swal.fire({ ...swalTheme(), icon: 'error', text: apiErrorMessage(err) })
      }
    },
  },
})
</script>
