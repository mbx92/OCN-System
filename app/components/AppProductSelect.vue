<template>
  <div class="dropdown w-full" :class="{ 'dropdown-open': isOpen }">
    <div class="form-control">
      <div class="relative">
        <input
          ref="inputRef"
          type="text"
          v-model="searchQuery"
          class="input input-bordered w-full pr-10"
          :placeholder="placeholder"
          @focus="onFocus"
          @input="onInput"
          @blur="onBlur"
        />
        <div v-if="loading" class="absolute right-3 top-3">
          <span class="loading loading-spinner loading-xs text-base-content/50"></span>
        </div>
        <div
          v-else-if="selectedProduct"
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
      </div>
    </div>
    <ul
      v-if="isOpen && (results.length > 0 || loading)"
      class="absolute z-1 menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto flex-nowrap mt-1 border border-base-200"
      @mousedown.prevent
    >
      <li v-for="product in results" :key="product.id">
        <a @click="selectProduct(product)" class="flex flex-col items-start gap-0 py-2">
          <div class="flex justify-between w-full font-semibold">
            <span>{{ product.name }}</span>
            <span class="text-xs badge badge-ghost">
              {{ formatCurrency(product.sellingPrice) }}
            </span>
          </div>
          <div class="flex justify-between w-full text-xs text-base-content/60">
            <span>SKU: {{ product.sku }}</span>
            <span>Stok: {{ product.stock?.available || 0 }} {{ product.unit }}</span>
          </div>
        </a>
      </li>
      <li
        v-if="results.length === 0 && !loading && searchQuery"
        class="px-4 py-2 text-sm text-base-content/60 text-center"
      >
        Produk tidak ditemukan
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', product: any): void
  (e: 'clear'): void
}>()

const { formatCurrency } = useFormatter()

const searchQuery = ref(props.modelValue || '')
const isOpen = ref(false)
const loading = ref(false)
const results = ref<any[]>([])
const selectedProduct = ref<any>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// Watch props to update internal state if changed externally
watch(
  () => props.modelValue,
  val => {
    if (val !== searchQuery.value) {
      searchQuery.value = val || ''
    }
  }
)

const searchProducts = async (query: string) => {
  if (!query || query.length < 2) {
    results.value = []
    return
  }

  loading.value = true
  try {
    const response = await $fetch<{ data: any[]; meta: any }>('/api/products', {
      params: { search: query, limit: 50 },
    })
    results.value = response?.data || []
  } catch (err) {
    console.error('Search error:', err)
    results.value = []
  } finally {
    loading.value = false
  }
}

const debouncedSearch = useDebounceFn((query: string) => {
  searchProducts(query)
}, 300)

const onInput = () => {
  isOpen.value = true
  selectedProduct.value = null // Reset selection on manual edit
  emit('update:modelValue', searchQuery.value)
  debouncedSearch(searchQuery.value)
}

const onFocus = () => {
  if (searchQuery.value) {
    isOpen.value = true
    searchProducts(searchQuery.value)
  }
}

const onBlur = () => {
  // Delay closing to allow click event on dropdown item to fire
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}

const selectProduct = (product: any) => {
  selectedProduct.value = product
  searchQuery.value = product.name
  isOpen.value = false
  emit('update:modelValue', product.name)
  emit('select', product)
}

const clearSelection = () => {
  searchQuery.value = ''
  selectedProduct.value = null
  results.value = []
  emit('update:modelValue', '')
  emit('clear')
  if (inputRef.value) inputRef.value.focus()
}
</script>
