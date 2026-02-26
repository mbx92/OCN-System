<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Katalog Supplier</h1>
        <p class="text-base-content/60">Daftar produk dari supplier (PL Tunas Jaya Elektronik)</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/catalog" class="btn btn-ghost gap-2">
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali
        </NuxtLink>
        <button @click="refreshData" class="btn btn-outline btn-primary gap-2" :disabled="pending">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            :class="{ 'animate-spin': pending }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div class="stats bg-base-100 shadow w-full">
      <div class="stat">
        <div class="stat-title">Total Produk</div>
        <div class="stat-value text-primary">{{ pagination?.total || 0 }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Brand/Merk</div>
        <div class="stat-value">{{ brands?.length || 0 }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Kategori</div>
        <div class="stat-value">{{ categories?.length || 0 }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="form-control flex-1">
            <input
              v-model="search"
              type="text"
              placeholder="Cari produk, SKU, atau brand..."
              class="input input-bordered w-full"
            />
          </div>

          <!-- Brand Filter -->
          <div class="form-control w-full sm:w-48">
            <select v-model="selectedBrand" class="select select-bordered w-full">
              <option value="">Semua Brand</option>
              <option v-for="b in brands" :key="b" :value="b">
                {{ b }}
              </option>
            </select>
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

          <!-- View Toggle -->
          <AppViewToggle v-model="viewMode" />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>{{ error.message || 'Gagal memuat katalog supplier' }}</span>
      <button @click="refreshData" class="btn btn-sm btn-ghost">Coba Lagi</button>
    </div>

    <!-- Grid View -->
    <div
      v-else-if="viewMode === 'GRID'"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="product in products"
        :key="product.sku"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow"
      >
        <div class="card-body p-4">
          <!-- Brand & Category Badge -->
          <div class="flex justify-between items-start gap-2">
            <span class="badge badge-primary badge-sm">{{ product.brand }}</span>
            <span class="badge badge-ghost badge-sm truncate">{{ product.category }}</span>
          </div>

          <!-- Name -->
          <h3 class="font-bold text-lg mt-2 line-clamp-2">{{ product.name }}</h3>

          <!-- SKU -->
          <p class="text-sm text-base-content/60 font-mono">{{ product.sku }}</p>

          <!-- Price -->
          <div class="mt-3">
            <div class="text-xl font-bold text-primary">
              {{ formatCurrency(product.price) }}
            </div>
            <div class="text-xs text-base-content/50">per {{ product.unit || 'pcs' }}</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="products.length === 0" class="col-span-full">
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
              <th>Brand</th>
              <th>Kategori</th>
              <th class="text-right">Harga</th>
              <th class="text-center">Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.sku" class="hover">
              <td class="font-mono text-sm">{{ product.sku }}</td>
              <td>
                <div class="font-medium">{{ product.name }}</div>
              </td>
              <td>
                <span class="badge badge-primary badge-sm">{{ product.brand }}</span>
              </td>
              <td>{{ product.category }}</td>
              <td class="text-right font-mono font-bold text-primary">
                {{ formatCurrency(product.price) }}
              </td>
              <td class="text-center">{{ product.unit || 'pcs' }}</td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="6" class="text-center py-8 text-base-content/60">
                Tidak ada produk ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.totalPages > 1" class="flex justify-center">
      <AppPagination
        :total="pagination.total"
        :per-page="pagination.limit"
        v-model:current-page="page"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency } = useFormatter()

const search = ref('')
const debouncedSearch = refDebounced(search, 500)
const selectedCategory = ref('')
const selectedBrand = ref('')
const viewMode = ref<'GRID' | 'LIST'>('GRID')
const page = ref(1)
const perPage = 50

// Fetch supplier catalog
const {
  data: catalogData,
  pending,
  error,
  refresh,
} = await useFetch('/api/catalog/supplier', {
  query: computed(() => ({
    search: debouncedSearch.value,
    category: selectedCategory.value,
    brand: selectedBrand.value,
    page: page.value,
    limit: perPage,
  })),
})

const products = computed(() => catalogData.value?.data || [])
const categories = computed(() => catalogData.value?.categories || [])
const brands = computed(() => catalogData.value?.brands || [])
const pagination = computed(() => catalogData.value?.pagination)

// Reset page when filters change
watch([debouncedSearch, selectedCategory, selectedBrand], () => {
  page.value = 1
})

// Refresh data
const refreshData = async () => {
  await refresh()
}
</script>
