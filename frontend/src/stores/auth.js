// Store Pinia per l'autenticazione.
// Gestisce chi è loggato e il token JWT ricevuto dal backend.
// Con `persist: true` i dati sopravvivono al refresh: l'utente
// non deve rifare il login ogni volta che riapre la pagina.

import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,    // oggetto utente: { id, name, lastName, email } — specchio di utenti nel DB
    token: null,   // token JWT ricevuto dal backend al momento del login
  }),

  getters: {
    // !! converte user in booleano: null → false, oggetto → true
    isAuthenticated: (state) => !!state.user,

    // Comodo per mostrare "Ciao, Elena Di Cicco" in sidebar o header
    fullName: (state) => state.user
      ? `${state.user.name} ${state.user.lastName}`
      : '',
  },

  actions: {
    async login({ email, password }) {
      const { data } = await axios.post('/api/auth/login', { email, password })
      this.user  = data.user
      this.token = data.token
      // Aggiunge l'header Authorization su tutte le chiamate axios successive,
      // così ogni richiesta al backend è autenticata automaticamente.
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    },

    async register({ name, lastName, email, password }) {
      const { data } = await axios.post('/api/auth/register', { name, lastName, email, password })
      this.user  = data.user
      this.token = data.token
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    },

    logout() {
      this.user  = null
      this.token = null
      // Rimuove l'header: le chiamate successive non saranno più autenticate
      delete axios.defaults.headers.common['Authorization']
    },
  },

  // Salva automaticamente user e token in localStorage.
  // Al prossimo avvio Pinia li ripristina senza bisogno di rifare il login.
  persist: true,
})
