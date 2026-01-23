<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()

// Assets data
const assets = ref<any[]>([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
})

// Filters
const selectedCategory = ref('')
const selectedStatus = ref('')
const selectedCondition = ref('')
const searchQuery = ref('')
const viewMode = ref<'GRID' | 'LIST'>('LIST')

// Modal state
const showModal = ref(false)
const editingAsset = ref<any>(null)
const form = ref({
  name: '',
  category: '',
  description: '',
  purchaseDate: '',
  purchasePrice: '',
  currentValue: '',
  serialNumber: '',
  location: '',
  condition: 'GOOD',
  status: 'ACTIVE',
  depreciationRate: '',
  notes: '',
  photo: '',
})

const assetConditions = [
  { value: 'EXCELLENT', label: 'Sangat Baik', color: 'badge-success' },
  { value: 'GOOD', label: 'Baik', color: 'badge-info' },
  { value: 'FAIR', label: 'Cukup', color: 'badge-warning' },
  { value: 'POOR', label: 'Kurang', color: 'badge-error' },
  { value: 'BROKEN', label: 'Rusak', color: 'badge-error' },
]

const assetStatuses = [
  { value: 'ACTIVE', label: 'Aktif', color: 'badge-success' },
  { value: 'IDLE', label: 'Tidak Terpakai', color: 'badge-warning' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'badge-info' },
  { value: 'DISPOSED', label: 'Dibuang', color: 'badge-ghost' },
]

const commonCategories = [
  'Kendaraan',
  'Komputer & Laptop',
  'Peralatan Kantor',
  'Furniture',
  'Mesin & Peralatan',
  'Elektronik',
  'Peralatan Keamanan',
  'Lain-lain',
]

// Load data
async function loadAssets() {
  loading.value = true
  try {
    const query: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    }

    if (selectedCategory.value) query.category = selectedCategory.value
    if (selectedStatus.value) query.status = selectedStatus.value
    if (selectedCondition.value) query.condition = selectedCondition.value
    if (searchQuery.value) query.search = searchQuery.value

    const data: any = await $fetch('/api/assets', {
      query,
    })

    if (data) {
      assets.value = data.data || []
      pagination.value = {
        page: data.page || query.page,
        limit: data.limit || query.limit,
        total: data.total || 0,
        totalPages: data.totalPages || Math.ceil((data.total || 0) / query.limit),
      }
    }
  } catch (error: any) {
    console.error('Error loading assets:', error)
    showAlert(error.data?.statusMessage || 'Gagal memuat data asset', 'error')
  } finally {
    loading.value = false
  }
}

