<!--
  BaseSelect — dropdown riusabile che sostituisce la <select> nativa.
  Il pannello nativo del browser non è stilabile in modo coerente tra i temi
  (bordi, ombra, hover, dark mode), quindi qui disegniamo noi il pannello
  aperto, riusando lo stesso pattern visivo del menu utente in AppSidebar.
  Uso: <BaseSelect v-model="value" :options="[{ value: 'a', label: 'A' }]" />
-->
<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="select-field flex items-center justify-between gap-2"
      @click.stop="toggleOpen"
    >
      <span class="truncate">{{ selectedLabel }}</span>
    </button>

    <ChevronDown
      class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-on-surface/40
             pointer-events-none transition-transform duration-200"
      :class="{ 'rotate-180': open }"
    />

    <Transition name="select-panel">
      <ul
        v-if="open"
        class="absolute left-0 right-0 mt-1 py-1 max-h-60 overflow-y-auto z-50
               bg-white dark:bg-surface border border-border rounded-xl shadow-lg"
        role="listbox"
      >
        <li
          v-for="opt in options"
          :key="opt.value"
          role="option"
          :aria-selected="opt.value === modelValue"
          class="px-4 py-2 text-sm cursor-pointer truncate text-primary dark:text-on-surface
                 hover:bg-accent/10 dark:hover:bg-white/10 transition-colors"
          :class="{ 'bg-accent/10 dark:bg-white/10 font-medium': opt.value === modelValue }"
          @click="select(opt.value)"
        >
          {{ opt.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

export interface SelectOption {
  value: string
  label: string
}

export default defineComponent({
  name: 'BaseSelect',
  components: { ChevronDown },

  props: {
    modelValue: { type: String, required: true },
    options:    { type: Array as PropType<SelectOption[]>, required: true },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      open: false,
    }
  },

  computed: {
    selectedLabel(): string {
      return this.options.find(opt => opt.value === this.modelValue)?.label ?? ''
    },
  },

  mounted(): void {
    document.addEventListener('click', this.handleOutsideClick)
    window.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount(): void {
    document.removeEventListener('click', this.handleOutsideClick)
    window.removeEventListener('keydown', this.onKeydown)
  },

  methods: {
    toggleOpen(): void {
      this.open = !this.open
    },

    select(value: string): void {
      this.$emit('update:modelValue', value)
      this.open = false
    },

    handleOutsideClick(event: MouseEvent): void {
      const root = this.$refs.rootEl as HTMLElement | undefined
      if (root && !root.contains(event.target as Node)) {
        this.open = false
      }
    },

    onKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && this.open) this.open = false
    },
  },
})
</script>

<style scoped>
.select-panel-enter-active, .select-panel-leave-active { transition: opacity 0.15s, transform 0.15s; }
.select-panel-enter-from, .select-panel-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
