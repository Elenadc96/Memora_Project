<template>
  <div class="min-h-screen bg-page flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-surface rounded-2xl shadow-2xl p-8">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center gap-3">
            <h1 class="text-4xl text-primary dark:text-on-surface font-serif tracking-wide">{{ $t('login.title') }}</h1>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-primary dark:text-on-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p class="text-primary dark:text-on-surface mt-2 text-lg">{{ $t('register.title') }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-1">
            <label class="block text-sm text-primary dark:text-on-surface">{{ $t('login.name') }}</label>
            <input v-model="form.name" type="text" required class="input-field" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary dark:text-on-surface">{{ $t('login.surname') }}</label>
            <input v-model="form.lastName" type="text" required class="input-field" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary dark:text-on-surface">{{ $t('login.email') }}</label>
            <input v-model="form.email" type="email" required class="input-field" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary dark:text-on-surface">{{ $t('login.password') }}</label>
            <input v-model="form.password" type="password" required class="input-field" />
            <!-- Requisiti visivi aggiornati in tempo reale mentre si digita -->
            <ul v-if="form.password" class="mt-2 space-y-1 text-xs pl-1">
              <li :class="passwordChecks.length ? 'text-green-600 dark:text-green-400' : 'text-text-muted dark:text-on-surface/50'">
                {{ passwordChecks.length ? '✓' : '○' }} {{ $t('register.pwd_min_length') }}
              </li>
              <li :class="passwordChecks.uppercase ? 'text-green-600 dark:text-green-400' : 'text-text-muted dark:text-on-surface/50'">
                {{ passwordChecks.uppercase ? '✓' : '○' }} {{ $t('register.pwd_uppercase') }}
              </li>
              <li :class="passwordChecks.lowercase ? 'text-green-600 dark:text-green-400' : 'text-text-muted dark:text-on-surface/50'">
                {{ passwordChecks.lowercase ? '✓' : '○' }} {{ $t('register.pwd_lowercase') }}
              </li>
              <li :class="passwordChecks.number ? 'text-green-600 dark:text-green-400' : 'text-text-muted dark:text-on-surface/50'">
                {{ passwordChecks.number ? '✓' : '○' }} {{ $t('register.pwd_number') }}
              </li>
            </ul>
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary dark:text-on-surface">{{ $t('login.confirm_password') }}</label>
            <input v-model="form.confirmPassword" type="password" required class="input-field" />
          </div>

          <!-- Consenso Privacy Policy -->
          <label class="flex items-start gap-2 cursor-pointer">
            <input v-model="form.acceptedPrivacy" type="checkbox" class="mt-0.5 accent-primary flex-shrink-0" />
            <span class="text-sm text-primary dark:text-on-surface">
              {{ $t('register.privacy_label') }}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" class="text-accent underline hover:no-underline">
                {{ $t('register.privacy_link') }}
              </a>
            </span>
          </label>

          <button type="submit" class="btn-primary w-full mt-6">
            {{ $t('register.submit') }}
          </button>
        </form>

        <!-- Link al login -->
        <div class="mt-6 text-center">
          <p class="text-primary dark:text-on-surface mb-3">{{ $t('login.has_account') }}</p>
          <router-link to="/login" class="btn-primary px-6">
            {{ $t('login.login_button') }}
          </router-link>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { apiErrorMessage, swalTheme } from '@/utils/notify'

export default defineComponent({
  name: 'RegisterView',
  data() {
    return {
      form: { name: '', lastName: '', email: '', password: '', confirmPassword: '', acceptedPrivacy: false },
    }
  },
  computed: {
    passwordChecks() {
      const p = this.form.password
      return {
        length:    p.length >= 8,
        uppercase: /[A-Z]/.test(p),
        lowercase: /[a-z]/.test(p),
        number:    /[0-9]/.test(p),
      }
    },
    passwordValid(): boolean {
      const c = this.passwordChecks
      return c.length && c.uppercase && c.lowercase && c.number
    },
  },
  methods: {
    async handleSubmit(): Promise<void> {
      if (!this.form.acceptedPrivacy) {
        Swal.fire({ ...swalTheme(), icon: 'error', title: 'Errore', text: this.$t('register.privacy_required') })
        return
      }
      if (!this.passwordValid) {
        Swal.fire({ ...swalTheme(), icon: 'error', title: 'Errore', text: this.$t('errors.PASSWORD_WEAK') })
        return
      }
      if (this.form.password !== this.form.confirmPassword) {
        Swal.fire({ ...swalTheme(), icon: 'error', title: 'Errore', text: this.$t('settings.personal_data.password_mismatch') })
        return
      }

      try {
        await axios.post('/api/auth/register', {
          name:     this.form.name,
          lastName: this.form.lastName,
          email:    this.form.email,
          password: this.form.password,
        })

        await Swal.fire({
          ...swalTheme(),
          icon: 'success',
          title: this.$t('register.success_title'),
          text:  this.$t('register.success_text'),
          showConfirmButton: false,
          timer: 2000,
        })

        this.$router.push('/login')
      } catch (error: any) {
        Swal.fire({ ...swalTheme(), icon: 'error', title: 'Errore', text: apiErrorMessage(error) })
      }
    },
  },
})
</script>
