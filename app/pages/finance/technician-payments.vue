<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()

// Payments data
const payments = ref<any[]>([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
})

// Filters
const selectedTechnician = ref('')
const selectedProject = ref('')
const selectedStatus = ref('')
const selectedPeriod = ref('')
const searchQuery = ref('')

// Modal state
const showModal = ref(false)
const editingPayment = ref<any>(null)
const form = ref({
  technicianId: '',
  projectId: '',
  period: '',
  amount: '',
  description: '',
  status: 'PENDING',
  paidDate: '',
  notes: '',
})

// Data for dropdowns
const technicians = ref<any[]>([])
const projects = ref<any[]>([])

const paymentStatuses = [
  { value: 'PENDING', label: 'Pending', color: 'badge-warning' },
  { value: 'PAID', label: 'Sudah Dibayar', color: 'badge-success' },
  { value: 'CANCELLED', label: 'Dibatalkan', color: 'badge-error' },
]

// Load data
async function loadPayments() {
  loading.value = true
  try {
    const query: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    }

    if (selectedTechnician.value) query.technicianId = selectedTechnician.value
    if (selectedProject.value) query.projectId = selectedProject.value
    if (selectedStatus.value) query.status = selectedStatus.value
    if (selectedPeriod.value) query.period = selectedPeriod.value
    if (searchQuery.value) query.search = searchQuery.value

    const data: any = await $fetch('/api/technician-payments', {
      query,
    })

    if (data) {
      payments.value = data.payments
      pagination.value = data.pagination
    }
  } catch (error: any) {
    console.error('Error loading payments:', error)
    const { showAlert } = useAlert()
    showAlert(error.data?.statusMessage || 'Gagal memuat data pembayaran', 'error')
  } finally {
    loading.value = false
  }
}

async function loadTechnicians() {
  try {
    const data: any = await $fetch('/api/technicians', {
      query: { limit: 1000 },
    })
    if (data) {
      technicians.value = data || []
    }
  } catch (error) {
    console.error('Error loading technicians:', error)
  }
}

async function loadProjects() {
  try {
    const data: any = await $fetch('/api/projects', {
      query: { limit: 1000 },
    })
    if (data) {
      projects.value = data.data || []
    }
  } catch (error) {
    console.error('Error loading projects:', error)
  }
}

