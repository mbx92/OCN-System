<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()

// Expenses data
const expenses = ref<any[]>([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
})

// Filters
const selectedType = ref('')
const searchQuery = ref('')
const fromDate = ref('')
const toDate = ref('')
const selectedProject = ref('')

// View mode
const viewMode = ref<'GRID' | 'LIST'>('GRID')

// Modal state
const showModal = ref(false)
const editingExpense = ref<any>(null)
const form = ref({
  type: 'OPERATIONAL',
  category: '',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  projectId: '',
  receipt: '',
})

// Projects for dropdown
const projects = ref<any[]>([])

const expenseTypes = [
  { value: 'PROJECT', label: 'Pengeluaran Project' },
  { value: 'OPERATIONAL', label: 'Operasional' },
  { value: 'SALARY', label: 'Gaji/Fee' },
  { value: 'ASSET', label: 'Pembelian Asset' },
]

const commonCategories = [
  'Transport',
  'Konsumsi',
  'Material',
  'Peralatan',
  'ATK',
  'Listrik',
  'Air',
  'Telepon/Internet',
  'Sewa',
  'Lain-lain',
]

// Load data
async function loadExpenses() {
  loading.value = true
  try {
    const query: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    }

    if (selectedType.value) query.type = selectedType.value
    if (searchQuery.value) query.search = searchQuery.value
    if (fromDate.value) query.fromDate = fromDate.value
    if (toDate.value) query.toDate = toDate.value
    if (selectedProject.value) query.projectId = selectedProject.value

    const data = await $fetch('/api/expenses', {
      query,
    })

    if (data) {
      expenses.value = data.expenses
      pagination.value = data.pagination
    }
  } catch (error: any) {
    console.error('Error loading expenses:', error)
    const { showAlert } = useAlert()
    showAlert(error.data?.statusMessage || 'Gagal memuat data pengeluaran', 'error')
  } finally {
    loading.value = false
  }
}

async function loadProjects() {
  try {
    const data = await $fetch('/api/projects', {
      query: { limit: 1000 },
    })
    if (data) {
      projects.value = (data as any).projects || (data as any).data || []
    }
  } catch (error) {
    console.error('Error loading projects:', error)
  }
}

// Open modal for create or edit
function openModal(expense: any = null) {
  editingExpense.value = expense
  if (expense) {
    form.value = {
      type: expense.type,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split('T')[0],
      projectId: expense.projectId || '',
      receipt: expense.receipt || '',
    }
  } else {
    form.value = {
      type: 'OPERATIONAL',
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      projectId: '',
      receipt: '',
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingExpense.value = null
}

// Save expense
async function saveExpense() {
  const { showAlert } = useAlert()

  if (!form.value.category || !form.value.description || !form.value.amount) {
    showAlert('Mohon lengkapi semua field yang diperlukan', 'error')
    return
  }

  try {
    if (editingExpense.value) {
      // Update
      await $fetch(`/api/expenses/${editingExpense.value.id}`, {
        method: 'PUT',
        body: form.value,
      })
      showAlert('Pengeluaran berhasil diperbarui', 'success')
    } else {
      // Create
      await $fetch('/api/expenses', {
        method: 'POST',
        body: form.value,
      })
      showAlert('Pengeluaran berhasil ditambahkan', 'success')
    }

    closeModal()
    loadExpenses()
  } catch (error: any) {
    console.error('Error saving expense:', error)
    showAlert(error.data?.statusMessage || 'Gagal menyimpan pengeluaran', 'error')
  }
}

// Delete expense
async function deleteExpense(id: string) {
  const { showAlert } = useAlert()
  const { confirm } = useConfirm()

  const confirmed = await confirm({
    title: 'Hapus Pengeluaran',
    message: 'Apakah Anda yakin ingin menghapus pengeluaran ini?',
    confirmText: 'Hapus',
    cancelText: 'Batal',
  })

  if (!confirmed) return

  try {
    await $fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    })
    showAlert('Pengeluaran berhasil dihapus', 'success')
    loadExpenses()
  } catch (error: any) {
    console.error('Error deleting expense:', error)
    showAlert(error.data?.statusMessage || 'Gagal menghapus pengeluaran', 'error')
  }
}

// Reset filters
function resetFilters() {
  selectedType.value = ''
  searchQuery.value = ''
  fromDate.value = ''
  toDate.value = ''
  selectedProject.value = ''
  pagination.value.page = 1
  loadExpenses()
}

// Pagination
function changePage(page: number) {
  pagination.value.page = page
  loadExpenses()
}

// Get type label
function getTypeLabel(type: string) {
  return expenseTypes.find(t => t.value === type)?.label || type
}

// Get type color
function getTypeColor(type: string) {
  switch (type) {
    case 'PROJECT':
      return 'badge-primary'
    case 'OPERATIONAL':
      return 'badge-info'
    case 'SALARY':
      return 'badge-warning'
    case 'ASSET':
      return 'badge-success'
    default:
      return 'badge-ghost'
  }
}

// Watch filters
watch([selectedType, searchQuery, fromDate, toDate, selectedProject], () => {
  pagination.value.page = 1
  loadExpenses()
})

