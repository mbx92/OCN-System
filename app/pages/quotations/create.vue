<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center gap-4">
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
        <h1 class="text-2xl font-bold">Buat Penawaran</h1>
        <p class="text-base-content/60">Buat penawaran harga baru</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Customer Selection -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Pelanggan</h2>
            <div class="form-control">
              <select v-model="form.customerId" class="select select-bordered" required>
                <option value="">Pilih pelanggan</option>
                <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                  {{ customer.name }} {{ customer.companyName ? `(${customer.companyName})` : '' }}
                </option>
              </select>
            </div>
            <div class="form-control mt-2">
              <input
                v-model="form.title"
                type="text"
                placeholder="Judul penawaran (opsional)"
                class="input input-bordered"
              />
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title">Item Penawaran</h2>
              <button @click="addItem" class="btn btn-primary btn-sm">
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
                <!-- Number -->
                <span class="text-sm font-medium text-base-content/60 w-6 text-center">
                  {{ index + 1 }}
                </span>

                <!-- Product Name with Select Button -->
                <div class="flex items-center gap-1 flex-1 min-w-0">
                  <input
                    v-model="item.name"
                    type="text"
                    placeholder="Nama item"
                    class="input input-bordered input-sm flex-1 min-w-0"
                    required
                  />
                  <button
                    @click="openProductModal(index)"
                    type="button"
                    class="btn btn-ghost btn-sm btn-square"
                    title="Pilih dari daftar produk"
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

                <!-- Quantity -->
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                  placeholder="Qty"
                  class="input input-bordered input-sm w-16 text-center"
                  required
                />

                <!-- Unit -->
                <input
                  v-model="item.unit"
                  type="text"
                  placeholder="Unit"
                  class="input input-bordered input-sm w-16 text-center"
                  required
                />

                <!-- Price -->
                <input
                  v-model.number="item.price"
                  type="number"
                  min="0"
                  placeholder="Harga"
                  class="input input-bordered input-sm w-28 text-right"
                  required
                />

                <!-- Subtotal -->
                <div class="text-right min-w-24">
                  <span class="font-semibold text-primary text-sm">
                    {{ formatCurrency(item.quantity * item.price) }}
                  </span>
                </div>

                <!-- Delete Button -->
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
          <div class="card-body">
            <h2 class="card-title">Catatan</h2>
            <textarea
              v-model="form.notes"
              placeholder="Catatan untuk pelanggan (opsional)"
              class="textarea textarea-bordered w-full"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="lg:col-span-1">
        <div class="card bg-base-100 shadow sticky top-20">
          <div class="card-body">
            <h2 class="card-title">Ringkasan</h2>

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

            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text">Masa Berlaku</span>
              </label>
              <select v-model.number="form.validDays" class="select select-bordered select-sm">
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
      <div class="modal-box w-11/12 max-w-4xl">
        <h3 class="font-bold text-lg mb-4">Pilih Produk</h3>

        <!-- Search -->
        <div class="form-control mb-4">
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
                    :class="product.stock?.available > 0 ? 'badge-success' : 'badge-error'"
                  >
                    {{ product.stock?.available || 0 }} {{ product.unit }}
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
  }
  return badges[category] || 'badge-ghost'
}
</script>
