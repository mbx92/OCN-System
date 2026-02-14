<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/projects" class="btn btn-ghost btn-sm btn-circle">
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
        <h1 class="text-2xl font-bold">Buat Project Baru</h1>
        <p class="text-base-content/60">Buat project langsung tanpa penawaran</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Info -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Informasi Project</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Customer -->
            <div class="form-control w-full md:col-span-2">
              <label class="label">
                <span class="label-text">
                  Pelanggan
                  <span class="text-error">*</span>
                </span>
              </label>
              <AppCustomerSelect
                v-model="form.customerId"
                placeholder="Pilih customer..."
                class="w-full"
                required
              />
            </div>

            <!-- Title -->
            <div class="form-control w-full md:col-span-2">
              <label class="label">
                <span class="label-text">
                  Judul Project
                  <span class="text-error">*</span>
                </span>
              </label>
              <input
                v-model="form.title"
                type="text"
                placeholder="Contoh: Instalasi CCTV Toko ABC"
                class="input input-bordered w-full"
                required
              />
            </div>

            <!-- Description -->
            <div class="form-control w-full md:col-span-2">
              <label class="label">
                <span class="label-text">Deskripsi</span>
              </label>
              <textarea
                v-model="form.description"
                placeholder="Deskripsi project..."
                class="textarea textarea-bordered w-full"
                rows="3"
              ></textarea>
            </div>

            <!-- Status -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">Status</span>
              </label>
              <select v-model="form.status" class="select select-bordered w-full">
                <option value="APPROVED">Approved</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <!-- Project Date -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">Tanggal Project</span>
              </label>
              <input v-model="form.projectDate" type="date" class="input input-bordered w-full" />
              <label class="label">
                <span class="label-text-alt text-base-content/60">
                  Kosongkan untuk tanggal hari ini
                </span>
              </label>
            </div>

            <!-- Start Date -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">Tanggal Mulai</span>
              </label>
              <input v-model="form.startDate" type="date" class="input input-bordered w-full" />
            </div>

            <!-- End Date -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">Tanggal Selesai</span>
              </label>
              <input v-model="form.endDate" type="date" class="input input-bordered w-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- Items (Optional) -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 class="card-title">Item Project (Opsional)</h2>
            <button type="button" @click="addItem" class="btn btn-primary btn-sm w-full sm:w-auto">
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
            <p class="mb-3">Belum ada item. Project akan dibuat dengan budget manual.</p>
            <button type="button" @click="addItem" class="btn btn-outline btn-sm">
              Tambah Item Pertama
            </button>
          </div>

          <div v-else class="space-y-3 mt-4">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="p-4 bg-base-200 rounded-lg"
            >
              <div class="flex flex-col gap-3">
                <!-- Header: Number & Delete -->
                <div class="flex items-center justify-between">
                  <span class="badge badge-neutral">Item {{ index + 1 }}</span>
                  <button
                    type="button"
                    @click="removeItem(index)"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Name -->
                <div class="form-control w-full">
                  <div class="flex gap-2">
                    <input
                      v-model="item.name"
                      type="text"
                      placeholder="Nama item"
                      class="input input-bordered input-sm w-full"
                      required
                    />
                    <button
                      type="button"
                      @click="openProductModal(index)"
                      class="btn btn-primary btn-sm btn-square"
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
                </div>

                <!-- Grid: Qty, Unit, Price, HPP -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div class="form-control w-full">
                    <label class="label py-0 pb-1">
                      <span class="label-text text-xs">Qty</span>
                    </label>
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      placeholder="0"
                      class="input input-bordered input-sm w-full"
                      required
                    />
                  </div>

                  <div class="form-control w-full">
                    <label class="label py-0 pb-1">
                      <span class="label-text text-xs">Unit</span>
                    </label>
                    <input
                      v-model="item.unit"
                      type="text"
                      placeholder="pcs"
                      class="input input-bordered input-sm w-full"
                    />
                  </div>

                  <div class="form-control w-full">
                    <label class="label py-0 pb-1">
                      <span class="label-text text-xs">Harga Jual</span>
                    </label>
                    <input
                      v-model.number="item.price"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="input input-bordered input-sm w-full"
                      required
                    />
                  </div>

                  <div class="form-control w-full">
                    <label class="label py-0 pb-1">
                      <span class="label-text text-xs">HPP</span>
                    </label>
                    <input
                      v-model.number="item.cost"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>

                <!-- Total -->
                <div class="flex justify-between items-center pt-2 border-t border-base-300">
                  <span class="text-sm text-base-content/60">Total</span>
                  <span class="font-bold text-primary">
                    {{ formatCurrency(item.quantity * item.price) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Budget (Manual) -->
          <div v-if="form.items.length === 0" class="form-control w-full mt-4">
            <label class="label">
              <span class="label-text">Budget Project</span>
            </label>
            <input
              v-model.number="form.budget"
              type="number"
              min="0"
              placeholder="0"
              class="input input-bordered w-full"
            />
          </div>

          <!-- Total dari Items -->
          <div v-else class="flex justify-end pt-4 border-t">
            <div class="text-right">
              <div class="text-base-content/60 text-sm">Total Budget</div>
              <div class="text-2xl font-bold text-primary">
                {{ formatCurrency(totalBudget) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row justify-end gap-3">
        <NuxtLink to="/projects" class="btn btn-ghost w-full sm:w-auto">Batal</NuxtLink>
        <button
          type="submit"
          class="btn btn-primary w-full sm:w-auto"
          :disabled="loading || !form.customerId || !form.title"
        >
          <span v-if="loading" class="loading loading-spinner"></span>
          {{ loading ? 'Menyimpan...' : 'Buat Project' }}
        </button>
      </div>
    </form>

    <!-- Product Selection Modal -->
    <dialog ref="productModal" class="modal">
      <div class="modal-box w-full max-w-4xl max-h-[90vh]">
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
                <th class="text-right">HPP</th>
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
                <td class="text-right text-sm text-base-content/60">
                  {{ formatCurrency(product.purchasePrice) }}
                </td>
                <td class="text-center">
                  <span
                    class="badge badge-sm"
                    :class="(product.stock?.available || 0) > 0 ? 'badge-success' : 'badge-error'"
                  >
                    {{ product.stock?.available || 0 }} {{ product.unit }}
                  </span>
                </td>
                <td>
                  <button type="button" class="btn btn-primary btn-xs">Pilih</button>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="6" class="text-center text-base-content/60 py-8">
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
        <button type="button">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

// Fetch products
const { data: productsResponse } = await useFetch('/api/products', { query: { limit: 1000 } })
const products = computed(() => productsResponse.value?.data || [])

const { success, error: showError } = useAlert()

const form = ref({
  customerId: '',
  title: '',
  description: '',
  status: 'APPROVED',
  projectDate: '',
  startDate: '',
  endDate: '',
  budget: 0,
  items: [] as any[],
})

const loading = ref(false)

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

const totalBudget = computed(() => {
  if (form.value.items.length === 0) {
    return form.value.budget
  }
  return form.value.items.reduce((sum, item) => {
    return sum + item.quantity * item.price
  }, 0)
})

function addItem() {
  form.value.items.push({
    productId: null,
    name: '',
    quantity: 1,
    unit: 'pcs',
    price: 0,
    cost: 0,
  })
}

function removeItem(index: number) {
  form.value.items.splice(index, 1)
}

function openProductModal(index: number) {
  selectedItemIndex.value = index
  productSearch.value = ''
  productModal.value?.showModal()
}

function closeProductModal() {
  productModal.value?.close()
  selectedItemIndex.value = null
}

function selectProduct(product: any) {
  if (selectedItemIndex.value !== null) {
    const item = form.value.items[selectedItemIndex.value]
    if (item) {
      item.productId = product.id
      item.name = product.name
      item.unit = product.unit
      item.price = parseFloat(product.sellingPrice)
      item.cost = parseFloat(product.purchasePrice)
    }
  }
  closeProductModal()
}

function getCategoryBadge(category: string) {
  const badges: Record<string, string> = {
    CCTV: 'badge-primary',
    NETWORK: 'badge-secondary',
    ACCESSORIES: 'badge-accent',
    SERVICE: 'badge-info',
    COMBO: 'badge-warning',
  }
  return badges[category] || 'badge-ghost'
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

async function handleSubmit() {
  if (!form.value.customerId || !form.value.title) {
    return
  }

  loading.value = true

  try {
    const payload = {
      ...form.value,
      budget: totalBudget.value,
      projectDate: form.value.projectDate || undefined,
      startDate: form.value.startDate || undefined,
      endDate: form.value.endDate || undefined,
      items: form.value.items.length > 0 ? form.value.items : undefined,
    }

    const project = await $fetch('/api/projects/create', {
      method: 'POST',
      body: payload,
    })

    success('Project berhasil dibuat')
    navigateTo(`/projects/${project.id}`)
  } catch (error: any) {
    console.error('Error creating project:', error)
    showError(error?.data?.statusMessage || 'Gagal membuat project')
  } finally {
    loading.value = false
  }
}
</script>
