<template>
  <div class="relative" ref="containerRef">
    <div class="relative">
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="input input-bordered w-full pr-10"
        :required="required"
        @focus="isOpen = true"
        @input="handleInput"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="closeDropdown"
        autocomplete="off"
      />
      <div
        v-if="selectedCustomer"
        class="absolute right-3 top-3 cursor-pointer"
        @click="clearSelection"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-base-content/50 hover:text-error"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div v-else class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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
      v-show="isOpen && filteredCustomers.length > 0"
      class="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-auto"
    >
      <div
        v-for="(customer, index) in filteredCustomers"
        :key="customer.id"
        @click="selectCustomer(customer)"
        @mouseenter="highlightedIndex = index"
        :class="[
          'px-4 py-2 cursor-pointer transition-colors',
          highlightedIndex === index ? 'bg-primary text-primary-content' : 'hover:bg-base-200',
        ]"
      >
        <div class="font-medium">{{ customer.name }}</div>
        <div v-if="customer.companyName" class="text-xs opacity-70">
          {{ customer.companyName }}
        </div>
        <div v-if="customer.phone || customer.email" class="text-xs opacity-60 mt-0.5">
          {{ customer.phone || customer.email }}
        </div>
      </div>
    </div>

    <!-- No results -->
    <div
      v-show="isOpen && searchQuery && filteredCustomers.length === 0"
      class="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg px-4 py-3 text-base-content/60 text-sm"
    >
      Tidak ada customer ditemukan
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pilih Customer...',
  required: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', customer: any): void
}>()

const searchQuery = ref('')
const isOpen = ref(false)
const highlightedIndex = ref(0)
const containerRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const selectedCustomer = ref<any>(null)

// Fetch all customers
const { data: customersData } = await useFetch('/api/customers', {
  query: { limit: 1000 },
})
const customers = computed(() => (customersData.value as any)?.data || [])

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value

  const query = searchQuery.value.toLowerCase()
  return customers.value.filter((customer: any) => {
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.companyName?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    )
  })
})

// Update search query when modelValue changes externally
watch(
  () => props.modelValue,
  async newValue => {
    if (newValue) {
      const customer = customers.value.find((c: any) => c.id === newValue)
      if (customer) {
        selectedCustomer.value = customer
        searchQuery.value = customer.companyName
          ? `${customer.name} (${customer.companyName})`
          : customer.name
      }
    } else {
      selectedCustomer.value = null
      searchQuery.value = ''
    }
  },
  { immediate: true }
)

// Reset highlighted index when filtered customers change
watch(filteredCustomers, () => {
  highlightedIndex.value = 0
})

const handleInput = () => {
  isOpen.value = true
  highlightedIndex.value = 0

  // If search query is empty, clear selection
  if (!searchQuery.value) {
    selectedCustomer.value = null
    emit('update:modelValue', '')
  }
}

const selectCustomer = (customer: any) => {
  selectedCustomer.value = customer
  emit('update:modelValue', customer.id)
  emit('select', customer)
  searchQuery.value = customer.companyName
    ? `${customer.name} (${customer.companyName})`
    : customer.name
  isOpen.value = false
}

const clearSelection = () => {
  selectedCustomer.value = null
  searchQuery.value = ''
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

const selectHighlighted = () => {
  if (filteredCustomers.value.length > 0) {
    selectCustomer(filteredCustomers.value[highlightedIndex.value])
  }
}

const navigateDown = () => {
  if (highlightedIndex.value < filteredCustomers.value.length - 1) {
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
  if (selectedCustomer.value) {
    searchQuery.value = selectedCustomer.value.companyName
      ? `${selectedCustomer.value.name} (${selectedCustomer.value.companyName})`
      : selectedCustomer.value.name
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