// Open modal for create or edit
function openModal(asset: any = null) {
  const today = new Date().toISOString().split('T')[0]

  editingAsset.value = asset
  if (asset) {
    form.value = {
      name: asset.name,
      category: asset.category,
      description: asset.description || '',
      purchaseDate: new Date(asset.purchaseDate).toISOString().split('T')[0],
      purchasePrice: asset.purchasePrice.toString(),
      currentValue: asset.currentValue?.toString() || '',
      serialNumber: asset.serialNumber || '',
      location: asset.location || '',
      condition: asset.condition,
      status: asset.status,
      depreciationRate: asset.depreciationRate?.toString() || '',
      notes: asset.notes || '',
      photo: asset.photo || '',
    }
  } else {
    form.value = {
      name: '',
      category: '',
      description: '',
      purchaseDate: today,
      purchasePrice: '',
      currentValue: '',
      serialNumber: '',
      location: '',
      condition: 'GOOD',
      status: 'ACTIVE',
      depreciationRate: '',
      notes: '',
      photo: '',
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingAsset.value = null
}

// Save asset
async function saveAsset() {
  if (!form.value.name || !form.value.category || !form.value.purchasePrice) {
    showAlert('Mohon lengkapi semua field yang diperlukan', 'error')
    return
  }

  try {
    if (editingAsset.value) {
      // Update
      await $fetch(`/api/assets/${editingAsset.value.id}`, {
        method: 'PUT',
        body: form.value,
      })
      showAlert('Asset berhasil diperbarui', 'success')
    } else {
      // Create
      await $fetch('/api/assets', {
        method: 'POST',
        body: form.value,
      })
      showAlert('Asset berhasil ditambahkan', 'success')
    }

    closeModal()
    loadAssets()
  } catch (error: any) {
    console.error('Error saving asset:', error)
    showAlert(error.data?.statusMessage || 'Gagal menyimpan asset', 'error')
  }
}

// Delete asset
async function deleteAsset(id: string) {
  const { confirm } = useConfirm()

  const confirmed = await confirm({
    title: 'Hapus Asset',
    message: 'Apakah Anda yakin ingin menghapus asset ini?',
    confirmText: 'Hapus',
    cancelText: 'Batal',
  })

  if (!confirmed) return

  try {
    await $fetch(`/api/assets/${id}`, {
      method: 'DELETE',
    })
    showAlert('Asset berhasil dihapus', 'success')
    loadAssets()
  } catch (error: any) {
    console.error('Error deleting asset:', error)
    showAlert(error.data?.statusMessage || 'Gagal menghapus asset', 'error')
  }
}

// Reset filters
function resetFilters() {
  selectedCategory.value = ''
  selectedStatus.value = ''
  selectedCondition.value = ''
  searchQuery.value = ''
  pagination.value.page = 1
  loadAssets()
}

// Pagination
function changePage(page: number) {
  pagination.value.page = page
  loadAssets()
}

// Get status/condition label and color
function getConditionInfo(condition: string) {
  return assetConditions.find(c => c.value === condition) || assetConditions[1]
}

function getStatusInfo(status: string) {
  return assetStatuses.find(s => s.value === status) || assetStatuses[0]
}

// Calculate depreciation
function calculateDepreciation(asset: any) {
  if (!asset.depreciationRate) return 0

  const purchaseDate = new Date(asset.purchaseDate)
  const now = new Date()
  const monthsElapsed = Math.floor(
    (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  const depreciation = ((asset.purchasePrice * asset.depreciationRate) / 100 / 12) * monthsElapsed
  return Math.min(depreciation, asset.purchasePrice)
}

// Watch filters
watch([selectedCategory, selectedStatus, selectedCondition, searchQuery], () => {
  pagination.value.page = 1
  loadAssets()
})

// Init
onMounted(() => {
  loadAssets()
})
</script>

<template>
  <ClientOnly>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">Manajemen Asset</h1>
          <p class="text-base-content/60">Kelola asset perusahaan</p>
        </div>
        <button @click="openModal()" class="btn btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Asset
        </button>
      </div>

      <!-- Filters -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- View Toggle -->
            <AppViewToggle v-model="viewMode" />

            <!-- Search -->
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama/nomor/serial/lokasi..."
              class="input input-bordered flex-1"
            />

            <!-- Category Filter -->
            <select v-model="selectedCategory" class="select select-bordered w-full lg:w-48">
              <option value="">Semua Kategori</option>
              <option v-for="cat in commonCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>

            <!-- Status Filter -->
            <select v-model="selectedStatus" class="select select-bordered w-full lg:w-48">
              <option value="">Semua Status</option>
              <option v-for="status in assetStatuses" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>

            <!-- Condition Filter -->
            <select v-model="selectedCondition" class="select select-bordered w-full lg:w-48">
              <option value="">Semua Kondisi</option>
              <option v-for="cond in assetConditions" :key="cond.value" :value="cond.value">
                {{ cond.label }}
              </option>
            </select>

            <!-- Reset Button -->
            <button @click="resetFilters" class="btn btn-ghost">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Grid View -->
      <div
        v-else-if="viewMode === 'GRID'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-if="assets.length === 0"
          class="col-span-full text-center py-12 text-base-content/60"
        >
          Tidak ada data asset
        </div>

        <div
          v-for="asset in assets"
          :key="asset.id"
          class="card bg-base-100 shadow hover:shadow-md transition-shadow"
        >
          <div class="card-body p-4">
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="text-xs text-base-content/60">{{ asset.assetNumber }}</div>
                <h3 class="font-bold">{{ asset.name }}</h3>
                <div class="text-sm text-base-content/60">{{ asset.category }}</div>
              </div>
              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </label>
                <ul
                  tabindex="0"
                  class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li><a @click="openModal(asset)">Edit</a></li>
                  <li><a @click="deleteAsset(asset.id)" class="text-error">Hapus</a></li>
                </ul>
              </div>
            </div>

            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-base-content/60">Tanggal Beli:</span>
                <span>{{ formatDate(asset.purchaseDate) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-base-content/60">Harga Beli:</span>
                <span class="font-medium">{{ formatCurrency(asset.purchasePrice) }}</span>
              </div>
              <div v-if="asset.currentValue" class="flex justify-between text-sm">
                <span class="text-base-content/60">Nilai Sekarang:</span>
                <span class="font-medium">{{ formatCurrency(asset.currentValue) }}</span>
              </div>
              <div v-if="asset.location" class="flex justify-between text-sm">
                <span class="text-base-content/60">Lokasi:</span>
                <span>{{ asset.location }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <span class="badge badge-sm" :class="getStatusInfo(asset.status).color">
                {{ getStatusInfo(asset.status).label }}
              </span>
              <span class="badge badge-sm" :class="getConditionInfo(asset.condition).color">
                {{ getConditionInfo(asset.condition).label }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="card bg-base-100 shadow-sm">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>No. Asset</th>
                  <th>Nama Asset</th>
                  <th>Kategori</th>
                  <th>Tanggal Beli</th>
                  <th class="text-right">Harga Beli</th>
                  <th class="text-right">Nilai Sekarang</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Kondisi</th>
                  <th class="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="assets.length === 0">
                  <td colspan="10" class="text-center py-8 text-base-content/60">
                    Tidak ada data asset
                  </td>
                </tr>
                <tr v-for="asset in assets" :key="asset.id">
                  <td class="font-mono text-sm">{{ asset.assetNumber }}</td>
                  <td>
                    <div class="font-medium">{{ asset.name }}</div>
                    <div v-if="asset.serialNumber" class="text-xs text-base-content/60">
                      SN: {{ asset.serialNumber }}
                    </div>
                  </td>
                  <td>{{ asset.category }}</td>
                  <td>{{ formatDate(asset.purchaseDate) }}</td>
                  <td class="text-right">{{ formatCurrency(asset.purchasePrice) }}</td>
                  <td class="text-right">
                    <span v-if="asset.currentValue">{{ formatCurrency(asset.currentValue) }}</span>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                  <td>
                    <span v-if="asset.location">{{ asset.location }}</span>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                  <td>
                    <span class="badge badge-sm" :class="getStatusInfo(asset.status).color">
                      {{ getStatusInfo(asset.status).label }}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-sm" :class="getConditionInfo(asset.condition).color">
                      {{ getConditionInfo(asset.condition).label }}
                    </span>
                  </td>
                  <td>
                    <div class="flex justify-center gap-2">
                      <button @click="openModal(asset)" class="btn btn-ghost btn-xs">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        @click="deleteAsset(asset.id)"
                        class="btn btn-ghost btn-xs text-error"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <AppPagination
        v-if="pagination.totalPages > 1"
        :total="pagination.total"
        :per-page="pagination.limit"
        :current-page="pagination.page"
        @update:current-page="changePage"
      />
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal modal-open">
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-lg mb-4">
          {{ editingAsset ? 'Edit Asset' : 'Tambah Asset' }}
        </h3>

        <div class="grid grid-cols-2 gap-4">
          <!-- Name -->
          <div class="col-span-2 form-control">
            <label class="label">
              <span class="label-text">Nama Asset *</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              class="input input-bordered w-full"
              placeholder="Nama asset"
            />
          </div>

          <!-- Category -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Kategori *</span>
            </label>
            <select v-model="form.category" class="select select-bordered w-full">
              <option value="">Pilih kategori</option>
              <option v-for="cat in commonCategories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <!-- Serial Number -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Serial Number</span>
            </label>
            <input
              v-model="form.serialNumber"
              type="text"
              class="input input-bordered w-full"
              placeholder="SN/Nomor seri"
            />
          </div>

          <!-- Purchase Date -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Tanggal Pembelian *</span>
            </label>
            <input v-model="form.purchaseDate" type="date" class="input input-bordered w-full" />
          </div>

          <!-- Purchase Price -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Harga Pembelian *</span>
            </label>
            <input
              v-model="form.purchasePrice"
              type="number"
              class="input input-bordered w-full"
              placeholder="0"
              step="0.01"
            />
          </div>

          <!-- Current Value -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Nilai Sekarang</span>
            </label>
            <input
              v-model="form.currentValue"
              type="number"
              class="input input-bordered w-full"
              placeholder="0"
              step="0.01"
            />
          </div>

          <!-- Depreciation Rate -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Depresiasi/Tahun (%)</span>
            </label>
            <input
              v-model="form.depreciationRate"
              type="number"
              class="input input-bordered w-full"
              placeholder="0"
              step="0.1"
              max="100"
            />
          </div>

          <!-- Location -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Lokasi</span>
            </label>
            <input
              v-model="form.location"
              type="text"
              class="input input-bordered w-full"
              placeholder="Lokasi penyimpanan"
            />
          </div>

          <!-- Status -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Status *</span>
            </label>
            <select v-model="form.status" class="select select-bordered w-full">
              <option v-for="status in assetStatuses" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>

          <!-- Condition -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Kondisi *</span>
            </label>
            <select v-model="form.condition" class="select select-bordered w-full">
              <option v-for="cond in assetConditions" :key="cond.value" :value="cond.value">
                {{ cond.label }}
              </option>
            </select>
          </div>

          <!-- Description -->
          <div class="col-span-2 form-control">
            <label class="label">
              <span class="label-text">Deskripsi</span>
            </label>
            <textarea
              v-model="form.description"
              class="textarea textarea-bordered w-full"
              rows="2"
              placeholder="Deskripsi asset"
            ></textarea>
          </div>

          <!-- Notes -->
          <div class="col-span-2 form-control">
            <label class="label">
              <span class="label-text">Catatan</span>
            </label>
            <textarea
              v-model="form.notes"
              class="textarea textarea-bordered w-full"
              rows="2"
              placeholder="Catatan tambahan"
            ></textarea>
          </div>
        </div>

        <div class="modal-action">
          <button @click="closeModal" class="btn">Batal</button>
          <button @click="saveAsset" class="btn btn-primary">
            {{ editingAsset ? 'Update' : 'Simpan' }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeModal"></div>
    </div>

    <template #fallback>
      <div class="flex justify-center items-center h-96">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    </template>
  </ClientOnly>
</template>
