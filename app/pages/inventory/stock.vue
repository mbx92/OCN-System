<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold">Stok Barang</h1>
      <p class="text-base-content/60">Monitor stok inventori</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">Total Produk</div>
          <div class="stat-value text-primary">{{ stockData?.meta?.total || 0 }}</div>
        </div>
      </div>
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">Stok Rendah</div>
          <div class="stat-value text-warning">{{ lowStockCount }}</div>
        </div>
      </div>
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">Stok Habis</div>
          <div class="stat-value text-error">{{ outOfStockCount }}</div>
        </div>
      </div>
    </div>

    <!-- Stock List -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <!-- Search & View Toggle -->
        <div class="flex flex-col lg:flex-row gap-4 mb-4">
          <div class="flex-none">
            <AppViewToggle v-model="viewMode" />
          </div>
          <div class="flex-1">
            <div class="form-control">
              <input
                v-model="search"
                type="text"
                placeholder="Cari produk atau SKU..."
                class="input input-bordered w-full"
              />
            </div>
          </div>
        </div>

        <div v-if="pending" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!filteredStocks?.length" class="text-center py-12 text-base-content/60">
          <p class="text-lg">
            {{ search ? 'Tidak ditemukan produk yang cocok' : 'Belum ada data stok' }}
          </p>
        </div>

        <!-- Grid View -->
        <div
          v-else-if="viewMode === 'GRID'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="item in filteredStocks"
            :key="item.id"
            class="card bg-base-200 hover:bg-base-300 transition-all"
          >
            <div class="card-body p-4">
              <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                  <h3 class="font-bold">{{ item.product.name }}</h3>
                  <p class="text-xs text-base-content/60 font-mono">{{ item.product.sku }}</p>
                </div>
                <span class="badge badge-sm" :class="getStatusClass(item)">
                  {{ getStatusLabel(item) }}
                </span>
              </div>

              <div class="space-y-2 text-sm">
                <!-- Quantity -->
                <div class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span class="flex-1">Total Qty</span>
                  <span class="font-mono font-bold">{{ item.quantity }}</span>
                </div>

                <!-- Reserved -->
                <div class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"
                    />
                  </svg>
                  <span class="flex-1">Reserved</span>
                  <span class="font-mono text-warning">{{ item.reserved }}</span>
                </div>

                <!-- Available -->
                <div class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                    />
                  </svg>
                  <span class="flex-1">Available</span>
                  <span
                    class="font-mono font-bold"
                    :class="item.available <= 0 ? 'text-error' : 'text-success'"
                  >
                    {{ item.available }}
                  </span>
                </div>

                <!-- Min Stock -->
                <div class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span class="flex-1">Min. Stock</span>
                  <span class="font-mono">{{ item.product.minStock || 5 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Produk</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Reserved</th>
                <th class="text-right">Available</th>
                <th class="text-right">Min. Stok</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredStocks" :key="item.id" class="hover">
                <td>
                  <div class="font-bold">{{ item.product.name }}</div>
                  <div class="text-xs text-base-content/60">{{ item.product.sku }}</div>
                </td>
                <td class="text-right font-mono">{{ item.quantity }}</td>
                <td class="text-right font-mono text-warning">{{ item.reserved }}</td>
                <td class="text-right font-mono font-bold">{{ item.available }}</td>
                <td class="text-right font-mono">{{ item.product.minStock || 5 }}</td>
                <td>
                  <span class="badge badge-sm" :class="getStatusClass(item)">
                    {{ getStatusLabel(item) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="stockData?.meta?.total" class="border-t border-base-200 mt-4 pt-4">
          <AppPagination :total="stockData.meta.total" :per-page="10" v-model:current-page="page" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const page = ref(1)
// Default to GRID on mobile, LIST on desktop
const viewMode = ref<'LIST' | 'GRID'>(
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'GRID' : 'LIST'
)
const search = ref('')

const { data: stockData, pending } = await useFetch('/api/inventory/stock', {
  query: { page, limit: 10 },
  watch: [page],
})

const stocks = computed(() => stockData.value?.data || [])

// Filtered stocks based on search
const filteredStocks = computed(() => {
  if (!search.value) return stocks.value
  const term = search.value.toLowerCase()
  return stocks.value.filter(
    (item: any) =>
      item.product.name.toLowerCase().includes(term) ||
      item.product.sku.toLowerCase().includes(term)
  )
})

const lowStockCount = computed(() => {
  if (!stocks.value) return 0
  return stocks.value.filter(
    (s: any) => s.available > 0 && s.available <= (s.product.minStock || 5)
  ).length
})

const outOfStockCount = computed(() => {
  if (!stocks.value) return 0
  return stocks.value.filter((s: any) => s.available <= 0).length
})

const getStatusClass = (item: any) => {
  if (item.available <= 0) return 'badge-error'
  if (item.available <= (item.product.minStock || 5)) return 'badge-warning'
  return 'badge-success'
}

const getStatusLabel = (item: any) => {
  if (item.available <= 0) return 'Habis'
  if (item.available <= (item.product.minStock || 5)) return 'Rendah'
  return 'OK'
}
</script>
