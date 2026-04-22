<template>
  <div id="app">
    <h1>Memora</h1>
    <div v-if="loading" class="status loading">Connessione al backend...</div>
    <div v-else-if="connected" class="status ok">Backend connesso ✓</div>
    <div v-else class="status error">Backend non raggiungibile ✗</div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'App',
  data() {
    return {
      loading: true,
      connected: false
    }
  },
  async mounted() {
    try {
      await axios.get('/api/status')
      this.connected = true
    } catch {
      this.connected = false
    } finally {
      this.loading = false
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.status {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
}
.loading { background: #f0f0f0; color: #666; }
.ok      { background: #d4edda; color: #155724; }
.error   { background: #f8d7da; color: #721c24; }
</style>
