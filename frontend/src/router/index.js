import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('../views/RankingView.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
  },
  {
    path: '/subject/:id',
    name: 'Subject',
    component: () => import('../views/SubjectView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
