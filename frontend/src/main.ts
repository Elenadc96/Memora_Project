import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import installI18n from './i18n'
import './assets/main.css'
import axios from 'axios'
import { useAuthStore } from './stores/auth'
import Swal from 'sweetalert2'
import { i18next } from './i18n'

const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
})

axios.defaults.withCredentials = true

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
app.use(router)
installI18n(app)
app.mount('#app')

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.user = null
      Toast.fire({
        icon: 'warning',
        title: i18next.t('session.expired_title'),
        text:  i18next.t('session.expired_text'),
      })
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
