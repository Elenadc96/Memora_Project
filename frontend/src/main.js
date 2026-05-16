// Punto di ingresso dell'app Vue.
// L'ordine degli .use() è importante: Pinia deve essere registrato prima
// del router, perché le navigation guard del router possono accedere agli store.

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import installI18n from './i18n'
import './assets/main.css'   // Tailwind + design tokens CSS

// Crea l'istanza Pinia e aggiunge il plugin che salva lo stato in localStorage.
// Ogni store che ha `persist: true` sopravvive al refresh della pagina.
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
app.use(router)
installI18n(app)   // registra $t() globalmente su tutti i componenti
app.mount('#app')
