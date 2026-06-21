<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useUIStore } from './stores/ui'
import { useAuthStore } from './stores/auth'

export default defineComponent({
  name: 'App',
  setup() {
    useUIStore().init()
    useAuthStore().checkSession()
  },
})
</script>
