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
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <template v-if="!isLogin">
            <div class="space-y-1">
              <label class="block text-sm text-primary">{{ $t('login.name') }}</label>
              <input v-model="form.name" type="text" required class="input-field" />
            </div>
            <div class="space-y-1">
              <label class="block text-sm text-primary">{{ $t('login.lastName') }}</label>
              <input v-model="form.lastName" type="text" required class="input-field" />
            </div>
          </template>

          <div class="space-y-1">
            <label class="block text-sm text-primary">{{ $t('login.email') }}</label>
            <input v-model="form.email" type="email" required class="input-field" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-primary">{{ $t('login.password') }}</label>
            <input v-model="form.password" type="password" required class="input-field" />
          </div>

          <div v-if="!isLogin" class="space-y-1">
            <label class="block text-sm text-primary">{{ $t('login.confirm_password') }}</label>
            <input v-model="form.confirmPassword" type="password" required class="input-field" />
          </div>

          <button type="submit" class="btn-primary w-full mt-6">
            {{ isLogin ? $t('login.login_button') : $t('login.register_button') }}
          </button>
        </form>

        <!-- Toggle login/register -->
        <div class="mt-6 text-center">
          <p class="text-primary mb-3">
            {{ isLogin ? $t('login.no_account') : $t('login.has_account') }}
          </p>
          <button @click="isLogin = !isLogin" class="btn-primary px-6">
            {{ isLogin ? $t('login.register_button') : $t('login.login_button') }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      isLogin: true,
      form: { name: '', lastName: '', email: '', password: '', confirmPassword: '' },
    }
  },
  methods: {
    handleSubmit() {
      this.$router.push('/dashboard')
    },
  },
}
</script>
