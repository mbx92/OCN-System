<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Katalog Produk & Jasa</h1>
        <p class="text-base-content/60">Daftar produk dan layanan dengan harga jual</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/catalog/supplier" class="btn btn-outline btn-info gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Katalog Supplier
        </NuxtLink>
      </div>
    </div>

    <!-- Summary (di atas filter) -->
    <div class="stats bg-base-100 shadow w-full">
      <div class="stat">
        <div class="stat-title">Total Item</div>
        <div class="stat-value text-primary">{{ totalAll }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Produk</div>
        <div class="stat-value">{{ totalProductCount }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Jasa</div>
        <div class="stat-value">{{ totalServiceCount }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="form-control flex-1">
            <div class="input-group">
              <input
                v-model="search"
                type="text"
                placeholder="Cari produk atau jasa..."
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <!-- Category Filter -->
          <div class="form-control w-full sm:w-48">
            <select v-model="selectedCategory" class="select select-bordered w-full">
              <option value="">Semua Kategori</option>
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <!-- Type Filter -->
          <div class="form-control w-full sm:w-40">
            <select v-model="selectedType" class="select select-bordered w-full">
              <option value="">Semua Tipe</option>
              <option value="PRODUCT">Produk</option>
              <option value="SERVICE">Jasa</option>
            </select>
          </div>

          <!-- View Toggle -->
          <AppViewToggle v-model="viewMode" />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Grid View -->
    <div
      v-else-if="viewMode === 'GRID'"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="product in paginatedProducts"
        :key="product.id"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow"
      >
        <div class="card-body p-4">
          <!-- Type Badge -->
          <div class="flex justify-between items-start">
            <span
              class="badge badge-sm"
              :class="isService(product) ? 'badge-secondary' : 'badge-primary'"
            >
              {{ isService(product) ? 'Jasa' : 'Produk' }}
            </span>
            <span class="badge badge-ghost badge-sm">{{ product.category }}</span>
          </div>

          <!-- Name -->
          <h3 class="font-bold text-lg mt-2 line-clamp-2">{{ product.name }}</h3>

          <!-- SKU -->
          <p class="text-sm text-base-content/60">SKU: {{ product.sku }}</p>

          <!-- Price -->
          <div class="mt-3">
            <div class="text-xl font-bold text-primary">
              {{ formatCurrency(product.sellingPrice) }}
            </div>
            <div class="text-xs text-base-content/50">per {{ product.unit || 'pcs' }}</div>
          </div>

          <!-- Stock (for products only) -->
          <div v-if="product.type === 'PRODUCT'" class="mt-2">
            <div class="flex items-center gap-2">
              <span
                class="badge badge-sm"
                :class="getStockBadgeClass(product.stock?.available || 0)"
              >
                {{ product.stock?.available || 0 }} {{ product.unit || 'pcs' }}
              </span>
              <span class="text-xs text-base-content/60">tersedia</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="paginatedProducts.length === 0" class="col-span-full">
        <div class="text-center py-12 text-base-content/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 mx-auto mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p>Tidak ada produk ditemukan</p>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="card bg-base-100 shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nama</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th class="text-right">Harga Jual</th>
              <th class="text-center">Unit</th>
              <th class="text-center">Stok</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in paginatedProducts" :key="product.id" class="hover">
              <td class="font-mono text-sm">{{ product.sku }}</td>
              <td>
                <div class="font-medium">{{ product.name }}</div>
              </td>
              <td>
                <span
                  class="badge badge-sm"
                  :class="isService(product) ? 'badge-secondary' : 'badge-primary'"
                >
                  {{ isService(product) ? 'Jasa' : 'Produk' }}
                </span>
              </td>
              <td>{{ product.category }}</td>
              <td class="text-right font-mono font-bold text-primary">
                {{ formatCurrency(product.sellingPrice) }}
              </td>
              <td class="text-center">{{ product.unit || 'pcs' }}</td>
              <td class="text-center">
                <span
                  v-if="!isService(product)"
                  class="badge badge-sm"
                  :class="getStockBadgeClass(product.stock?.available || 0)"
                >
                  {{ product.stock?.available || 0 }}
                </span>
                <span v-else class="text-base-content/40">-</span>
              </td>
            </tr>
            <tr v-if="paginatedProducts.length === 0">
              <td colspan="7" class="text-center py-8 text-base-content/60">
                Tidak ada produk ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <AppPagination :total="totalFiltered" :per-page="perPage" v-model:current-page="page" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency } = useFormatter()

const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const selectedCategory = ref('')
const selectedType = ref('')
const viewMode = ref<'GRID' | 'LIST'>('GRID')
const page = ref(1)
const perPage = 20

// Fetch products
const { data: productsData, pending } = await useFetch('/api/products', {
  query: { limit: 1000 }, // Get all products
})

const products = computed(() => productsData.value?.data || [])

// Get unique categories
const categories = computed(() => {
  const cats = [...new Set(products.value.map((p: any) => p.category))]
  return cats.filter(Boolean).sort()
})

// Filter products
const filteredProducts = computed(() => {
  let result = products.value

  // Search filter
  if (debouncedSearch.value) {
    const searchLower = debouncedSearch.value.toLowerCase()
    result = result.filter(
      (p: any) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower)
    )
  }

  // Category filter
  if (selectedCategory.value) {
    result = result.filter((p: any) => p.category === selectedCategory.value)
  }

  // Type filter (detect service from category or type)
  if (selectedType.value === 'SERVICE') {
    result = result.filter((p: any) => isServiceProduct(p))
  } else if (selectedType.value === 'PRODUCT') {
    result = result.filter((p: any) => !isServiceProduct(p))
  }

  return result
})

// Pagination
const totalFiltered = computed(() => filteredProducts.value.length)
const totalAll = computed(() => products.value.length)
const totalPages = computed(() => Math.ceil(totalFiltered.value / perPage))

const paginatedProducts = computed(() => {
  const start = (page.value - 1) * perPage
  const end = start + perPage
  return filteredProducts.value.slice(start, end)
})

// Reset page when filters change
watch([debouncedSearch, selectedCategory, selectedType], () => {
  page.value = 1
})

// Helper function to detect if product is a service (by type or category)
const isServiceProduct = (p: any) => {
  if (p.type === 'SERVICE') return true
  const cat = (p.category || '').toLowerCase()
  return cat === 'jasa' || cat === 'service'
}

// Helper for template
const isService = (p: any) => isServiceProduct(p)

// Total Counts (non-reactive to search/filter)
const totalProductCount = computed(
  () => products.value.filter((p: any) => !isServiceProduct(p)).length
)
const totalServiceCount = computed(
  () => products.value.filter((p: any) => isServiceProduct(p)).length
)

// Stock badge class
const getStockBadgeClass = (stock: number) => {
  if (stock <= 0) return 'badge-error'
  if (stock <= 5) return 'badge-warning'
  return 'badge-success'
}
</script>
