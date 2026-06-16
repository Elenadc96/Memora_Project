import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import installI18n from './i18n'
import './assets/main.css'
import axios from 'axios'

axios.defaults.withCredentials = true; 
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
app.use(router)
installI18n(app)
app.mount('#app')
