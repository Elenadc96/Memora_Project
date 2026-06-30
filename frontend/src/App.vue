<template>
  <router-view />
  <Toaster position="bottom-right" rich-colors close-button />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Toaster } from 'vue-sonner'
import { useUIStore } from './stores/ui'
import { useAuthStore } from './stores/auth'

export default defineComponent({
  name: 'App',
  components: { Toaster },
  setup() {
    useUIStore().init()
    useAuthStore().checkSession()
  },
})
</script>
