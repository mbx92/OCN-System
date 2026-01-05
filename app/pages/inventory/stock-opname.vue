<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Stock Opname</h1>
        <p class="text-base-content/60">Catat stok fisik dan sesuaikan dengan sistem</p>
      </div>
      <button @click="openCreateModal" class="btn btn-primary">
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
        Buat Stock Opname
      </button>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-4">
        <input
          v-model="search"
          type="text"
          placeholder="Cari produk..."
          class="input input-bordered w-full"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Table -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Produk</th>
                <th>SKU</th>
                <th>Stok Sistem</th>
                <th>Stok Aktual</th>
                <th>Selisih</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="opname in stockOpnames" :key="opname.id" class="hover">
                <td>{{ formatDate(opname.createdAt) }}</td>
                <td>
                  <div class="font-medium">{{ opname.product.name }}</div>
                </td>
                <td>
                  <span class="badge badge-ghost">{{ opname.product.sku }}</span>
                </td>
                <td>{{ opname.systemStock }} {{ opname.product.unit }}</td>
                <td>{{ opname.actualStock }} {{ opname.product.unit }}</td>
                <td>
                  <span
                    class="font-semibold"
                    :class="{
                      'text-success': opname.difference > 0,
                      'text-error': opname.difference < 0,
                      'text-base-content/60': opname.difference === 0,
                    }"
                  >
                    {{ opname.difference > 0 ? '+' : '' }}{{ opname.difference }}
                  </span>
                </td>
                <td>
                  <span class="text-sm text-base-content/60">
                    {{ opname.notes || '-' }}
                  </span>
                </td>
              </tr>
              <tr v-if="stockOpnames.length === 0">
                <td colspan="7" class="text-center py-8 text-base-content/60">
                  Belum ada stock opname
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <AppPagination
      v-if="meta.totalPages > 1"
      :current-page="meta.page"
      :total-pages="meta.totalPages"
      @page-change="handlePageChange"
    />

    <!-- Create Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Buat Stock Opname</h3>
        <form @submit.prevent="saveOpname">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Produk *</label>
              <AppProductSelect
                v-model="productName"
                placeholder="Pilih produk..."
                @select="handleProductSelect"
              />
            </div>

            <div v-if="selectedProduct" class="bg-base-200 rounded-lg p-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-base-content/60">Stok Sistem:</span>
                  <div class="text-lg font-bold">{{ systemStock }} {{ selectedProduct.unit }}</div>
                </div>
                <div>
                  <span class="text-base-content/60">Stok Tersedia:</span>
                  <div class="text-lg font-bold text-success">
                    {{ availableStock }} {{ selectedProduct.unit }}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Stok Aktual (Hasil Hitung Fisik) *
              </label>
              <input
                v-model.number="form.actualStock"
                type="number"
                class="input input-bordered w-full"
                required
                min="0"
                placeholder="Masukkan hasil hitung fisik"
              />
            </div>

            <div
              v-if="form.actualStock !== null && selectedProduct"
              class="alert"
              :class="{
                'alert-success': difference > 0,
                'alert-error': difference < 0,
                'alert-info': difference === 0,
              }"
            >
              <div>
                <div class="font-bold">
                  {{
                    difference === 0
                      ? 'Stok Sesuai'
                      : difference > 0
                        ? 'Kelebihan Stok'
                        : 'Kekurangan Stok'
                  }}
                </div>
                <div class="text-sm">
                  Selisih: {{ difference > 0 ? '+' : '' }}{{ difference }}
                  {{ selectedProduct.unit }}
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Catatan</label>
              <textarea
                v-model="form.notes"
                class="textarea textarea-bordered w-full"
                rows="3"
                placeholder="Catatan tambahan (opsional)"
              ></textarea>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeModal" :disabled="saving">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving || !form.productId">
              <span v-if="saving" class="loading loading-spinner"></span>
              Simpan
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { formatDate } = useFormatter()
const { showAlert } = useAlert()

const search = ref('')
const page = ref(1)
const showModal = ref(false)
const saving = ref(false)
const selectedProduct = ref<any>(null)
const systemStock = ref(0)
const availableStock = ref(0)
const productName = ref('')

const form = reactive({
  productId: '',
  actualStock: null as number | null,
  notes: '',
})

const difference = computed(() => {
  if (form.actualStock === null) return 0
  return form.actualStock - systemStock.value
})

// Fetch stock opnames
const {
  data: opnamesData,
  pending,
  refresh,
} = await useFetch('/api/stock-opnames', {
  query: { page, search },
  watch: [page, search],
})

const stockOpnames = computed(() => (opnamesData.value as any)?.data || [])
const meta = computed(() => (opnamesData.value as any)?.meta || { page: 1, totalPages: 1 })

const handlePageChange = (newPage: number) => {
  page.value = newPage
}

const openCreateModal = () => {
  form.productId = ''
  form.actualStock = null
  form.notes = ''
  selectedProduct.value = null
  productName.value = ''
  systemStock.value = 0
  availableStock.value = 0
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleProductSelect = async (product: any) => {
  selectedProduct.value = product
  form.productId = product.id
  productName.value = product.name

  // Fetch current stock
  try {
    const stock = await $fetch(`/api/products/${product.id}/stock`)
    systemStock.value = (stock as any).quantity || 0
    availableStock.value = (stock as any).available || 0
  } catch (err) {
    systemStock.value = 0
    availableStock.value = 0
  }
}

const saveOpname = async () => {
  saving.value = true
  try {
    await $fetch('/api/stock-opnames', {
      method: 'POST',
      body: form,
    })
    showAlert('Stock opname berhasil dicatat!', 'success')
    closeModal()
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan stock opname', 'error')
  } finally {
    saving.value = false
  }
}
</script>
