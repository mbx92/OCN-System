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
      <div class="card-body p-0">
        <div class="overflow-x-auto">
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
              <tr v-if="pending" class="text-center">
                <td colspan="6" class="py-8">
                  <span class="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
              <tr v-else-if="!stocks?.length" class="text-center">
                <td colspan="6" class="py-12 text-base-content/60">
                  <p class="text-lg">Belum ada data stok</p>
                </td>
              </tr>
              <tr v-for="item in stocks" :key="item.id" class="hover">
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
        <div v-if="stockData?.meta?.total" class="p-4 border-t border-base-200">
          <AppPagination :total="stockData.meta.total" :per-page="10" v-model:current-page="page" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const page = ref(1)

const { data: stockData, pending } = await useFetch('/api/inventory/stock', {
  query: { page, limit: 10 },
  watch: [page],
})

const stocks = computed(() => stockData.value?.data || [])

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
