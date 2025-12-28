<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency } = useFormatter()

// Filters
const selectedCategory = ref('')
const selectedType = ref('')
const stockStatus = ref<'all' | 'low' | 'out'>('all')

// Data
const loading = ref(false)
const products = ref<any[]>([])
const stocks = ref<any[]>([])

const summary = ref({
  totalProducts: 0,
  totalValue: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
})

// Load data
async function loadInventoryReport() {
  loading.value = true
  try {
    // Load products
    const { data: productsData } = await useFetch('/api/products', {
      query: { limit: 1000 },
    })

    if (productsData.value) {
      products.value = productsData.value.data || []
    }

    // Load stocks
    const { data: stocksData } = await useFetch('/api/inventory/stock', {
      query: { limit: 1000 },
    })

    if (stocksData.value) {
      stocks.value = stocksData.value.data || []
    }

    calculateSummary()
  } catch (error: any) {
    console.error('Error loading inventory report:', error)
    const { showAlert } = useAlert()
    showAlert('Gagal memuat laporan inventory', 'error')
  } finally {
    loading.value = false
  }
}

function calculateSummary() {
  summary.value.totalProducts = products.value.length

  // Calculate total inventory value
  summary.value.totalValue = stocks.value.reduce((sum, stock) => {
    const product = products.value.find(p => p.id === stock.productId)
    if (product && product.purchasePrice) {
      return sum + stock.available * product.purchasePrice
    }
    return sum
  }, 0)

  // Count low stock items
  summary.value.lowStockItems = stocks.value.filter(stock => {
    const product = products.value.find(p => p.id === stock.productId)
    return product && product.minStock && stock.available <= product.minStock && stock.available > 0
  }).length

  // Count out of stock items
  summary.value.outOfStockItems = stocks.value.filter(stock => stock.available <= 0).length
}

// Filtered products
const filteredProducts = computed(() => {
  let filtered = products.value

  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter(p => p.category === selectedCategory.value)
  }

  // Filter by type
  if (selectedType.value) {
    filtered = filtered.filter(p => p.type === selectedType.value)
  }

  // Filter by stock status
  if (stockStatus.value !== 'all') {
    filtered = filtered.filter(p => {
      const stock = stocks.value.find(s => s.productId === p.id)
      if (!stock) return false

      if (stockStatus.value === 'out') {
        return stock.available <= 0
      } else if (stockStatus.value === 'low') {
        return p.minStock && stock.available <= p.minStock && stock.available > 0
      }
      return true
    })
  }

  return filtered
})

// Get unique categories
const categories = computed(() => {
  const cats = new Set(products.value.map(p => p.category).filter(c => c))
  return Array.from(cats).sort()
})

// Get stock for product
function getStock(productId: string) {
  return stocks.value.find(s => s.productId === productId)
}

// Get stock status
function getStockStatus(product: any, stock: any) {
  if (!stock || stock.available <= 0) {
    return { label: 'Habis', color: 'badge-error' }
  } else if (product.minStock && stock.available <= product.minStock) {
    return { label: 'Stok Rendah', color: 'badge-warning' }
  } else {
    return { label: 'Normal', color: 'badge-success' }
  }
}

