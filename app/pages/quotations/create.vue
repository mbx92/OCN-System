<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center gap-2 sm:gap-4">
      <NuxtLink to="/quotations" class="btn btn-ghost btn-sm btn-circle">
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
        <h1 class="text-xl sm:text-2xl font-bold">Buat Penawaran</h1>
        <p class="text-sm text-base-content/60">Buat penawaran harga baru</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Customer Selection -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 sm:p-6">
            <h2 class="card-title text-base sm:text-lg">Pelanggan</h2>
            <div class="form-control w-full">
              <AppCustomerSelect
                v-model="form.customerId"
                placeholder="Cari customer..."
                required
              />
            </div>
            <div class="form-control w-full mt-2">
              <input
                v-model="form.title"
                type="text"
                placeholder="Judul penawaran (opsional)"
                class="input input-bordered input-sm sm:input-md w-full"
              />
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 sm:p-6">
            <div
              class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0"
            >
              <h2 class="card-title text-base sm:text-lg">Item Penawaran</h2>
              <div class="flex gap-2 w-full sm:w-auto">
                <button
                  @click="openPackageModal"
                  class="btn btn-secondary btn-sm flex-1 sm:flex-initial"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  Pilih Paket
                </button>
                <button @click="addItem" class="btn btn-primary btn-sm flex-1 sm:flex-initial">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Tambah Item
                </button>
              </div>
            </div>

            <div v-if="form.items.length === 0" class="text-center py-8 text-base-content/60">
              <p>Belum ada item</p>
              <button @click="addItem" class="btn btn-outline btn-sm mt-2">
                Tambah Item Pertama
              </button>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="flex items-center gap-2 p-2 bg-base-200 rounded-lg"
              >
                <span class="text-sm font-medium text-base-content/60 w-6 text-center">
                  {{ index + 1 }}
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
                    @click="openProductModal(index)"
                    type="button"
                    class="btn btn-ghost btn-sm btn-square"
                    title="Pilih dari produk"
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

                <button
                  @click="removeItem(index)"
                  class="btn btn-ghost btn-xs btn-circle text-error"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 sm:p-6">
            <h2 class="card-title text-base sm:text-lg">Catatan</h2>
            <textarea
              v-model="form.notes"
              placeholder="Catatan untuk pelanggan (opsional)"
              class="textarea textarea-bordered textarea-sm sm:textarea-md w-full"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="lg:col-span-1">
        <div class="card bg-base-100 shadow lg:sticky lg:top-20">
          <div class="card-body p-4 sm:p-6">
            <h2 class="card-title text-base sm:text-lg">Ringkasan</h2>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/60">Jumlah Item</span>
                <span>{{ form.items.length }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Berlaku</span>
                <span>{{ form.validDays }} hari</span>
              </div>
              <div class="divider my-2"></div>
              <div class="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span class="text-primary">{{ formatCurrency(totalAmount) }}</span>
              </div>
            </div>

            <div class="form-control w-full mt-4">
              <label class="label">
                <span class="label-text">Masa Berlaku</span>
              </label>
              <select
                v-model.number="form.validDays"
                class="select select-bordered select-sm w-full"
              >
                <option :value="7">7 hari</option>
                <option :value="14">14 hari</option>
                <option :value="30">30 hari</option>
              </select>
            </div>

            <div class="card-actions mt-4">
              <button
                @click="handleSubmit"
                class="btn btn-primary w-full"
                :disabled="!canSubmit || loading"
              >
                <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                Simpan Penawaran
              </button>
            </div>
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
                    {{ product.stock || 0 }} {{ product.unit }}
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

    <!-- Package Selection Modal -->
    <dialog ref="packageModal" class="modal">
      <div class="modal-box w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 class="font-bold text-base sm:text-lg mb-3 sm:mb-4">Pilih Paket</h3>

        <!-- Search -->
        <div class="form-control mb-3 sm:mb-4">
          <input
            v-model="packageSearch"
            type="text"
            placeholder="Cari paket..."
            class="input input-bordered input-sm sm:input-md w-full"
          />
        </div>

        <!-- Package List -->
        <div class="space-y-3 max-h-[60vh] overflow-y-auto">
          <div
            v-for="pkg in filteredPackages"
            :key="pkg.id"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
            @click="selectPackage(pkg)"
          >
            <div class="card-body p-4">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-bold">{{ pkg.name }}</h4>
                  <p v-if="pkg.description" class="text-sm text-base-content/60 line-clamp-2 mt-1">
                    {{ pkg.description }}
                  </p>
                  <div class="flex gap-2 mt-2">
                    <span
                      v-if="pkg.category"
                      class="badge badge-sm"
                      :class="getCategoryBadge(pkg.category)"
                    >
                      {{ pkg.category }}
                    </span>
                    <span class="badge badge-sm badge-ghost">
                      {{ pkg.items?.length || 0 }} item
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-base-content/60">Total</div>
                  <div class="text-lg font-bold text-primary">
                    {{ formatCurrency(pkg.totalPrice) }}
                  </div>
                </div>
              </div>

              <!-- Items Preview -->
              <div class="mt-3 pt-3 border-t border-base-300">
                <div class="text-xs space-y-1">
                  <div
                    v-for="(item, idx) in pkg.items?.slice(0, 3)"
                    :key="idx"
                    class="text-base-content/80"
                  >
                    • {{ item.name }} - {{ item.quantity }} {{ item.unit }}
                  </div>
                  <div v-if="pkg.items && pkg.items.length > 3" class="text-base-content/60">
                    +{{ pkg.items.length - 3 }} item lainnya
                  </div>
                </div>
              </div>

              <div class="card-actions justify-end mt-3">
                <button class="btn btn-primary btn-sm">Gunakan Paket</button>
              </div>
            </div>
          </div>
          <div v-if="filteredPackages.length === 0" class="text-center text-base-content/60 py-8">
            Tidak ada paket ditemukan
          </div>
        </div>

        <div class="modal-action">
          <button @click="closePackageModal" class="btn btn-ghost">Tutup</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { formatCurrency } = useFormatter()
const { success, error: showError } = useAlert()

interface QuotationItem {
  productId: string | null
  name: string
  quantity: number
  unit: string
  price: number
}

const form = reactive({
  customerId: (route.query.customerId as string) || '',
  title: '',
  items: [] as QuotationItem[],
  validDays: 14,
  notes: '',
})

const loading = ref(false)

// Fetch data
const { data: customersResponse } = await useFetch('/api/customers', { query: { limit: 100 } })
const customers = computed(() => customersResponse.value?.data || [])
const { data: productsResponse } = await useFetch('/api/products', { query: { limit: 1000 } })
const products = computed(() => productsResponse.value?.data || [])
const { data: unitsResponse } = await useFetch('/api/units')
const units = computed(() => unitsResponse.value || [])
const { data: packagesResponse } = await useFetch('/api/packages', {
  query: { isActive: true, limit: 100 },
})
const packages = computed(() => packagesResponse.value?.data || [])

const categories = computed(() => {
  if (!products.value?.length) return []
  return [...new Set(products.value.map((p: any) => p.category))]
})

const productsByCategory = computed(() => {
  if (!products.value?.length) return {}
  return products.value.reduce((acc: any, p: any) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})
})

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
})

