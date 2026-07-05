<template>
  <div class="min-h-screen bg-page flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-surface rounded-2xl shadow-2xl p-8">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center gap-3">
            <h1 class="text-4xl text-primary font-serif tracking-wide">{{ $t('login.title') }}</h1>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p class="text-primary mt-2 text-lg">{{ $t('register.title') }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-1">
            <label class="block text-sm text-primary">{{ $t('login.name') }}</label>
            <input v-model="form.name" type="text" required class="input-field" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary">{{ $t('login.surname') }}</label>
            <input v-model="form.lastName" type="text" required class="input-field" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary">{{ $t('login.email') }}</label>
            <input v-model="form.email" type="email" required class="input-field" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary">{{ $t('login.password') }}</label>
            <input v-model="form.password" type="password" required class="input-field" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary">{{ $t('login.confirm_password') }}</label>
            <input v-model="form.confirmPassword" type="password" required class="input-field" />
          </div>

          <button type="submit" class="btn-primary w-full mt-6">
            {{ $t('register.submit') }}
          </button>
        </form>

        <!-- Link al login -->
        <div class="mt-6 text-center">
          <p class="text-primary mb-3">{{ $t('login.has_account') }}</p>
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
import { apiErrorMessage } from '@/utils/notify'

export default defineComponent({
  name: 'RegisterView',
  data() {
    return {
      form: { name: '', lastName: '', email: '', password: '', confirmPassword: '' },
    }
  },
  methods: {
    async handleSubmit(): Promise<void> {
      if (this.form.password !== this.form.confirmPassword) {
        Swal.fire({ icon: 'error', title: 'Errore', text: 'Le password non coincidono' })
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
          icon: 'success',
          title: this.$t('register.success_title'),
          text:  this.$t('register.success_text'),
          showConfirmButton: false,
          timer: 2000,
        })

        this.$router.push('/login')
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Errore', text: apiErrorMessage(error) })
      }
    },
  },
})
</script>
