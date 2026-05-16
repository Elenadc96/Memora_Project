<template>
  <div class="min-h-screen bg-[#BEE9E8] flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-[#CAE9FF] rounded-2xl shadow-2xl p-8">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center gap-3 mb-2">
            <h1 class="text-4xl text-[#1B4965] font-serif tracking-wide">{{ $t('login.title') }}</h1>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-[#1B4965]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <template v-if="!isLogin">
            <div class="space-y-1">
              <label class="block text-sm text-[#1B4965]">{{ $t('login.name') }}</label>
              <input v-model="form.name" type="text" required
                class="w-full border border-[#5FA8D3] rounded-md px-3 py-2 text-[#1B4965] bg-white focus:outline-none focus:ring-2 focus:ring-[#62B6CB]" />
            </div>
            <div class="space-y-1">
              <label class="block text-sm text-[#1B4965]">{{ $t('login.surname') }}</label>
              <input v-model="form.surname" type="text" required
                class="w-full border border-[#5FA8D3] rounded-md px-3 py-2 text-[#1B4965] bg-white focus:outline-none focus:ring-2 focus:ring-[#62B6CB]" />
            </div>
          </template>

          <div class="space-y-1">
            <label class="block text-sm text-[#1B4965]">{{ $t('login.email') }}</label>
            <input v-model="form.email" type="email" required
              class="w-full border border-[#5FA8D3] rounded-md px-3 py-2 text-[#1B4965] bg-white focus:outline-none focus:ring-2 focus:ring-[#62B6CB]" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm text-[#1B4965]">{{ $t('login.password') }}</label>
            <input v-model="form.password" type="password" required
              class="w-full border border-[#5FA8D3] rounded-md px-3 py-2 text-[#1B4965] bg-white focus:outline-none focus:ring-2 focus:ring-[#62B6CB]" />
          </div>

          <div v-if="!isLogin" class="space-y-1">
            <label class="block text-sm text-[#1B4965]">{{ $t('login.confirm_password') }}</label>
            <input v-model="form.confirmPassword" type="password" required
              class="w-full border border-[#5FA8D3] rounded-md px-3 py-2 text-[#1B4965] bg-white focus:outline-none focus:ring-2 focus:ring-[#62B6CB]" />
          </div>

          <button type="submit"
            class="w-full mt-6 bg-[#5FA8D3] hover:bg-[#62B6CB] text-white font-medium py-2 px-4 rounded-md transition-colors">
            {{ isLogin ? $t('login.login_button') : $t('login.register_button') }}
          </button>
        </form>

        <!-- Toggle login/register -->
        <div class="mt-6 text-center">
          <p class="text-[#1B4965] mb-3">
            {{ isLogin ? $t('login.no_account') : $t('login.has_account') }}
          </p>
          <button @click="isLogin = !isLogin"
            class="bg-[#5FA8D3] hover:bg-[#62B6CB] text-white font-medium py-2 px-6 rounded-md transition-colors">
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
      form: {
        name: '',
        surname: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
    }
  },
  methods: {
    handleSubmit() {
      this.$router.push('/dashboard')
    },
  },
}
</script>