// Init
onMounted(() => {
  loadExpenses()
  loadProjects()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Pengeluaran</h1>
        <p class="text-base-content/60">Kelola semua pengeluaran perusahaan</p>
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
        Tambah Pengeluaran
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
            placeholder="Cari deskripsi/kategori..."
            class="input input-bordered flex-1"
          />

          <!-- Type Filter -->
          <select v-model="selectedType" class="select select-bordered w-full lg:w-48">
            <option value="">Semua Tipe</option>
            <option v-for="type in expenseTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>

          <!-- Project Filter -->
          <select v-model="selectedProject" class="select select-bordered w-full lg:w-48">
            <option value="">Semua Project</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.projectNumber }} - {{ project.title }}
            </option>
          </select>

          <!-- From Date -->
          <input v-model="fromDate" type="date" class="input input-bordered w-full lg:w-40" />

          <!-- To Date -->
          <input v-model="toDate" type="date" class="input input-bordered w-full lg:w-40" />

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
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <!-- Empty State -->
    <div v-else-if="expenses.length === 0" class="text-center py-8 text-base-content/60">
      Tidak ada data pengeluaran
    </div>

    <!-- Grid View -->
    <div
      v-else-if="viewMode === 'GRID'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="expense in expenses"
        :key="expense.id"
        class="card bg-base-100 shadow hover:shadow-md transition-shadow"
      >
        <div class="card-body p-4">
          <div class="flex justify-between items-start mb-3">
            <div>
              <span class="badge badge-sm" :class="getTypeColor(expense.type)">
                {{ getTypeLabel(expense.type) }}
              </span>
              <span class="text-xs text-base-content/60 ml-2">{{ expense.category }}</span>
            </div>
            <div class="text-sm text-base-content/60">{{ formatDate(expense.date) }}</div>
          </div>
          <p class="text-sm line-clamp-2 mb-2">{{ expense.description }}</p>
          <div v-if="expense.project" class="text-xs text-base-content/60 mb-3">
            <span class="font-medium">{{ expense.project.projectNumber }}</span>
            - {{ expense.project.title }}
          </div>
          <div class="flex justify-between items-end mt-auto">
            <div class="text-lg font-bold text-primary">
              {{ formatCurrency(expense.amount) }}
            </div>
            <div class="flex gap-1">
              <button @click="openModal(expense)" class="btn btn-ghost btn-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button @click="deleteExpense(expense.id)" class="btn btn-ghost btn-xs text-error">
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
          </div>
          <div v-if="expense.createdByUser" class="text-xs text-base-content/50 mt-2">
            Oleh: {{ expense.createdByUser.name || expense.createdByUser.username }}
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="card bg-base-100 shadow-sm">
      <div class="card-body p-4 sm:p-6">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Project</th>
                <th class="text-right">Jumlah</th>
                <th>Dibuat Oleh</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in expenses" :key="expense.id">
                <td>{{ formatDate(expense.date) }}</td>
                <td>
                  <span class="badge badge-sm" :class="getTypeColor(expense.type)">
                    {{ getTypeLabel(expense.type) }}
                  </span>
                </td>
                <td>{{ expense.category }}</td>
                <td>
                  <div class="max-w-xs truncate">{{ expense.description }}</div>
                </td>
                <td>
                  <div v-if="expense.project" class="text-sm">
                    <div class="font-medium">{{ expense.project.projectNumber }}</div>
                    <div class="text-base-content/60 truncate max-w-xs">
                      {{ expense.project.title }}
                    </div>
                  </div>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td class="text-right font-medium">{{ formatCurrency(expense.amount) }}</td>
                <td>
                  <div v-if="expense.createdByUser" class="text-sm">
                    {{ expense.createdByUser.name || expense.createdByUser.username }}
                  </div>
                </td>
                <td>
                  <div class="flex justify-center gap-2">
                    <button @click="openModal(expense)" class="btn btn-ghost btn-xs">
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
                      @click="deleteExpense(expense.id)"
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

    <!-- Modal -->
    <div v-if="showModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          {{ editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran' }}
        </h3>

        <div class="space-y-4">
          <!-- Type -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Tipe Pengeluaran *</span>
            </label>
            <select v-model="form.type" class="select select-bordered w-full">
              <option v-for="type in expenseTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Project (if type is PROJECT) -->
          <div v-if="form.type === 'PROJECT'" class="form-control">
            <label class="label">
              <span class="label-text">Project *</span>
            </label>
            <select v-model="form.projectId" class="select select-bordered w-full">
              <option value="">Pilih Project</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.projectNumber }} - {{ project.title }}
              </option>
            </select>
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

          <!-- Description -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Deskripsi *</span>
            </label>
            <textarea
              v-model="form.description"
              class="textarea textarea-bordered w-full"
              rows="3"
              placeholder="Deskripsi pengeluaran"
            ></textarea>
          </div>

          <!-- Amount & Date -->
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Jumlah *</span>
              </label>
              <input
                v-model="form.amount"
                type="number"
                class="input input-bordered w-full"
                placeholder="0"
                step="0.01"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Tanggal *</span>
              </label>
              <input v-model="form.date" type="date" class="input input-bordered w-full" />
            </div>
          </div>

          <!-- Receipt -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Bukti/Keterangan</span>
            </label>
            <input
              v-model="form.receipt"
              type="text"
              class="input input-bordered w-full"
              placeholder="Nomor bukti atau keterangan tambahan"
            />
          </div>
        </div>

        <div class="modal-action">
          <button @click="closeModal" class="btn">Batal</button>
          <button @click="saveExpense" class="btn btn-primary">
            {{ editingExpense ? 'Update' : 'Simpan' }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeModal"></div>
    </div>
  </div>
</template>
