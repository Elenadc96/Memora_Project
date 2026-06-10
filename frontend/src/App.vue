<template>
  <router-view />
</template>

<script>
import { useUIStore } from './stores/ui'

export default {
  name: 'App',
  setup() {
    useUIStore().init()
  },
}
</script>
