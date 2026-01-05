<template>
  <div class="relative" ref="containerRef">
    <div class="relative">
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        :class="inputClass"
        :required="required"
        @focus="isOpen = true"
        @input="handleInput"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="closeDropdown"
        autocomplete="off"
      />
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          class="h-5 w-5 text-base-content/40"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-show="isOpen && filteredOptions.length > 0"
      class="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-auto"
    >
      <div
        v-for="(option, index) in filteredOptions"
        :key="option.value"
        @click="selectOption(option)"
        @mouseenter="highlightedIndex = index"
        :class="[
          'px-4 py-2 cursor-pointer transition-colors',
          highlightedIndex === index ? 'bg-primary text-primary-content' : 'hover:bg-base-200',
        ]"
      >
        <slot name="option" :option="option">
          {{ option.label }}
        </slot>
      </div>
    </div>

    <!-- No results -->
    <div
      v-show="isOpen && searchQuery && filteredOptions.length === 0"
      class="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg px-4 py-3 text-base-content/60 text-sm"
    >
      Tidak ada hasil ditemukan
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

interface Option {
  value: string
  label: string
  [key: string]: any
}

interface Props {
  modelValue: string
  options: Option[]
  placeholder?: string
  inputClass?: string
  required?: boolean
  searchFields?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pilih...',
  inputClass: 'input input-bordered w-full pr-10',
  required: false,
  searchFields: () => ['label'],
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const searchQuery = ref('')
const isOpen = ref(false)
const highlightedIndex = ref(0)
const containerRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options

  const query = searchQuery.value.toLowerCase()
  return props.options.filter(option => {
    // Search in multiple fields
    return props.searchFields.some(field => {
      const value = option[field]
      return value && String(value).toLowerCase().includes(query)
    })
  })
})

// Update search query when modelValue changes externally
watch(
  () => props.modelValue,
  newValue => {
    const option = props.options.find(opt => opt.value === newValue)
    if (option) {
      searchQuery.value = option.label
    } else {
      searchQuery.value = ''
    }
  },
  { immediate: true }
)

// Reset highlighted index when filtered options change
watch(filteredOptions, () => {
  highlightedIndex.value = 0
})

const handleInput = () => {
  isOpen.value = true
  highlightedIndex.value = 0

  // If search query is empty, clear selection
  if (!searchQuery.value) {
    emit('update:modelValue', '')
  }
}

const selectOption = (option: Option) => {
  emit('update:modelValue', option.value)
  searchQuery.value = option.label
  isOpen.value = false
}

const selectHighlighted = () => {
  if (filteredOptions.value.length > 0) {
    selectOption(filteredOptions.value[highlightedIndex.value])
  }
}

const navigateDown = () => {
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++
  }
}

const navigateUp = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

const closeDropdown = () => {
  isOpen.value = false

  // Restore selected value if user didn't select anything
  if (selectedOption.value) {
    searchQuery.value = selectedOption.value.label
  } else if (!props.modelValue) {
    searchQuery.value = ''
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
