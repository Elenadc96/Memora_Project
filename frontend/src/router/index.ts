import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '../views/LoginView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView, meta: { requiresGuest: true } },
  { path: '/register', name: 'Register', component: () => import('../views/RegisterView.vue'), meta: { requiresGuest: true } },
  { path: '/privacy-policy', name: 'PrivacyPolicy', component: () => import('../views/PrivacyPolicyView.vue') },

  {
    path: '/',
    component: () => import('../layouts/AuthLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue'),
      },
      {
        path: 'ranking',
        name: 'Ranking',
        component: () => import('../views/RankingView.vue'),
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/SettingsView.vue'),
      },
      {
        path: 'subject/:id',
        name: 'Subject',
        component: () => import('../views/SubjectView.vue'),
      },
      {
        path: 'subject/:id/lesson/:lessonId',
        name: 'Lesson',
        component: () => import('../views/SubjectView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 1. Se la rotta richiede autenticazione e l'utente non è loggato
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login') 
  } 
  // 2. Se l'utente è già loggato e prova ad andare al login, lo mandiamo in Dashboard
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard')
  } 
  else {
    next() 
  }
})

export default router