// Export to CSV
function exportToCSV() {
  const headers = [
    'SKU',
    'Nama Produk',
    'Kategori',
    'Tipe',
    'Stok Tersedia',
    'Stok Reserved',
    'Min Stok',
    'Harga Beli',
    'Harga Jual',
    'Nilai Inventory',
  ]
  const rows = filteredProducts.value.map(p => {
    const stock = getStock(p.id)
    return [
      p.sku,
      p.name,
      p.category || '-',
      p.type,
      stock?.available || 0,
      stock?.reserved || 0,
      p.minStock || '-',
      p.purchasePrice || '-',
      p.sellingPrice || '-',
      stock ? stock.available * (p.purchasePrice || 0) : 0,
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `laporan-inventory-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// Print report
function printReport() {
  window.print()
}

// Reset filters
function resetFilters() {
  selectedCategory.value = ''
  selectedType.value = ''
  stockStatus.value = 'all'
}

// Init
onMounted(() => {
  loadInventoryReport()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center print:hidden">
      <div>
        <h1 class="text-2xl font-bold">Laporan Inventory</h1>
        <p class="text-base-content/60">Status stok dan nilai inventory</p>
      </div>
      <div class="flex gap-2">
        <button @click="exportToCSV" class="btn btn-ghost btn-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </button>
        <button @click="printReport" class="btn btn-ghost btn-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-sm print:hidden">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Kategori</span>
            </label>
            <select v-model="selectedCategory" class="select select-bordered w-full">
              <option value="">Semua Kategori</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Tipe Produk</span>
            </label>
            <select v-model="selectedType" class="select select-bordered w-full">
              <option value="">Semua Tipe</option>
              <option value="PRODUCT">Produk</option>
              <option value="SERVICE">Jasa</option>
              <option value="MATERIAL">Material</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Status Stok</span>
            </label>
            <select v-model="stockStatus" class="select select-bordered w-full">
              <option value="all">Semua</option>
              <option value="low">Stok Rendah</option>
              <option value="out">Habis</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-base-content/60">Total Produk</div>
            <div class="text-3xl font-bold">{{ summary.totalProducts }}</div>
          </div>
        </div>

        <div class="card bg-primary/10 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-primary/80">Nilai Inventory</div>
            <div class="text-3xl font-bold text-primary">
              {{ formatCurrency(summary.totalValue) }}
            </div>
          </div>
        </div>

        <div class="card bg-warning/10 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-warning/80">Stok Rendah</div>
            <div class="text-3xl font-bold text-warning">{{ summary.lowStockItems }}</div>
          </div>
        </div>

        <div class="card bg-error/10 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-error/80">Habis</div>
            <div class="text-3xl font-bold text-error">{{ summary.outOfStockItems }}</div>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Tipe</th>
                  <th class="text-center">Tersedia</th>
                  <th class="text-center">Reserved</th>
                  <th class="text-center">Min Stok</th>
                  <th class="text-right">Harga Beli</th>
                  <th class="text-right">Harga Jual</th>
                  <th class="text-right">Nilai</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredProducts.length === 0">
                  <td colspan="11" class="text-center py-8 text-base-content/60">
                    Tidak ada data produk
                  </td>
                </tr>
                <tr v-for="product in filteredProducts" :key="product.id">
                  <td class="font-mono text-sm">{{ product.sku }}</td>
                  <td>
                    <div class="font-medium">{{ product.name }}</div>
                  </td>
                  <td>{{ product.category || '-' }}</td>
                  <td>
                    <span class="badge badge-sm badge-ghost">{{ product.type }}</span>
                  </td>
                  <td class="text-center">
                    {{ getStock(product.id)?.available || 0 }}
                  </td>
                  <td class="text-center">
                    {{ getStock(product.id)?.reserved || 0 }}
                  </td>
                  <td class="text-center">
                    {{ product.minStock || '-' }}
                  </td>
                  <td class="text-right">
                    <span v-if="product.purchasePrice">
                      {{ formatCurrency(product.purchasePrice) }}
                    </span>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                  <td class="text-right">
                    <span v-if="product.sellingPrice">
                      {{ formatCurrency(product.sellingPrice) }}
                    </span>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                  <td class="text-right font-medium">
                    {{
                      formatCurrency(
                        (getStock(product.id)?.available || 0) * (product.purchasePrice || 0)
                      )
                    }}
                  </td>
                  <td>
                    <span
                      class="badge badge-sm"
                      :class="getStockStatus(product, getStock(product.id)).color"
                    >
                      {{ getStockStatus(product, getStock(product.id)).label }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="font-bold">
                  <td colspan="9" class="text-right">Total Nilai Inventory:</td>
                  <td class="text-right">
                    {{
                      formatCurrency(
                        filteredProducts.reduce((sum, p) => {
                          const stock = getStock(p.id)
                          return sum + (stock?.available || 0) * (p.purchasePrice || 0)
                        }, 0)
                      )
                    }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@media print {
  .print\:hidden {
    display: none !important;
  }
}
</style>
