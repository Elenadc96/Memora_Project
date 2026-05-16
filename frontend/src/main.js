import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import installI18n from './i18n'
import './assets/main.css'

const app = createApp(App)
app.use(router)
installI18n(app)
app.mount('#app')
