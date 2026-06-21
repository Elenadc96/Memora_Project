<!--
  PersonalInfoCard — visualizza i dati personali dell'utente e contiene
  il bottone per espandere il form di cambio password.
  Solo UI: il submit del form non chiama ancora nessuna API.
-->
<template>
  <div class="card space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-primary dark:text-on-surface flex items-center gap-2">
        <UserRound class="w-5 h-5 text-accent" />
        {{ $t('settings.personal_data.title') }}
      </h3>

      <button
        v-if="!isEditingInfo"
        type="button"
        class="btn-ghost inline-flex items-center gap-1 text-sm"
        @click="startEditInfo"
      >
        <Pencil class="w-4 h-4" />
        {{ $t('common.edit') }}
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <p class="text-xs text-text-muted uppercase tracking-wide">{{ $t('settings.personal_data.name') }}</p>
        <p v-if="!isEditingInfo" class="text-primary dark:text-on-surface font-medium">{{ authStore.user?.name || '—' }}</p>
        <input v-else v-model.trim="infoForm.name" type="text" class="input-field" />
      </div>
      <div>
        <p class="text-xs text-text-muted uppercase tracking-wide">{{ $t('settings.personal_data.lastname') }}</p>
        <p v-if="!isEditingInfo" class="text-primary dark:text-on-surface font-medium">{{ authStore.user?.lastName || '—' }}</p>
        <input v-else v-model.trim="infoForm.lastName" type="text" class="input-field" />
      </div>
      <div class="sm:col-span-2">
        <p class="text-xs text-text-muted uppercase tracking-wide">{{ $t('settings.personal_data.email') }}</p>
        <p class="text-primary dark:text-on-surface font-medium">{{ authStore.user?.email || '—' }}</p>
      </div>
    </div>

    <div v-if="isEditingInfo" class="flex justify-end gap-3">
      <button type="button" class="btn-ghost" @click="cancelEditInfo">{{ $t('common.cancel') }}</button>
      <button type="button" class="btn-primary" @click="saveEditInfo">{{ $t('common.save') }}</button>
    </div>

    <button type="button" class="btn-outline inline-flex items-center gap-2" @click="showPasswordForm = !showPasswordForm">
      <KeyRound class="w-4 h-4" />
      {{ $t('settings.personal_data.change_password') }}
      <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showPasswordForm }" />
    </button>

    <!-- Form di cambio password: si espande con un'animazione su grid-template-rows -->
    <div
      class="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out"
      :style="{ gridTemplateRows: showPasswordForm ? '1fr' : '0fr' }"
    >
      <div class="overflow-hidden">
        <form class="space-y-4 pt-2" @submit.prevent="submitPasswordChange">
          <div class="space-y-1">
            <label class="block text-sm text-primary dark:text-on-surface font-medium">
              {{ $t('settings.personal_data.current_password') }}
            </label>
            <input
              v-model="passwordForm.current"
              type="password"
              class="input-field"
              :placeholder="$t('settings.personal_data.current_password_placeholder')"
              autocomplete="current-password"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary dark:text-on-surface font-medium">
              {{ $t('settings.personal_data.new_password') }}
            </label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="input-field"
              :placeholder="$t('settings.personal_data.new_password_placeholder')"
              autocomplete="new-password"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary dark:text-on-surface font-medium">
              {{ $t('settings.personal_data.confirm_password') }}
            </label>
            <input
              v-model="passwordForm.confirm"
              type="password"
              class="input-field"
              :placeholder="$t('settings.personal_data.confirm_password_placeholder')"
              autocomplete="new-password"
            />
          </div>

          <div class="flex justify-end">
            <button type="submit" class="btn-primary">
              {{ $t('settings.personal_data.update_password') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { UserRound, KeyRound, ChevronDown, Pencil } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { showSaveError } from '@/utils/notify'

export default defineComponent({
  name: 'PersonalInfoCard',
  components: { UserRound, KeyRound, ChevronDown, Pencil },

  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },

  data() {
    return {
      // Modifica dati personali (nome/cognome) — indipendente dal form password qui sotto
      isEditingInfo: false,
      infoForm: {
        name: '',
        lastName: '',
      },

      showPasswordForm: false,
      passwordForm: {
        current: '',
        newPassword: '',
        confirm: '',
      },
    }
  },

  mounted(): void {
    this.authStore.checkSession()
  },

  methods: {
    startEditInfo(): void {
      this.infoForm = {
        name: this.authStore.user?.name || '',
        lastName: this.authStore.user?.lastName || '',
      }
      this.isEditingInfo = true
    },

    cancelEditInfo(): void {
      this.isEditingInfo = false
    },

    async saveEditInfo(): Promise<void> {
      try {
        await this.authStore.updateProfile({
          name: this.infoForm.name,
          lastName: this.infoForm.lastName,
        })
        this.isEditingInfo = false
      } catch {
        showSaveError()
      }
    },

    submitPasswordChange(): void {
      // TODO: collegare all'endpoint di cambio password quando sarà disponibile
      this.passwordForm = { current: '', newPassword: '', confirm: '' }
      this.showPasswordForm = false
    },
  },
})
</script>