// Open modal for create or edit
function openModal(payment: any = null) {
  editingPayment.value = payment
  if (payment) {
    form.value = {
      technicianId: payment.technicianId,
      projectId: payment.projectId || '',
      period: payment.period || '',
      amount: payment.amount.toString(),
      description: payment.description || '',
      status: payment.status,
      paidDate: payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : '',
      notes: payment.notes || '',
    }
  } else {
    form.value = {
      technicianId: '',
      projectId: '',
      period: '',
      amount: '',
      description: '',
      status: 'PENDING',
      paidDate: '',
      notes: '',
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingPayment.value = null
}

// Save payment
async function savePayment() {
  const { showAlert } = useAlert()

  if (!form.value.technicianId || !form.value.amount) {
    showAlert('Mohon lengkapi semua field yang diperlukan', 'error')
    return
  }

  try {
    if (editingPayment.value) {
      // Update
      await $fetch(`/api/technician-payments/${editingPayment.value.id}`, {
        method: 'PUT',
        body: form.value,
      })
      showAlert('Pembayaran berhasil diperbarui', 'success')
    } else {
      // Create
      await $fetch('/api/technician-payments', {
        method: 'POST',
        body: form.value,
      })
      showAlert('Pembayaran berhasil ditambahkan', 'success')
    }

    closeModal()
    loadPayments()
  } catch (error: any) {
    console.error('Error saving payment:', error)
    showAlert(error.data?.statusMessage || 'Gagal menyimpan pembayaran', 'error')
  }
}

// Delete payment
async function deletePayment(id: string) {
  const { showAlert } = useAlert()
  const { confirm } = useConfirm()

  const confirmed = await confirm({
    title: 'Hapus Pembayaran',
    message: 'Apakah Anda yakin ingin menghapus pembayaran ini?',
    confirmText: 'Hapus',
    cancelText: 'Batal',
  })

  if (!confirmed) return

  try {
    await $fetch(`/api/technician-payments/${id}`, {
      method: 'DELETE',
    })
    showAlert('Pembayaran berhasil dihapus', 'success')
    loadPayments()
  } catch (error: any) {
    console.error('Error deleting payment:', error)
    showAlert(error.data?.statusMessage || 'Gagal menghapus pembayaran', 'error')
  }
}

// Mark as paid
async function markAsPaid(payment: any) {
  const { showAlert } = useAlert()
  const { confirm } = useConfirm()

  const confirmed = await confirm({
    title: 'Konfirmasi Pembayaran',
    message: `Tandai pembayaran ${payment.paymentNumber} sebagai sudah dibayar?`,
    confirmText: 'Ya, Sudah Dibayar',
    cancelText: 'Batal',
  })

  if (!confirmed) return

  try {
    await $fetch(`/api/technician-payments/${payment.id}`, {
      method: 'PUT',
      body: {
        status: 'PAID',
        paidDate: new Date().toISOString().split('T')[0],
      },
    })
    showAlert('Pembayaran berhasil ditandai sebagai sudah dibayar', 'success')
    loadPayments()
  } catch (error: any) {
    console.error('Error updating payment:', error)
    showAlert(error.data?.statusMessage || 'Gagal memperbarui status pembayaran', 'error')
  }
}

// Reset filters
function resetFilters() {
  selectedTechnician.value = ''
  selectedProject.value = ''
  selectedStatus.value = ''
  selectedPeriod.value = ''
  searchQuery.value = ''
  pagination.value.page = 1
  loadPayments()
}

// Pagination
function changePage(page: number) {
  pagination.value.page = page
  loadPayments()
}

// Get status info
function getStatusInfo(status: string) {
  return paymentStatuses.find(s => s.value === status) || paymentStatuses[0]
}

// Calculate total
const totalAmount = computed(() => {
  return payments.value.reduce((sum, payment) => {
    if (payment.status !== 'CANCELLED') {
      return sum + payment.amount
    }
    return sum
  }, 0)
})

const totalPaid = computed(() => {
  return payments.value.reduce((sum, payment) => {
    if (payment.status === 'PAID') {
      return sum + payment.amount
    }
    return sum
  }, 0)
})

const totalPending = computed(() => {
  return payments.value.reduce((sum, payment) => {
    if (payment.status === 'PENDING') {
      return sum + payment.amount
    }
    return sum
  }, 0)
})

// Watch filters
watch([selectedTechnician, selectedProject, selectedStatus, selectedPeriod, searchQuery], () => {
  pagination.value.page = 1
  loadPayments()
})

// Init
onMounted(() => {
  loadPayments()
  loadTechnicians()
  loadProjects()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Pembayaran Teknisi</h1>
        <p class="text-base-content/60">Kelola pembayaran fee/gaji teknisi</p>
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
        Tambah Pembayaran
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <div class="text-sm text-base-content/60">Total Pembayaran</div>
          <div class="text-2xl font-bold">{{ formatCurrency(totalAmount) }}</div>
        </div>
      </div>
      <div class="card bg-success/10 shadow-sm">
        <div class="card-body">
          <div class="text-sm text-success/80">Sudah Dibayar</div>
          <div class="text-2xl font-bold text-success">{{ formatCurrency(totalPaid) }}</div>
        </div>
      </div>
      <div class="card bg-warning/10 shadow-sm">
        <div class="card-body">
          <div class="text-sm text-warning/80">Pending</div>
          <div class="text-2xl font-bold text-warning">{{ formatCurrency(totalPending) }}</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="form-control">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nomor/deskripsi..."
              class="input input-bordered w-full"
            />
          </div>

          <!-- Technician Filter -->
          <div class="form-control">
            <select v-model="selectedTechnician" class="select select-bordered w-full">
              <option value="">Semua Teknisi</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                {{ tech.name }}
              </option>
            </select>
          </div>

          <!-- Project Filter -->
          <div class="form-control">
            <select v-model="selectedProject" class="select select-bordered w-full">
              <option value="">Semua Project</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.projectNumber }} - {{ project.title }}
              </option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="form-control">
            <select v-model="selectedStatus" class="select select-bordered w-full">
              <option value="">Semua Status</option>
              <option v-for="status in paymentStatuses" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>

          <!-- Period Filter -->
          <div class="form-control">
            <input
              v-model="selectedPeriod"
              type="month"
              class="input input-bordered w-full"
              placeholder="Filter Periode"
            />
          </div>

          <!-- Reset Button -->
          <div class="form-control">
            <button @click="resetFilters" class="btn btn-ghost w-full">
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
    </div>

    <!-- Table -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>No. Pembayaran</th>
                <th>Teknisi</th>
                <th>Project</th>
                <th>Periode</th>
                <th class="text-right">Jumlah</th>
                <th>Status</th>
                <th>Tgl Bayar</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="text-center py-8">
                  <span class="loading loading-spinner loading-md"></span>
                </td>
              </tr>
              <tr v-else-if="payments.length === 0">
                <td colspan="8" class="text-center py-8 text-base-content/60">
                  Tidak ada data pembayaran
                </td>
              </tr>
              <tr v-else v-for="payment in payments" :key="payment.id">
                <td class="font-mono text-sm">{{ payment.paymentNumber }}</td>
                <td>
                  <div class="font-medium">{{ payment.technician.name }}</div>
                  <div v-if="payment.technician.phone" class="text-xs text-base-content/60">
                    {{ payment.technician.phone }}
                  </div>
                </td>
                <td>
                  <div v-if="payment.project" class="text-sm">
                    <div class="font-medium">{{ payment.project.projectNumber }}</div>
                    <div class="text-base-content/60 truncate max-w-xs">
                      {{ payment.project.title }}
                    </div>
                  </div>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td>
                  <span v-if="payment.period">{{ payment.period }}</span>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td class="text-right font-medium">{{ formatCurrency(payment.amount) }}</td>
                <td>
                  <span class="badge badge-sm" :class="getStatusInfo(payment.status).color">
                    {{ getStatusInfo(payment.status).label }}
                  </span>
                </td>
                <td>
                  <span v-if="payment.paidDate">{{ formatDate(payment.paidDate) }}</span>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td>
                  <div class="flex justify-center gap-2">
                    <button
                      v-if="payment.status === 'PENDING'"
                      @click="markAsPaid(payment)"
                      class="btn btn-success btn-xs"
                      title="Tandai Sudah Dibayar"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button @click="openModal(payment)" class="btn btn-ghost btn-xs">
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
                      @click="deletePayment(payment.id)"
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
          {{ editingPayment ? 'Edit Pembayaran' : 'Tambah Pembayaran' }}
        </h3>

        <div class="space-y-4">
          <!-- Technician -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Teknisi *</span>
            </label>
            <select v-model="form.technicianId" class="select select-bordered w-full">
              <option value="">Pilih Teknisi</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                {{ tech.name }}
              </option>
            </select>
          </div>

          <!-- Project (Optional) -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Project (Opsional)</span>
            </label>
            <select v-model="form.projectId" class="select select-bordered w-full">
              <option value="">Tidak terkait project</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.projectNumber }} - {{ project.title }}
              </option>
            </select>
          </div>

          <!-- Period & Amount -->
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Periode</span>
              </label>
              <input v-model="form.period" type="month" class="input input-bordered w-full" />
            </div>

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
          </div>

          <!-- Description -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Deskripsi</span>
            </label>
            <textarea
              v-model="form.description"
              class="textarea textarea-bordered w-full"
              rows="2"
              placeholder="Deskripsi pembayaran"
            ></textarea>
          </div>

          <!-- Status & Paid Date -->
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Status *</span>
              </label>
              <select v-model="form.status" class="select select-bordered w-full">
                <option v-for="status in paymentStatuses" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Tanggal Bayar</span>
              </label>
              <input v-model="form.paidDate" type="date" class="input input-bordered w-full" />
            </div>
          </div>

          <!-- Notes -->
          <div class="form-control">
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
          <button @click="savePayment" class="btn btn-primary">
            {{ editingPayment ? 'Update' : 'Simpan' }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeModal"></div>
    </div>
  </div>
</template>
