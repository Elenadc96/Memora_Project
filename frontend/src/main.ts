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
import { swalTheme } from './utils/notify'

const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
})

axios.defaults.withCredentials = true

// Va registrato PRIMA di app.mount(): App.vue chiama checkSession() già
// dentro il mount (vedi App.vue setup()), quindi se l'interceptor arrivasse
// dopo, quella primissima richiesta a /api/auth/me partirebbe senza di lui
// — axios "congela" gli interceptor attivi al momento in cui la richiesta
// viene lanciata, non a quello in cui la risposta arriva. Il suo catch
// locale azzererebbe silenziosamente authStore.user, rendendo "eraAutenticato"
// già falso per le richieste concorrenti successive (dashboard, materie) e
// impedendo così il redirect di sessione-scaduta.
axios.interceptors.response.use(
  response => response,
  error => {
    const authStore = useAuthStore()

    // Non ogni 401 significa "sessione scaduta": login e cambio password
    // possono rispondere 401 per un motivo del tutto normale (credenziali
    // sbagliate) e lo gestiscono già da soli con apiErrorMessage() —
    // per queste basta il flag skipAuthRedirect per non essere toccate qui.
    // Per tutte le altre chiamate, il redirect scatta solo se l'utente
    // risultava già autenticato PRIMA di questa richiesta: così un 401 su
    // /api/auth/me al primo caricamento (utente non ancora loggato) non
    // genera un redirect fantasma verso una pagina di login su cui si è già.
    const eraAutenticato = !!authStore.user
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect && eraAutenticato) {
      authStore.user = null
      Toast.fire({
        ...swalTheme(),
        icon: 'warning',
        title: i18next.t('session.expired_title'),
        text:  i18next.t('session.expired_text'),
      })
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
app.use(router)
installI18n(app)
app.mount('#app')
