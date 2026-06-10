<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useUIStore } from './stores/ui'

export default defineComponent({
  name: 'App',
  setup() {
    useUIStore().init()
  },
})
</script>
