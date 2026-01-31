<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/budgets" class="btn btn-ghost btn-sm">
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold">Buat Budget Baru</h1>
        <p class="text-base-content/60">Perencanaan anggaran proyek</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="grid lg:grid-cols-3 gap-6">
      <!-- Main Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Info -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Informasi Dasar</h2>

            <div class="grid sm:grid-cols-2 gap-4">
              <!-- Title -->
              <div class="form-control sm:col-span-2 w-full">
                <label class="label">
                  <span class="label-text">Judul Budget *</span>
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="Contoh: CCTV 8 Kamera Warehouse"
                  class="input input-bordered w-full"
                  required
                />
              </div>

              <!-- Customer -->
              <div class="form-control sm:col-span-2 w-full">
                <label class="label">
                  <span class="label-text">Pelanggan (Opsional)</span>
                </label>
                <AppCustomerSelect
                  v-model="form.customerId"
                  placeholder="Pilih pelanggan..."
                  class="w-full"
                />
              </div>

              <!-- Description -->
              <div class="form-control sm:col-span-2 w-full">
                <label class="label">
                  <span class="label-text">Deskripsi</span>
                </label>
                <textarea
                  v-model="form.description"
                  placeholder="Deskripsi kebutuhan proyek..."
                  class="textarea textarea-bordered w-full"
                  rows="2"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title">Item Budget</h2>
              <div class="flex gap-2">
                <button type="button" @click="openProductModal" class="btn btn-outline btn-sm">
                  + Dari Produk
                </button>
                <button type="button" @click="addItem" class="btn btn-primary btn-sm">
                  + Item Manual
                </button>
              </div>
            </div>

            <div class="space-y-4 mt-4">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="border border-base-300 rounded-lg p-4"
              >
                <div class="flex justify-between items-start mb-3">
                  <span class="badge badge-ghost">Item {{ index + 1 }}</span>
                  <button
                    v-if="form.items.length > 1"
                    type="button"
                    @click="removeItem(index)"
                    class="btn btn-ghost btn-xs btn-circle text-error"
                  >
                    ✕
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-6 gap-3">
                  <!-- Name -->
                  <div class="form-control sm:col-span-6 w-full">
                    <label class="label py-1">
                      <span class="label-text text-xs">Nama Item *</span>
                    </label>
                    <input
                      v-model="item.name"
                      type="text"
                      placeholder="Nama item"
                      class="input input-bordered input-sm w-full"
                      required
                    />
                  </div>

                  <!-- Quantity -->
                  <div class="form-control sm:col-span-2 w-full">
                    <label class="label py-1">
                      <span class="label-text text-xs">Qty *</span>
                    </label>
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      class="input input-bordered input-sm w-full"
                      required
                    />
                  </div>

                  <!-- Unit -->
                  <div class="form-control sm:col-span-4 w-full">
                    <label class="label py-1">
                      <span class="label-text text-xs">Unit</span>
                    </label>
                    <select v-model="item.unit" class="select select-bordered select-sm w-full">
                      <option v-for="unit in units" :key="unit.id" :value="unit.symbol">
                        {{ unit.symbol }}
                      </option>
                    </select>
                  </div>

                  <!-- Cost Price -->
                  <div class="form-control sm:col-span-3 w-full">
                    <label class="label py-1">
                      <span class="label-text text-xs">Harga Modal *</span>
                    </label>
                    <input
                      v-model.number="item.costPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="input input-bordered input-sm w-full text-right"
                      required
                    />
                  </div>

                  <!-- Sell Price -->
                  <div class="form-control sm:col-span-3 w-full">
                    <label class="label py-1">
                      <span class="label-text text-xs">Harga Jual *</span>
                    </label>
                    <input
                      v-model.number="item.sellPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="input input-bordered input-sm w-full text-right"
                      required
                    />
                  </div>

                  <!-- Save as Product (only for manual items) -->
                  <div v-if="!item.productId" class="form-control sm:col-span-6 w-full">
                    <label class="label cursor-pointer justify-start gap-3 py-1">
                      <input
                        v-model="item.saveAsProduct"
                        type="checkbox"
                        class="checkbox checkbox-sm checkbox-primary"
                      />
                      <span class="label-text text-xs">Simpan sebagai produk baru</span>
                    </label>
                  </div>

                  <!-- Category (only when saveAsProduct is checked) -->
                  <div
                    v-if="item.saveAsProduct && !item.productId"
                    class="form-control sm:col-span-6 w-full"
                  >
                    <label class="label py-1">
                      <span class="label-text text-xs">Kategori Produk *</span>
                    </label>
                    <select v-model="item.category" class="select select-bordered select-sm w-full">
                      <option value="">Pilih kategori...</option>
                      <option v-for="cat in categories" :key="cat" :value="cat">
                        {{ cat }}
                      </option>
                      <option value="Uncategorized">Lainnya (Uncategorized)</option>
                    </select>
                  </div>
                </div>

                <!-- Item Summary -->
                <div class="mt-3 pt-3 border-t border-base-300">
                  <div class="bg-base-200/50 rounded-lg p-2 sm:p-3">
                    <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
                      <div class="text-base-content/60">Total Modal:</div>
                      <div class="text-right font-mono">
                        {{ formatCurrency(item.quantity * item.costPrice) }}
                      </div>
                      <div class="text-base-content/60">Total Jual:</div>
                      <div class="text-right font-mono font-bold text-primary">
                        {{ formatCurrency(item.quantity * item.sellPrice) }}
                      </div>
                      <div class="text-base-content/60">Margin:</div>
                      <div class="text-right">
                        <span
                          class="font-mono"
                          :class="getItemMargin(item) >= 0 ? 'text-success' : 'text-error'"
                        >
                          {{ formatCurrency(getItemMargin(item)) }}
                        </span>
                        <span
                          class="badge badge-xs sm:badge-sm ml-1"
                          :class="
                            getItemMarginPercent(item) >= 20 ? 'badge-success' : 'badge-warning'
                          "
                        >
                          {{ getItemMarginPercent(item).toFixed(1) }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="form.items.length === 0" class="text-center py-8 text-base-content/60">
                <p>Belum ada item. Tambahkan dari produk atau buat item manual.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Catatan</h2>
            <textarea
              v-model="form.notes"
              placeholder="Catatan tambahan..."
              class="textarea textarea-bordered w-full"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Summary Sidebar -->
      <div class="lg:col-span-1">
        <div class="card bg-base-100 shadow sticky top-20">
          <div class="card-body">
            <h2 class="card-title">Ringkasan</h2>

            <div class="space-y-3 mt-4">
              <div class="flex justify-between">
                <span class="text-base-content/60">Total Modal</span>
                <span class="font-mono">{{ formatCurrency(totalCost) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-base-content/60">Total Harga Jual</span>
                <span class="font-mono font-bold text-primary">
                  {{ formatCurrency(totalPrice) }}
                </span>
              </div>

              <div class="divider my-2"></div>

              <div class="flex justify-between">
                <span class="text-base-content/60">Margin (Rp)</span>
                <span
                  class="font-mono font-bold"
                  :class="marginAmount >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(marginAmount) }}
                </span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-base-content/60">Margin (%)</span>
                <span
                  class="badge badge-lg"
                  :class="marginPercent >= 20 ? 'badge-success' : 'badge-warning'"
                >
                  {{ marginPercent.toFixed(1) }}%
                </span>
              </div>
            </div>

            <div class="card-actions mt-6">
              <button
                type="submit"
                class="btn btn-primary w-full"
                :disabled="!canSubmit || loading"
              >
                <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                <span v-else>Simpan Budget</span>
              </button>
            </div>

            <p class="text-xs text-center text-base-content/50 mt-2">
              Budget akan disimpan sebagai Draft
            </p>
          </div>
        </div>
      </div>
    </form>

    <!-- Product Selection Modal -->
    <dialog ref="productModal" class="modal">
      <div class="modal-box w-11/12 max-w-5xl">
        <h3 class="font-bold text-lg mb-4">Pilih Produk</h3>

        <!-- Search -->
        <div class="form-control mb-4 w-full">
          <input
            v-model="productSearch"
            type="text"
            placeholder="Cari produk..."
            class="input input-bordered w-full"
          />
        </div>

        <!-- Product List -->
        <div class="overflow-x-auto max-h-96">
          <table class="table table-sm table-zebra">
            <thead class="sticky top-0 bg-base-200">
              <tr>
                <th>Nama Produk</th>
                <th>SKU</th>
                <th>Kategori</th>
                <th class="text-center">Unit</th>
                <th class="text-right">Harga Beli</th>
                <th class="text-right">Harga Jual</th>
                <th class="text-center">Stok</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in filteredProducts"
                :key="product.id"
                class="hover cursor-pointer"
              >
                <td>
                  <div class="font-medium">{{ product.name }}</div>
                  <span
                    class="badge badge-xs"
                    :class="product.type === 'SERVICE' ? 'badge-secondary' : 'badge-primary'"
                  >
                    {{ product.type === 'SERVICE' ? 'Jasa' : 'Produk' }}
                  </span>
                </td>
                <td class="font-mono text-xs">{{ product.sku }}</td>
                <td>{{ product.category }}</td>
                <td class="text-center">{{ product.unit || 'pcs' }}</td>
                <td class="text-right font-mono text-warning">
                  {{ formatCurrency(product.purchasePrice) }}
                </td>
                <td class="text-right font-mono text-primary font-bold">
                  {{ formatCurrency(product.sellingPrice) }}
                </td>
                <td class="text-center">
                  <span
                    v-if="product.type === 'PRODUCT'"
                    class="badge badge-sm"
                    :class="getStockBadgeClass(product.stock?.available || 0)"
                  >
                    {{ product.stock?.available || 0 }}
                  </span>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td>
                  <button
                    type="button"
                    @click="selectProduct(product)"
                    class="btn btn-primary btn-xs"
                  >
                    Pilih
                  </button>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="8" class="text-center py-8 text-base-content/60">
                  Tidak ada produk ditemukan
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-action">
          <button type="button" @click="closeProductModal" class="btn btn-ghost">Tutup</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeProductModal">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency } = useFormatter()
const { success, error: showError } = useAlert()

interface BudgetItem {
  productId?: string
  name: string
  description: string
  category: string
  quantity: number
  unit: string
  costPrice: number
  sellPrice: number
  saveAsProduct: boolean
}

const form = reactive({
  customerId: '',
  title: '',
  description: '',
  items: [] as BudgetItem[],
  notes: '',
})

const loading = ref(false)
const productModal = ref<HTMLDialogElement>()
const productSearch = ref('')

// Fetch products
const { data: productsData } = await useFetch('/api/products', {
  query: { limit: 1000 },
})

const products = computed(() => productsData.value?.data || [])

// Fetch units
const { data: unitsResponse } = await useFetch('/api/units')
const units = computed(() => unitsResponse.value || [])

// Get unique categories for dropdown
const categories = computed(() => {
  const cats = [...new Set(products.value.map((p: any) => p.category))]
  return cats.filter(Boolean).sort()
})

// Filtered products for modal
const filteredProducts = computed(() => {
  if (!productSearch.value) return products.value
  const searchLower = productSearch.value.toLowerCase()
  return products.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      p.category?.toLowerCase().includes(searchLower)
  )
})

// Stock badge class
const getStockBadgeClass = (stock: number) => {
  if (stock <= 0) return 'badge-error'
  if (stock <= 5) return 'badge-warning'
  return 'badge-success'
}

// Open product modal
const openProductModal = () => {
  productSearch.value = ''
  productModal.value?.showModal()
}

// Close product modal
const closeProductModal = () => {
  productModal.value?.close()
}

// Select product and add to items
const selectProduct = (product: any) => {
  form.items.push({
    productId: product.id,
    name: product.name,
    description: '',
    category: product.category || '',
    quantity: 1,
    unit: product.unit || 'pcs',
    costPrice: Number(product.purchasePrice) || 0,
    sellPrice: Number(product.sellingPrice) || 0,
    saveAsProduct: false, // Already from product
  })
  closeProductModal()
}

// Add manual item
const addItem = () => {
  form.items.push({
    productId: undefined,
    name: '',
    description: '',
    category: '',
    quantity: 1,
    unit: 'pcs',
    costPrice: 0,
    sellPrice: 0,
    saveAsProduct: false,
  })
}

// Remove item
const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

// Calculate item margin
const getItemMargin = (item: BudgetItem) => {
  return item.quantity * item.sellPrice - item.quantity * item.costPrice
}

const getItemMarginPercent = (item: BudgetItem) => {
  const cost = item.quantity * item.costPrice
  if (cost === 0) return 0
  return (getItemMargin(item) / cost) * 100
}

// Totals
const totalCost = computed(() => {
  return form.items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0)
})

const totalPrice = computed(() => {
  return form.items.reduce((sum, item) => sum + item.quantity * item.sellPrice, 0)
})

const marginAmount = computed(() => totalPrice.value - totalCost.value)

const marginPercent = computed(() => {
  if (totalCost.value === 0) return 0
  return (marginAmount.value / totalCost.value) * 100
})

// Validation
const canSubmit = computed(() => {
  if (!form.title) return false
  if (form.items.length === 0) return false
  return form.items.every(item => item.name && item.quantity > 0)
})

// Submit
const handleSubmit = async () => {
  if (!canSubmit.value) return

  loading.value = true
  try {
    const budget = await $fetch('/api/budgets', {
      method: 'POST',
      body: {
        customerId: form.customerId || null,
        title: form.title,
        description: form.description || null,
        items: form.items,
        notes: form.notes || null,
      },
    })
    success('Budget berhasil dibuat')
    await navigateTo(`/budgets/${(budget as any).id}`)
  } catch (err: any) {
    showError(err.data?.message || 'Gagal membuat budget')
  } finally {
    loading.value = false
  }
}
</script>