const canSubmit = computed(() => {
  return (
    form.customerId &&
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

const onProductSelect = (index: number) => {
  const item = form.items[index]
  if (item && item.productId) {
    const product = products.value?.find((p: any) => p.id === item.productId)
    if (product) {
      item.name = product.name
      item.unit = product.unit
      item.price = parseFloat(product.sellingPrice)
    }
  }
}

const onProductSearch = (index: number, event: Event) => {
  const item = form.items[index]
  if (!item) return

  const inputValue = (event.target as HTMLInputElement).value
  const product = products.value?.find((p: any) => p.name === inputValue)

  if (product) {
    item.productId = product.id
    item.unit = product.unit
    item.price = parseFloat(product.sellingPrice)
  } else {
    item.productId = null
  }
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  loading.value = true
  try {
    const quotation = await $fetch('/api/quotations', {
      method: 'POST',
      body: form,
    })
    success('Penawaran berhasil dibuat')
    await navigateTo(`/quotations/${(quotation as any).id}`)
  } catch (err: any) {
    showError(err.data?.message || 'Gagal membuat penawaran')
  } finally {
    loading.value = false
  }
}

// Product Modal
const productModal = ref<HTMLDialogElement | null>(null)
const productSearch = ref('')
const selectedItemIndex = ref<number | null>(null)

const filteredProducts = computed(() => {
  if (!products.value) return []
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
      item.unit = product.unit
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
    COMBO: 'badge-warning',
  }
  return badges[category] || 'badge-ghost'
}

// Package Modal
const packageModal = ref<HTMLDialogElement | null>(null)
const packageSearch = ref('')

const filteredPackages = computed(() => {
  if (!packages.value) return []
  const search = packageSearch.value.toLowerCase()
  if (!search) return packages.value
  return packages.value.filter(
    (p: any) =>
      p.name.toLowerCase().includes(search) ||
      (p.description && p.description.toLowerCase().includes(search)) ||
      (p.category && p.category.toLowerCase().includes(search))
  )
})

const openPackageModal = () => {
  packageSearch.value = ''
  packageModal.value?.showModal()
}

const closePackageModal = () => {
  packageModal.value?.close()
}

const selectPackage = (pkg: any) => {
  // Add all package items to quotation
  if (pkg.items && Array.isArray(pkg.items)) {
    pkg.items.forEach((item: any) => {
      form.items.push({
        productId: item.productId || null,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: parseFloat(item.price),
      })
    })
    success(`Paket "${pkg.name}" berhasil ditambahkan`)
  }
  closePackageModal()
}
</script>
