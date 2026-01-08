<template>
  <div class="container mx-auto p-4 sm:p-6 max-w-5xl">
    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Content -->
    <div v-else-if="packageData">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div class="flex items-center gap-4">
          <NuxtLink to="/packages" class="btn btn-ghost btn-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </NuxtLink>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold">{{ packageData.name }}</h1>
            <div class="flex gap-2 mt-2">
              <span
                v-if="packageData.category"
                class="badge"
                :class="getCategoryBadge(packageData.category)"
              >
                {{ packageData.category }}
              </span>
              <span class="badge" :class="packageData.isActive ? 'badge-success' : 'badge-error'">
                {{ packageData.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="toggleEdit" class="btn btn-primary btn-sm sm:btn-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {{ editMode ? 'Batal' : 'Edit' }}
          </button>
          <button @click="confirmDelete" class="btn btn-error btn-outline btn-sm sm:btn-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Hapus
          </button>
        </div>
      </div>

      <!-- View Mode -->
      <div v-if="!editMode" class="space-y-6">
        <!-- Info -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 sm:p-6">
            <h2 class="card-title text-base sm:text-lg">Informasi Paket</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-base-content/60">Nama Paket</div>
                <div class="font-medium">{{ packageData.name }}</div>
              </div>
              <div>
                <div class="text-sm text-base-content/60">Total Harga</div>
                <div class="text-lg font-bold text-primary">
                  {{ formatCurrency(packageData.totalPrice) }}
                </div>
              </div>
              <div v-if="packageData.description" class="sm:col-span-2">
                <div class="text-sm text-base-content/60">Deskripsi</div>
                <div>{{ packageData.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 sm:p-6">
            <h2 class="card-title text-base sm:text-lg">Item Paket</h2>

            <!-- Desktop Table -->
            <div class="hidden sm:block overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Harga Satuan</th>
                    <th class="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in packageData.items" :key="item.id">
                    <td>
                      <div class="font-bold">{{ item.name }}</div>
                      <div v-if="item.product" class="text-xs text-base-content/60">
                        {{ item.product.sku }}
                      </div>
                    </td>
                    <td class="text-center">{{ item.quantity }} {{ item.unit }}</td>
                    <td class="text-right font-mono">{{ formatCurrency(item.price) }}</td>
                    <td class="text-right font-mono font-bold">{{ formatCurrency(item.total) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="font-bold">
                    <td colspan="3" class="text-right">TOTAL</td>
                    <td class="text-right font-mono text-primary text-lg">
                      {{ formatCurrency(packageData.totalPrice) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Mobile Cards -->
            <div class="sm:hidden space-y-3">
              <div v-for="item in packageData.items" :key="item.id" class="card bg-base-200">
                <div class="card-body p-3">
                  <div class="font-bold">{{ item.name }}</div>
                  <div v-if="item.product" class="text-xs text-base-content/60">
                    {{ item.product.sku }}
                  </div>
                  <div class="flex justify-between mt-2">
                    <span class="text-sm">{{ item.quantity }} {{ item.unit }}</span>
                    <span class="text-sm font-mono">{{ formatCurrency(item.price) }}</span>
                  </div>
                  <div class="text-right font-bold text-primary">
                    {{ formatCurrency(item.total) }}
                  </div>
                </div>
              </div>
              <div class="card bg-base-200">
                <div class="card-body p-3">
                  <div class="flex justify-between items-center">
                    <span class="font-bold">TOTAL</span>
                    <span class="text-lg font-bold text-primary">
                      {{ formatCurrency(packageData.totalPrice) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Mode -->
      <div v-else class="space-y-6">
        <!-- Info -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 sm:p-6">
            <h2 class="card-title text-base sm:text-lg">Edit Informasi Paket</h2>

            <div class="form-control w-full">
              <label class="label"><span class="label-text">Nama Paket *</span></label>
              <input
                v-model="editForm.name"
                type="text"
                class="input input-bordered input-sm sm:input-md w-full"
                required
              />
            </div>

            <div class="form-control w-full">
              <label class="label"><span class="label-text">Deskripsi</span></label>
              <textarea
                v-model="editForm.description"
                class="textarea textarea-bordered textarea-sm sm:textarea-md"
                rows="3"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-control w-full">
                <label class="label"><span class="label-text">Kategori</span></label>
                <select
                  v-model="editForm.category"
                  class="select select-bordered select-sm sm:select-md"
                >
                  <option value="">Pilih Kategori</option>
                  <option value="CCTV">CCTV</option>
                  <option value="NETWORK">Network</option>
                  <option value="COMBO">Combo</option>
                </select>
              </div>

              <div class="form-control w-full">
                <label class="label"><span class="label-text">Status</span></label>
                <select
                  v-model="editForm.isActive"
                  class="select select-bordered select-sm sm:select-md"
                >
                  <option :value="true">Aktif</option>
                  <option :value="false">Nonaktif</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 sm:p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="card-title text-base sm:text-lg">Edit Item Paket</h2>
              <button @click="addEditItem" class="btn btn-sm btn-ghost">+ Tambah Item</button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th class="w-20">Qty</th>
                    <th class="w-24">Unit</th>
                    <th class="w-32">Harga</th>
                    <th class="w-32">Subtotal</th>
                    <th class="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in editForm.items" :key="idx">
                    <td>
                      <AppProductSelect
                        v-model="item.name"
                        placeholder="Pilih produk"
                        @select="onProductSelect(idx, $event)"
                      />
                    </td>
                    <td>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        class="input input-bordered input-sm w-full"
                      />
                    </td>
                    <td>
                      <select v-model="item.unit" class="select select-bordered select-sm w-full">
                        <option v-for="unit in units" :key="unit.id" :value="unit.symbol">
                          {{ unit.symbol }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        v-model.number="item.price"
                        type="number"
                        min="0"
                        class="input input-bordered input-sm w-full"
                      />
                    </td>
                    <td class="font-mono font-medium">
                      {{ formatCurrency(item.quantity * item.price) }}
                    </td>
                    <td>
                      <button @click="removeEditItem(idx)" class="btn btn-sm btn-ghost btn-circle">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Save -->
        <div class="flex justify-end gap-2">
          <button @click="toggleEdit" class="btn btn-ghost">Batal</button>
          <button @click="handleUpdate" class="btn btn-primary" :disabled="!canUpdate || updating">
            <span v-if="updating" class="loading loading-spinner loading-sm"></span>
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { formatCurrency } = useFormatter()
const { success, error: showError } = useAlert()
const { confirm } = useConfirm()

const packageId = route.params.id as string
const editMode = ref(false)
const updating = ref(false)

const { data: packageData, pending, refresh } = await useFetch(`/api/packages/${packageId}`)
const { data: units } = await useFetch('/api/units')
const { data: products } = await useFetch('/api/products')

interface EditItem {
  productId: string | null
  name: string
  quantity: number
  unit: string
  price: number
}

const editForm = reactive({
  name: '',
  description: '',
  category: '',
  isActive: true,
  items: [] as EditItem[],
})

const getCategoryBadge = (cat: string) => {
  const badges: Record<string, string> = {
    CCTV: 'badge-primary',
    NETWORK: 'badge-secondary',
    COMBO: 'badge-accent',
  }
  return badges[cat] || 'badge-ghost'
}

const canUpdate = computed(() => {
  return (
    editForm.name &&
    editForm.items.length > 0 &&
    editForm.items.every(i => i.name && i.quantity > 0 && i.price >= 0)
  )
})

const toggleEdit = () => {
  if (!editMode.value && packageData.value) {
    // Entering edit mode
    editForm.name = packageData.value.name
    editForm.description = packageData.value.description || ''
    editForm.category = packageData.value.category || ''
    editForm.isActive = packageData.value.isActive
    editForm.items = packageData.value.items.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: parseFloat(item.price),
    }))
  }
  editMode.value = !editMode.value
}

const addEditItem = () => {
  editForm.items.push({
    productId: null,
    name: '',
    quantity: 1,
    unit: 'pcs',
    price: 0,
  })
}

const removeEditItem = (index: number) => {
  editForm.items.splice(index, 1)
}

const onProductSelect = (index: number, event: any) => {
  const item = editForm.items[index]
  if (!item || !event) return

  const product = products.value?.find((p: any) => p.id === event.id)
  if (product) {
    item.productId = product.id
    item.name = product.name
    item.unit = product.unit || 'pcs'
    item.price = parseFloat(product.sellingPrice)
  }
}

const handleUpdate = async () => {
  if (!canUpdate.value) return

  updating.value = true
  try {
    await $fetch(`/api/packages/${packageId}`, {
      method: 'PUT',
      body: editForm,
    })
    success('Paket berhasil diperbarui')
    editMode.value = false
    refresh()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal memperbarui paket')
  } finally {
    updating.value = false
  }
}

const confirmDelete = async () => {
  const confirmed = await confirm(
    'Hapus paket ini?',
    'Paket dan semua item di dalamnya akan dihapus. Aksi ini tidak dapat dibatalkan.'
  )

  if (confirmed) {
    try {
      await $fetch(`/api/packages/${packageId}`, { method: 'DELETE' })
      success('Paket berhasil dihapus')
      await navigateTo('/packages')
    } catch (err: any) {
      showError(err.data?.message || 'Gagal menghapus paket')
    }
  }
}
</script>
