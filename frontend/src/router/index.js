// Configurazione di Vue Router.
// Il router gestisce la navigazione lato client: cambia il componente
// visualizzato senza ricaricare la pagina e aggiorna l'URL del browser.

import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

// LoginView è importato in modo statico perché è la prima pagina che l'utente
// vede: deve essere disponibile immediatamente, senza caricamento asincrono.
// Tutte le altre view usano import() dinamico (lazy loading): il loro codice
// viene scaricato solo quando l'utente naviga verso quella rotta, riducendo
// le dimensioni del bundle iniziale.
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login',     name: 'Login',     component: LoginView },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/ranking',   name: 'Ranking',   component: () => import('../views/RankingView.vue') },
  { path: '/settings',  name: 'Settings',  component: () => import('../views/SettingsView.vue') },
  // :id è un parametro dinamico — es. /subject/matematica
  // accessibile nel componente con this.$route.params.id
  { path: '/subject/:id', name: 'Subject', component: () => import('../views/SubjectView.vue') },
]

// createWebHistory usa l'History API del browser (URL puliti, senza #).
// Richiede che il server in produzione rimandi sempre index.html per tutte
// le rotte non-API — vedi il commento in backend/app.js.
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
