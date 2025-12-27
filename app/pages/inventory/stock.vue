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
            @click="openMovementsModal(item)"
            class="card bg-base-200 hover:bg-base-300 transition-all cursor-pointer"
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

              <!-- Click hint -->
              <div class="text-xs text-base-content/40 mt-2 text-center">
                Klik untuk lihat riwayat
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
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredStocks"
                :key="item.id"
                class="hover cursor-pointer"
                @click="openMovementsModal(item)"
              >
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
                <td class="text-center">
                  <button class="btn btn-ghost btn-xs" @click.stop="openMovementsModal(item)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Riwayat
                  </button>
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

    <!-- Stock Movements Modal -->
    <dialog class="modal" :class="{ 'modal-open': showMovementsModal }">
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-lg mb-2">Riwayat Pergerakan Stok</h3>
        <p v-if="selectedItem" class="text-sm text-base-content/60 mb-4">
          {{ selectedItem.product.name }} ({{ selectedItem.product.sku }})
        </p>

        <div v-if="loadingMovements" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!movements?.length" class="text-center py-8 text-base-content/60">
          <svg
            class="w-12 h-12 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>Belum ada riwayat pergerakan stok</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th class="text-right">Qty</th>
                <th>Referensi</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mov in movements" :key="mov.id">
                <td class="text-sm">{{ formatDate(mov.createdAt) }}</td>
                <td>
                  <span class="badge badge-sm" :class="getMovementTypeClass(mov.type)">
                    {{ getMovementTypeLabel(mov.type) }}
                  </span>
                </td>
                <td
                  class="text-right font-mono"
                  :class="mov.quantity > 0 ? 'text-success' : 'text-error'"
                >
                  {{ mov.quantity > 0 ? '+' : '' }}{{ mov.quantity }}
                </td>
                <td class="text-sm">
                  <span v-if="mov.reference" class="font-mono text-xs">{{ mov.reference }}</span>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td class="text-sm text-base-content/60 max-w-xs truncate">
                  {{ mov.notes || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showMovementsModal = false">Tutup</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showMovementsModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { formatDate } = useFormatter()

const page = ref(1)
// Default to GRID on mobile, LIST on desktop
const viewMode = ref<'LIST' | 'GRID'>(
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'GRID' : 'LIST'
)
const search = ref('')

// Modal state
const showMovementsModal = ref(false)
const selectedItem = ref<any>(null)
const movements = ref<any[]>([])
const loadingMovements = ref(false)

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

// Movement type helpers
const getMovementTypeClass = (type: string) => {
  switch (type) {
    case 'IN':
    case 'PURCHASE':
      return 'badge-success'
    case 'OUT':
    case 'DEDUCT':
      return 'badge-error'
    case 'RESERVE':
      return 'badge-warning'
    case 'RELEASE':
      return 'badge-info'
    case 'RETURN':
    case 'RETURN_PENDING':
      return 'badge-info'
    case 'ADJUSTMENT':
      return 'badge-ghost'
    default:
      return 'badge-ghost'
  }
}

const getMovementTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    IN: 'Masuk',
    OUT: 'Keluar',
    PURCHASE: 'Pembelian',
    DEDUCT: 'Pemakaian',
    RESERVE: 'Reserve',
    RELEASE: 'Lepas Reserve',
    RETURN: 'Retur',
    RETURN_PENDING: 'Retur (Pending)',
    ADJUSTMENT: 'Penyesuaian',
  }
  return labels[type] || type
}

// Open movements modal
async function openMovementsModal(item: any) {
  selectedItem.value = item
  showMovementsModal.value = true
  loadingMovements.value = true
  movements.value = []

  try {
    const response = await $fetch<{ data: any[] }>('/api/inventory/movements', {
      query: { productId: item.product.id, limit: 50 },
    })
    movements.value = response?.data || []
  } catch (error) {
    console.error('Error loading movements:', error)
  } finally {
    loadingMovements.value = false
  }
}
</script>
