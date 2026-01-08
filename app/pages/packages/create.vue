<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center gap-2 sm:gap-4">
      <NuxtLink to="/packages" class="btn btn-ghost btn-sm btn-circle">
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
        <h1 class="text-xl sm:text-2xl font-bold">Buat Paket Baru</h1>
        <p class="text-sm text-base-content/60">Buat paket bundling produk</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Info -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 sm:p-6">
            <h2 class="card-title text-base sm:text-lg">Informasi Paket</h2>

            <div class="form-control w-full">
              <label class="label"><span class="label-text">Nama Paket *</span></label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Paket CCTV 4 Kamera"
                class="input input-bordered input-sm sm:input-md w-full"
                required
              />
            </div>

            <div class="form-control w-full">
              <label class="label"><span class="label-text">Deskripsi</span></label>
              <textarea
                v-model="form.description"
                placeholder="Deskripsi paket..."
                class="textarea textarea-bordered textarea-sm sm:textarea-md w-full"
                rows="3"
              />
            </div>

            <div class="form-control w-full">
              <label class="label"><span class="label-text">Kategori</span></label>
              <select
                v-model="form.category"
                class="select select-bordered select-sm sm:select-md w-full"
              >
                <option value="">Pilih Kategori</option>
                <option value="CCTV">CCTV</option>
                <option value="NETWORK">Network</option>
                <option value="COMBO">Combo</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 sm:p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="card-title text-base sm:text-lg">Item Paket</h2>
              <button @click="addItem" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Tambah Item
              </button>
            </div>

            <div v-if="form.items.length === 0" class="text-center py-8 text-base-content/60">
              <p>Belum ada item</p>
              <button @click="addItem" class="btn btn-outline btn-sm mt-2">
                Tambah Item Pertama
              </button>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(item, idx) in form.items"
                :key="idx"
                class="flex items-center gap-2 p-2 bg-base-200 rounded-lg"
              >
                <span class="text-sm font-medium text-base-content/60 w-6 text-center">
                  {{ idx + 1 }}
                </span>

                <div class="flex items-center gap-1 flex-1 min-w-0">
                  <input
                    v-model="item.name"
                    type="text"
                    placeholder="Nama item"
                    class="input input-bordered input-sm flex-1"
                    required
                  />
                  <button
                    @click="openProductModal(idx)"
                    type="button"
                    class="btn btn-ghost btn-sm btn-square"
                    title="Pilih dari produk"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>

                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                  class="input input-bordered input-sm w-16 text-right"
                  required
                />
                <select v-model="item.unit" class="select select-bordered select-sm w-20" required>
                  <option v-for="unit in units" :key="unit.id" :value="unit.symbol">
                    {{ unit.symbol }}
                  </option>
                </select>
                <input
                  v-model.number="item.price"
                  type="number"
                  min="0"
                  placeholder="Harga"
                  class="input input-bordered input-sm w-28 text-right"
                  required
                />

                <div class="text-right min-w-24">
                  <span class="font-semibold text-primary text-sm">
                    {{ formatCurrency(item.quantity * item.price) }}
                  </span>
                </div>

                <button @click="removeItem(idx)" class="btn btn-ghost btn-xs btn-circle text-error">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="lg:col-span-1">
        <div class="card bg-base-100 shadow sticky top-6">
          <div class="card-body p-4 sm:p-6">
            <h2 class="card-title text-base sm:text-lg">Ringkasan</h2>

            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-base-content/60">Jumlah Item</span>
                <span class="font-medium">{{ form.items.length }}</span>
              </div>

              <div class="divider my-2"></div>

              <div class="flex justify-between">
                <span class="font-medium">Total Harga</span>
                <span class="text-lg font-bold text-primary">{{ formatCurrency(totalPrice) }}</span>
              </div>
            </div>

            <div class="divider my-4"></div>

            <button
              @click="handleSubmit"
              class="btn btn-primary w-full"
              :disabled="!canSubmit || loading"
            >
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              Simpan Paket
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Selection Modal -->
    <dialog ref="productModal" class="modal">
      <div class="modal-box w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 class="font-bold text-base sm:text-lg mb-3 sm:mb-4">Pilih Produk</h3>

        <!-- Search -->
        <div class="form-control mb-3 sm:mb-4">
          <input
            v-model="productSearch"
            type="text"
            placeholder="Cari produk..."
            class="input input-bordered input-sm sm:input-md w-full"
          />
        </div>

        <!-- Product List -->
        <div class="overflow-x-auto max-h-96">
          <table class="table table-sm table-zebra">
            <thead class="sticky top-0 bg-base-200">
              <tr>
                <th>Nama Produk</th>
                <th>Kategori</th>
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
                @click="selectProduct(product)"
              >
                <td>
                  <div class="font-medium">{{ product.name }}</div>
                  <div class="text-xs text-base-content/60">{{ product.sku }}</div>
                </td>
                <td>
                  <span class="badge badge-sm" :class="getCategoryBadge(product.category)">
                    {{ product.category }}
                  </span>
                </td>
                <td class="text-right font-medium">{{ formatCurrency(product.sellingPrice) }}</td>
                <td class="text-center">
                  <span
                    class="badge badge-sm"
                    :class="product.stock > 0 ? 'badge-success' : 'badge-error'"
                  >
                    {{ product.stock }} {{ product.unit || 'pcs' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-primary btn-xs">Pilih</button>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="5" class="text-center text-base-content/60 py-8">
                  Tidak ada produk ditemukan
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-action">
          <button @click="closeProductModal" class="btn btn-ghost">Tutup</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { formatCurrency } = useFormatter()
const { success, error: showError } = useAlert()

interface PackageItem {
  productId: string | null
  name: string
  quantity: number
  unit: string
  price: number
}

const form = reactive({
  name: '',
  description: '',
  category: '',
  items: [] as PackageItem[],
})

const loading = ref(false)

const { data: units } = await useFetch('/api/units')
const { data: productsResponse } = await useFetch('/api/products', { query: { limit: 1000 } })
const products = computed(() => (productsResponse.value as any)?.data || [])

const totalPrice = computed(() => {
  return form.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
})

const canSubmit = computed(() => {
  return (
    form.name &&
    form.items.length > 0 &&
    form.items.every(i => i.name && i.quantity > 0 && i.price >= 0)
  )
})

const addItem = () => {
  form.items.push({
    productId: null,
    name: '',
    quantity: 1,
    unit: 'pcs',
    price: 0,
  })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const onProductSelect = (index: number, event: any) => {
  const item = form.items[index]
  if (!item || !event) return

  const product = products.value?.find((p: any) => p.id === event.id)
  if (product) {
    item.productId = product.id
    item.name = product.name

    // Match unit case-insensitively with available units
    const productUnit = product.unit?.toLowerCase() || 'pcs'
    const matchedUnit = units.value?.find((u: any) => u.symbol.toLowerCase() === productUnit)
    item.unit = matchedUnit?.symbol || 'pcs'

    item.price = parseFloat(product.sellingPrice)
  }
}

// Product Modal
const productModal = ref<HTMLDialogElement | null>(null)
const productSearch = ref('')
const selectedItemIndex = ref<number | null>(null)

const filteredProducts = computed(() => {
  if (!products.value || products.value.length === 0) return []
  const search = productSearch.value.toLowerCase()
  if (!search) return products.value
  return products.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search)
  )
})

const openProductModal = (index: number) => {
  selectedItemIndex.value = index
  productSearch.value = ''
  productModal.value?.showModal()
}

const closeProductModal = () => {
  productModal.value?.close()
  selectedItemIndex.value = null
}

const selectProduct = (product: any) => {
  if (selectedItemIndex.value !== null) {
    const item = form.items[selectedItemIndex.value]
    if (item) {
      item.productId = product.id
      item.name = product.name

      // Match unit case-insensitively with available units
      const productUnit = product.unit?.toLowerCase() || 'pcs'
      const matchedUnit = units.value?.find((u: any) => u.symbol.toLowerCase() === productUnit)
      item.unit = matchedUnit?.symbol || 'pcs'

      item.price = parseFloat(product.sellingPrice)
    }
  }
  closeProductModal()
}

const getCategoryBadge = (category: string) => {
  const badges: Record<string, string> = {
    CCTV: 'badge-primary',
    NETWORK: 'badge-secondary',
    ACCESSORIES: 'badge-accent',
    SERVICE: 'badge-info',
  }
  return badges[category] || 'badge-ghost'
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  loading.value = true
  try {
    const packageData = await $fetch('/api/packages', {
      method: 'POST',
      body: form,
    })
    success('Paket berhasil dibuat')
    await navigateTo(`/packages/${(packageData as any).id}`)
  } catch (err: any) {
    showError(err.data?.message || 'Gagal membuat paket')
  } finally {
    loading.value = false
  }
}
</script>
