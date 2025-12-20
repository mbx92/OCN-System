<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Purchase Orders (PO)</h1>
        <p class="text-base-content/60">Kelola pembelian barang ke supplier</p>
      </div>
      <div class="flex gap-2">
        <button @click="openCreateModal" class="btn btn-primary gap-2">
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
          PO dari Pending
        </button>
        <button @click="openDirectModal" class="btn btn-outline btn-primary gap-2">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          PO Manual
        </button>
      </div>
    </div>

    <!-- Pending PO Items List -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Item yang Perlu di-PO</h2>

        <div v-if="pendingItemsQuery.pending.value" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!pendingItems?.length" class="text-center py-8 text-base-content/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 mx-auto mb-2 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>Tidak ada item yang perlu di-PO saat ini</p>
        </div>

        <div v-else class="overflow-x-auto">
          <div class="alert alert-warning mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              {{ pendingItems.length }} item terdeteksi memiliki stok kurang saat approval proyek
            </span>
          </div>

          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Item / Produk</th>
                <th>Project</th>
                <th>Qty Butuh</th>
                <th>Stok Saat Ini</th>
                <th>Kekurangan</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pendingItems" :key="item.id">
                <td>
                  <div class="font-bold">{{ item.name }}</div>
                  <span v-if="item.product" class="text-xs text-base-content/60">
                    {{ item.product.sku }}
                  </span>
                </td>
                <td>
                  <div class="font-medium">{{ item.project?.projectNumber }}</div>
                  <div class="text-xs text-base-content/60">{{ item.project?.title }}</div>
                </td>
                <td class="text-right font-mono">{{ item.quantity }}</td>
                <td class="text-right font-mono">
                  <span :class="(item.product?.stock?.available || 0) < 0 ? 'text-error' : ''">
                    {{ item.product?.stock?.available || 0 }}
                  </span>
                </td>
                <td class="text-right font-mono text-error">
                  {{ Math.max(0, item.quantity - (item.product?.stock?.available || 0)) }}
                </td>
                <td>
                  <span v-if="item.product?.suppliers?.[0]?.supplier?.name">
                    {{ item.product.suppliers[0].supplier.name }}
                  </span>
                  <span v-else class="text-base-content/40">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PO List -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Daftar Purchase Order</h2>

        <div v-if="poListQuery.pending.value" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!poList?.length" class="text-center py-8 text-base-content/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 mx-auto mb-2 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>Belum ada Purchase Order</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-base-200">
              <tr>
                <th>No. PO</th>
                <th>Supplier</th>
                <th>Proyek</th>
                <th class="text-center">Items</th>
                <th class="text-right">Total</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="po in poList"
                :key="po.id"
                class="hover cursor-pointer"
                @click="navigateTo(`/purchase-orders/${po.id}`)"
              >
                <td class="font-mono font-bold">{{ po.poNumber }}</td>
                <td>{{ po.supplier?.name || '-' }}</td>
                <td>
                  <NuxtLink
                    v-if="po.project"
                    :to="`/projects/${po.project.id}`"
                    class="link link-primary text-sm"
                  >
                    {{ po.project.projectNumber }}
                  </NuxtLink>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td class="text-center">
                  <span class="badge badge-ghost">{{ po.items?.length || 0 }}</span>
                </td>
                <td class="text-right font-mono">{{ formatCurrency(po.totalAmount) }}</td>
                <td>
                  <span class="badge" :class="getPoStatusClass(po.status)">
                    {{ getPoStatusLabel(po.status) }}
                  </span>
                </td>
                <td class="text-sm text-base-content/60">{{ formatDate(po.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create PO Modal (Pending Items) -->
    <dialog class="modal" :class="{ 'modal-open': showCreateModal }">
      <div class="modal-box w-11/12 max-w-6xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-xl">Buat Purchase Order Baru</h3>
          <button @click="showCreateModal = false" class="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        </div>

        <div v-if="pendingItemsQuery.pending.value" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!pendingItems?.length" class="alert alert-info">
          <span>Tidak ada item yang membutuhkan PO saat ini.</span>
        </div>

        <div v-else class="space-y-6">
          <div class="alert alert-warning text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Item berikut dideteksi memiliki stok kurang saat aproval proyek.</span>
          </div>

          <!-- Supplier Selection & Notes -->
          <div class="bg-base-200 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Pilih Supplier</span>
              </label>
              <select
                v-model="selectedSupplierId"
                class="select select-bordered w-full bg-base-100"
              >
                <option value="">-- Otomatis dari item --</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <label class="label" v-if="defaultSupplierId && !selectedSupplierId">
                <span class="label-text-alt text-info">
                  Default: {{ selectedItems[0]?.product?.suppliers?.[0]?.supplier?.name || '-' }}
                </span>
              </label>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Catatan (opsional)</span>
              </label>
              <input
                v-model="poNotes"
                type="text"
                class="input input-bordered w-full bg-base-100"
                placeholder="Catatan untuk PO"
              />
            </div>
          </div>

          <div class="overflow-x-auto rounded-lg border border-base-200">
            <table class="table w-full">
              <thead class="bg-base-200">
                <tr>
                  <th class="w-12">
                    <label>
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        :checked="isAllSelected"
                        @change="toggleSelectAll"
                      />
                    </label>
                  </th>
                  <th>Item / Produk</th>
                  <th>Project</th>
                  <th class="text-right">Qty Butuh</th>
                  <th class="text-right">Stok Gudang</th>
                  <th>Supplier (Utama)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in pendingItems" :key="item.id" class="hover:bg-base-100">
                  <th>
                    <label>
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        v-model="selectedItems"
                        :value="item"
                      />
                    </label>
                  </th>
                  <td>
                    <div class="font-bold">{{ item.name }}</div>
                    <div class="text-xs text-base-content/60 font-mono mt-1">
                      {{ item.product?.sku }}
                    </div>
                  </td>
                  <td>
                    <div class="font-medium text-sm">{{ item.project?.title }}</div>
                    <div class="text-xs text-base-content/60">
                      {{ item.project?.projectNumber }}
                    </div>
                  </td>
                  <td class="text-right">
                    <span class="font-bold text-error">{{ item.quantity }}</span>
                    <span class="text-xs ml-1">{{ item.unit }}</span>
                  </td>
                  <td class="text-right text-sm">
                    <div class="flex flex-col items-end">
                      <span>Total: {{ item.product?.stock?.quantity || 0 }}</span>
                      <span class="text-xs text-base-content/60">
                        Reserved: {{ item.product?.stock?.reserved || 0 }}
                      </span>
                      <span
                        class="text-xs font-bold"
                        :class="
                          (item.product?.stock?.available || 0) < 0 ? 'text-error' : 'text-success'
                        "
                      >
                        Avail: {{ item.product?.stock?.available || 0 }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span v-if="item.product?.suppliers?.[0]" class="badge badge-outline">
                      {{ item.product.suppliers[0].supplier.name }}
                    </span>
                    <span v-else class="text-xs text-error italic">No Supplier</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-action mt-8">
          <button class="btn" @click="showCreateModal = false" :disabled="processing">Batal</button>
          <button
            class="btn btn-primary"
            :disabled="selectedItems.length === 0 || processing"
            @click="createPoFromSelection"
          >
            <span v-if="processing" class="loading loading-spinner text-primary-content"></span>
            Buat PO ({{ selectedItems.length }} Item)
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreateModal = false">close</button>
      </form>
    </dialog>

    <!-- Direct PO Modal -->
    <dialog class="modal" :class="{ 'modal-open': showDirectModal }">
      <div class="modal-box w-11/12 max-w-4xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-xl">Buat PO Manual</h3>
          <button @click="showDirectModal = false" class="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        </div>

        <!-- Supplier Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Supplier</label>
          <select v-model="directForm.supplierId" class="select select-bordered">
            <option value="">Pilih Supplier</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- Items -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <label class="label-text font-medium">Item</label>
            <button @click="addDirectItem" class="btn btn-sm btn-ghost">+ Tambah Item</button>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead class="bg-base-200">
                <tr>
                  <th>Produk</th>
                  <th class="w-24">Qty</th>
                  <th class="w-32">Harga</th>
                  <th class="w-32 text-right">Subtotal</th>
                  <th class="w-12"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in directForm.items" :key="idx">
                  <td>
                    <select
                      v-model="item.productId"
                      class="select select-sm select-bordered w-full"
                      @change="onProductSelect(idx)"
                    >
                      <option value="">Pilih Produk</option>
                      <option v-for="p in products" :key="p.id" :value="p.id">
                        {{ p.name }} ({{ p.sku }})
                      </option>
                    </select>
                  </td>
                  <td>
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      class="input input-sm input-bordered w-full"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="item.price"
                      type="number"
                      min="0"
                      class="input input-sm input-bordered w-full"
                    />
                  </td>
                  <td class="text-right font-mono">
                    {{ formatCurrency(item.quantity * item.price) }}
                  </td>
                  <td>
                    <button @click="removeDirectItem(idx)" class="btn btn-ghost btn-xs text-error">
                      ✕
                    </button>
                  </td>
                </tr>
                <tr v-if="directForm.items.length === 0">
                  <td colspan="5" class="text-center text-base-content/60 py-4">Belum ada item</td>
                </tr>
              </tbody>
              <tfoot v-if="directForm.items.length > 0">
                <tr>
                  <td colspan="3" class="text-right font-bold">Total</td>
                  <td class="text-right font-mono font-bold text-primary">
                    {{ formatCurrency(directTotal) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-control mb-4">
          <label class="label"><span class="label-text">Catatan (opsional)</span></label>
          <textarea
            v-model="directForm.notes"
            class="textarea textarea-bordered w-full"
            rows="2"
          ></textarea>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showDirectModal = false" :disabled="processingDirect">
            Batal
          </button>
          <button
            class="btn btn-primary"
            :disabled="!canCreateDirect || processingDirect"
            @click="createDirectPo"
          >
            <span v-if="processingDirect" class="loading loading-spinner"></span>
            Buat PO
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showDirectModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { showAlert } = useAlert()
const { formatCurrency, formatDate } = useFormatter()

const showCreateModal = ref(false)
const selectedItems = ref<any[]>([])
const selectedSupplierId = ref('')
const processing = ref(false)
const poNotes = ref('')

const pendingItemsQuery = await useFetch('/api/purchase-orders/pending-items')
const pendingItems = computed(() => pendingItemsQuery.data.value || [])

const poListQuery = await useFetch('/api/purchase-orders')
const poList = computed(() => poListQuery.data.value || [])

const { data: suppliers } = await useFetch('/api/suppliers')
const { data: productsData } = await useFetch('/api/products', { query: { limit: 1000 } })
const products = computed(() => (productsData.value as any)?.data || [])

// Direct PO Modal state
const showDirectModal = ref(false)
const processingDirect = ref(false)

interface DirectItem {
  productId: string
  name: string
  quantity: number
  price: number
}

const directForm = reactive({
  supplierId: '',
  notes: '',
  items: [] as DirectItem[],
})

const directTotal = computed(() => {
  return directForm.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
})

const canCreateDirect = computed(() => {
  return (
    directForm.supplierId &&
    directForm.items.length > 0 &&
    directForm.items.every(i => i.productId && i.quantity > 0)
  )
})

const openDirectModal = () => {
  directForm.supplierId = ''
  directForm.notes = ''
  directForm.items = []
  showDirectModal.value = true
}

const addDirectItem = () => {
  directForm.items.push({ productId: '', name: '', quantity: 1, price: 0 })
}

const removeDirectItem = (idx: number) => {
  directForm.items.splice(idx, 1)
}

const onProductSelect = (idx: number) => {
  const item = directForm.items[idx]
  const product = products.value.find((p: any) => p.id === item.productId)
  if (product) {
    item.name = product.name
    item.price = parseFloat(product.purchasePrice) || 0
  }
}

const createDirectPo = async () => {
  if (!canCreateDirect.value) return

  processingDirect.value = true
  try {
    const po = await $fetch('/api/purchase-orders/create-direct', {
      method: 'POST',
      body: directForm,
    })
    showAlert(`PO ${(po as any).poNumber} berhasil dibuat!`, 'success')
    showDirectModal.value = false
    poListQuery.refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal membuat PO', 'error')
  } finally {
    processingDirect.value = false
  }
}

const getPoStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PROGRESS: 'Progress',
    RECEIVED: 'Diterima',
    CANCELLED: 'Dibatalkan',
  }
  return labels[status] || status
}

const getPoStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'badge-ghost',
    PROGRESS: 'badge-warning',
    RECEIVED: 'badge-success',
    CANCELLED: 'badge-error',
  }
  return classes[status] || 'badge-ghost'
}

const isAllSelected = computed(() => {
  return pendingItems.value.length > 0 && selectedItems.value.length === pendingItems.value.length
})

// Group items by their primary supplier for convenience
const defaultSupplierId = computed(() => {
  if (selectedItems.value.length === 0) return ''
  const firstSupplier = selectedItems.value[0]?.product?.suppliers?.[0]?.supplier?.id
  return firstSupplier || ''
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = [...pendingItems.value]
  }
}

const openCreateModal = () => {
  pendingItemsQuery.refresh()
  selectedItems.value = []
  selectedSupplierId.value = ''
  poNotes.value = ''
  showCreateModal.value = true
}

const createPoFromSelection = async () => {
  if (selectedItems.value.length === 0) {
    showAlert('Pilih minimal 1 item', 'error')
    return
  }

  // Use selected supplier or default from first item
  const supplierId = selectedSupplierId.value || defaultSupplierId.value
  if (!supplierId) {
    showAlert('Pilih supplier terlebih dahulu', 'error')
    return
  }

  processing.value = true
  try {
    const projectItemIds = selectedItems.value.map(item => item.id)

    const po = await $fetch('/api/purchase-orders/create', {
      method: 'POST',
      body: {
        supplierId,
        projectItemIds,
        notes: poNotes.value,
      },
    })

    showAlert(`PO ${(po as any).poNumber} berhasil dibuat!`, 'success')
    showCreateModal.value = false
    selectedItems.value = []
    pendingItemsQuery.refresh()
    poListQuery.refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal membuat PO', 'error')
  } finally {
    processing.value = false
  }
}
</script>
