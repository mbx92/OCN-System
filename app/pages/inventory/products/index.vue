<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Produk</h1>
        <p class="text-base-content/60">Kelola produk inventori</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Tambah Produk
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- View Toggle -->
          <div class="flex-none">
            <AppViewToggle v-model="viewMode" />
          </div>

          <!-- Search -->
          <div class="flex-1">
            <div class="form-control">
              <input
                v-model="search"
                type="text"
                placeholder="Cari produk..."
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-3 lg:flex-none lg:w-auto">
            <div class="form-control w-full sm:w-48">
              <select v-model="productType" class="select select-bordered w-full">
                <option value="">Semua Tipe</option>
                <option value="PRODUCT">Produk</option>
                <option value="SERVICE">Jasa</option>
                <option value="MATERIAL">Material</option>
              </select>
            </div>
            <div class="form-control w-full sm:w-48">
              <select v-model="category" class="select select-bordered w-full">
                <option value="">Semua Kategori</option>
                <option value="CCTV">CCTV</option>
                <option value="NETWORK">Network</option>
                <option value="ACCESSORIES">Accessories</option>
                <option value="MATERIAL">Material</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Grid -->
    <div
      v-if="viewMode === 'GRID'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div v-if="pending" class="col-span-full text-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div
        v-else-if="!filteredProducts?.length"
        class="col-span-full text-center py-12 text-base-content/60"
      >
        <p>Belum ada produk</p>
      </div>

      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="card bg-base-100 shadow hover:shadow-md transition-shadow"
      >
        <div class="card-body p-4">
          <div class="flex justify-between items-start mb-2">
            <div class="flex gap-1">
              <span class="badge badge-sm" :class="getTypeColor(product.type)">
                {{ getTypeLabel(product.type) }}
              </span>
              <span class="badge badge-sm badge-outline">{{ product.category }}</span>
            </div>
            <span class="font-mono text-xs text-base-content/60">{{ product.sku }}</span>
          </div>

          <h3 class="font-bold text-base">{{ product.name }}</h3>
          <p class="text-xs text-base-content/60">{{ product.sku }}</p>

          <div class="mt-4 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <div class="text-xs text-base-content/60">HPP</div>
                <div class="font-mono text-sm">
                  {{ formatCurrency(product.purchasePrice) }}
                </div>
              </div>
              <div>
                <div class="text-xs text-base-content/60">Harga Jual</div>
                <div class="font-mono font-bold text-success">
                  {{ formatCurrency(product.sellingPrice) }}
                </div>
              </div>
            </div>
            <div v-if="product.type !== 'SERVICE'" class="pt-2 border-t">
              <div class="text-xs text-base-content/60">Stock</div>
              <div class="font-mono text-sm" :class="product.stock < 10 ? 'text-error' : ''">
                {{ product.stock }} {{ product.unit }}
              </div>
            </div>
          </div>
          <div class="mt-2 flex justify-end gap-1">
            <button @click="editProduct(product)" class="btn btn-ghost btn-xs btn-square">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              @click="deleteProduct(product)"
              class="btn btn-ghost btn-xs btn-square text-error"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product List -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th class="text-right">HPP</th>
                <th class="text-right">Harga Jual</th>
                <th class="text-right">Stock</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pending" class="text-center">
                <td colspan="8" class="py-8">
                  <span class="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
              <tr v-else-if="!filteredProducts?.length" class="text-center">
                <td colspan="8" class="py-8 text-base-content/60">
                  <p>Belum ada produk</p>
                </td>
              </tr>
              <tr v-for="product in filteredProducts" :key="product.id" class="hover">
                <td class="font-mono text-sm">{{ product.sku }}</td>
                <td>
                  <p class="font-medium">{{ product.name }}</p>
                </td>
                <td>
                  <span class="badge badge-sm" :class="getTypeColor(product.type)">
                    {{ getTypeLabel(product.type) }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-sm badge-outline">{{ product.category }}</span>
                </td>
                <td class="text-right font-mono">{{ formatCurrency(product.purchasePrice) }}</td>
                <td class="text-right font-mono text-success font-bold">
                  {{ formatCurrency(product.sellingPrice) }}
                </td>
                <td class="text-right font-mono">
                  <span
                    v-if="product.type !== 'SERVICE'"
                    :class="product.stock < 10 ? 'text-error' : ''"
                  >
                    {{ product.stock }} {{ product.unit }}
                  </span>
                  <span v-else class="text-base-content/60">-</span>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-1">
                    <button @click="editProduct(product)" class="btn btn-ghost btn-sm btn-square">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="deleteProduct(product)"
                      class="btn btn-ghost btn-sm btn-square text-error"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="productsData?.meta?.total" class="card bg-base-100 shadow p-4">
      <AppPagination :total="productsData.meta.total" :per-page="12" v-model:current-page="page" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { formatCurrency } = useFormatter()
const { showAlert } = useAlert()
const { confirm } = useConfirm()

const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const category = ref('')
const productType = ref('')
const page = ref(1)
const viewMode = ref<'GRID' | 'LIST'>('GRID')

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    PRODUCT: 'Produk',
    SERVICE: 'Jasa',
    MATERIAL: 'Material',
  }
  return labels[type] || type
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    PRODUCT: 'badge-primary',
    SERVICE: 'badge-secondary',
    MATERIAL: 'badge-accent',
  }
  return colors[type] || 'badge-ghost'
}

const {
  data: productsData,
  pending,
  refresh,
} = await useFetch('/api/products', {
  query: { search: debouncedSearch, category, type: productType, page, limit: 12 },
  watch: [debouncedSearch, category, productType, page],
})

const filteredProducts = computed(() => productsData.value?.data || [])

const openAddModal = () => {
  navigateTo('/inventory/products/create')
}

const editProduct = (product: any) => {
  navigateTo(`/inventory/products/${product.id}`)
}

const deleteProduct = async (product: any) => {
  const confirmed = await confirm({
    title: `Hapus produk "${product.name}"?`,
    message: 'Produk akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan.',
    type: 'danger',
    confirmText: 'Hapus',
    cancelText: 'Batal',
  })

  if (!confirmed) return

  try {
    await $fetch(`/api/products/${product.id}`, {
      method: 'DELETE',
    })
    showAlert('Produk berhasil dihapus', 'success')
    await refresh()
  } catch (error: any) {
    showAlert(error.data?.message || 'Gagal menghapus produk', 'error')
  }
}
</script>
