<script setup lang="ts">
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
const viewMode = ref<'GRID' | 'LIST'>('LIST')
const dateFrom = ref('')
const dateTo = ref('')

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

// Batch selection state
const selectedPayments = ref<string[]>([])
const selectAll = ref(false)

// Period slip modal state
const showPeriodSlipModal = ref(false)
const periodSlipTechnician = ref('')
const periodSlipMonth = ref('')
const periodSlipYear = ref(new Date().getFullYear())
const generatingSlip = ref(false)

// Company data
const { data: company } = await useFetch('/api/company')

// Data for dropdowns
const technicians = ref<any[]>([])
const projects = ref<any[]>([])

const paymentStatuses = [
  { value: 'PENDING', label: 'Pending', color: 'badge-warning' },
  { value: 'PAID', label: 'Sudah Dibayar', color: 'badge-success' },
  { value: 'CANCELLED', label: 'Dibatalkan', color: 'badge-error' },
]

// Available months for period slip
const availableMonths = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString().padStart(2, '0'),
  label: new Date(2000, i, 1).toLocaleString('id-ID', { month: 'long' }),
}))

// Available years for period slip
const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

// Toggle select all
function toggleSelectAll() {
  if (selectAll.value) {
    selectedPayments.value = payments.value.map(p => p.id)
  } else {
    selectedPayments.value = []
  }
}

// Toggle single selection
function togglePaymentSelection(id: string) {
  const index = selectedPayments.value.indexOf(id)
  if (index > -1) {
    selectedPayments.value.splice(index, 1)
  } else {
    selectedPayments.value.push(id)
  }

  // Update selectAll state
  selectAll.value = selectedPayments.value.length === payments.value.length
}

// Get selected payments data
function getSelectedPaymentsData() {
  return payments.value.filter(p => selectedPayments.value.includes(p.id))
}

// Generate batch payment slip PDF
async function generateBatchSlip() {
  const selectedData = getSelectedPaymentsData()
  if (selectedData.length === 0) {
    const { showAlert } = useAlert()
    showAlert('Pilih minimal 1 pembayaran', 'error')
    return
  }

  generatingSlip.value = true
  try {
    await generateSlipPDF(selectedData, 'Slip Pembayaran Gabungan')
  } finally {
    generatingSlip.value = false
  }
}

// Open period slip modal
function openPeriodSlipModal() {
  periodSlipTechnician.value = ''
  periodSlipMonth.value = (new Date().getMonth() + 1).toString().padStart(2, '0')
  periodSlipYear.value = new Date().getFullYear()
  showPeriodSlipModal.value = true
}

// Generate period-based slip
async function generatePeriodSlip() {
  const { showAlert } = useAlert()

  if (!periodSlipTechnician.value || !periodSlipMonth.value) {
    showAlert('Pilih teknisi dan bulan', 'error')
    return
  }

  generatingSlip.value = true
  try {
    // Fetch payments for selected technician and period
    const periodStr = `${periodSlipYear.value}-${periodSlipMonth.value}`
    const data: any = await $fetch('/api/technician-payments', {
      query: {
        technicianId: periodSlipTechnician.value,
        status: 'PAID',
        limit: 1000,
      },
    })

    // Filter payments by period (paidDate within the month)
    const startDate = new Date(periodSlipYear.value, parseInt(periodSlipMonth.value) - 1, 1)
    const endDate = new Date(periodSlipYear.value, parseInt(periodSlipMonth.value), 0)

    const periodPayments = (data?.payments || []).filter((p: any) => {
      if (!p.paidDate) return false
      const paidDate = new Date(p.paidDate)
      return paidDate >= startDate && paidDate <= endDate
    })

    if (periodPayments.length === 0) {
      showAlert('Tidak ada pembayaran untuk periode ini', 'warning')
      return
    }

    const techName =
      technicians.value.find(t => t.id === periodSlipTechnician.value)?.name || 'Teknisi'
    const monthName = availableMonths.find(m => m.value === periodSlipMonth.value)?.label || ''
    const title = `Slip Pembayaran ${techName} - ${monthName} ${periodSlipYear.value}`

    await generateSlipPDF(periodPayments, title)
    showPeriodSlipModal.value = false
  } catch (error: any) {
    showAlert(error.data?.message || 'Gagal membuat slip', 'error')
  } finally {
    generatingSlip.value = false
  }
}

// Generate PDF for payment slip
async function generateSlipPDF(paymentsData: any[], title: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(company.value?.name || 'OCN System', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (company.value?.address) {
    doc.text(company.value.address, pageWidth / 2, 27, { align: 'center' })
  }

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 40, { align: 'center' })

  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 50)

  // Group by technician if mixed
  const technicianGroups = paymentsData.reduce((groups: any, payment: any) => {
    const techId = payment.technicianId
    if (!groups[techId]) {
      groups[techId] = {
        name: payment.technician?.name || 'Unknown',
        payments: [],
      }
    }
    groups[techId].payments.push(payment)
    return groups
  }, {})

  let yPos = 60
  let grandTotal = 0

  // For each technician
  Object.values(technicianGroups).forEach((group: any, index: number) => {
    if (index > 0) {
      yPos += 10
    }

    // Technician name
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Teknisi: ${group.name}`, 14, yPos)
    yPos += 7

    // Table for this technician's payments
    const tableData = group.payments.map((p: any, i: number) => {
      // Build description with project info
      let desc = p.description || ''
      if (p.project) {
        const projectInfo = p.project.title || ''
        const customerInfo = p.project.customer?.name || ''
        if (projectInfo || customerInfo) {
          const parts = [projectInfo, customerInfo].filter(Boolean).join(' - ')
          desc = desc ? `${desc}\n${parts}` : parts
        }
      }

      return [
        (i + 1).toString(),
        p.paymentNumber,
        p.project?.projectNumber || p.period || '-',
        desc || '-',
        p.paidDate ? formatDate(p.paidDate) : '-',
        formatCurrency(Number(p.amount)),
      ]
    })

    const techTotal = group.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    grandTotal += techTotal

    // Add total row
    tableData.push(['', '', '', '', 'Subtotal:', formatCurrency(techTotal)])

    autoTable(doc, {
      startY: yPos,
      head: [['No', 'No. Pembayaran', 'Project/Periode', 'Deskripsi', 'Tgl Bayar', 'Jumlah']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        5: { halign: 'right' },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 5
  })

  // Grand total
  yPos += 5
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL: ${formatCurrency(grandTotal)}`, pageWidth - 14, yPos, { align: 'right' })

  // Signature section
  yPos += 20
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const signatureY = yPos
  doc.text('Penerima,', 40, signatureY)
  doc.text('Pembuat,', pageWidth - 40, signatureY, { align: 'center' })

  doc.text('(                              )', 40, signatureY + 30)
  doc.text('(                              )', pageWidth - 40, signatureY + 30, { align: 'center' })

  // Save
  const filename = title.toLowerCase().replace(/\s+/g, '-') + '.pdf'
  doc.save(filename)
}

// Load data
async function loadPayments() {
  loading.value = true
  selectedPayments.value = []
  selectAll.value = false
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
  dateFrom.value = ''
  dateTo.value = ''
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
      return sum + Number(payment.amount)
    }
    return sum
  }, 0)
})

const totalPaid = computed(() => {
  return payments.value.reduce((sum, payment) => {
    if (payment.status === 'PAID') {
      return sum + Number(payment.amount)
    }
    return sum
  }, 0)
})

const totalPending = computed(() => {
  return payments.value.reduce((sum, payment) => {
    if (payment.status === 'PENDING') {
      return sum + Number(payment.amount)
    }
    return sum
  }, 0)
})

// Watch filters
watch(
  [
    selectedTechnician,
    selectedProject,
    selectedStatus,
    selectedPeriod,
    searchQuery,
    dateFrom,
    dateTo,
  ],
  () => {
    pagination.value.page = 1
    loadPayments()
  }
)

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
      <div class="flex gap-2">
        <!-- Batch Slip Dropdown -->
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-outline">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Slip Gabungan
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </label>
          <ul
            tabindex="0"
            class="dropdown-content z-999 menu p-2 shadow-lg bg-base-100 rounded-box w-60"
          >
            <li>
              <button
                @click="generateBatchSlip"
                :disabled="selectedPayments.length === 0 || generatingSlip"
                class="flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <span v-if="selectedPayments.length > 0">
                  Slip Terpilih ({{ selectedPayments.length }})
                </span>
                <span v-else class="text-base-content/60">Pilih pembayaran dulu</span>
              </button>
            </li>
            <li>
              <button @click="openPeriodSlipModal" class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Slip Per Periode
              </button>
            </li>
          </ul>
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
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-3 gap-4">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body py-3">
          <div class="text-sm text-base-content/60">Total Pembayaran</div>
          <div class="text-xl font-bold">{{ formatCurrency(totalAmount) }}</div>
        </div>
      </div>
      <div class="card bg-success/10 shadow-sm">
        <div class="card-body py-3">
          <div class="text-sm text-success/80">Sudah Dibayar</div>
          <div class="text-xl font-bold text-success">{{ formatCurrency(totalPaid) }}</div>
        </div>
      </div>
      <div class="card bg-warning/10 shadow-sm">
        <div class="card-body py-3">
          <div class="text-sm text-warning/80">Pending</div>
          <div class="text-xl font-bold text-warning">{{ formatCurrency(totalPending) }}</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-4 flex-row items-center gap-4">
        <!-- View Toggle -->
        <AppViewToggle v-model="viewMode" />

        <!-- Search -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama/nomor/deskripsi..."
          class="input input-bordered flex-1"
        />

        <!-- Technician Filter -->
        <select v-model="selectedTechnician" class="select select-bordered">
          <option value="">Semua Teknisi</option>
          <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
            {{ tech.name }}
          </option>
        </select>

        <!-- Project Filter -->
        <select v-model="selectedProject" class="select select-bordered">
          <option value="">Semua Project</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.projectNumber }} - {{ project.title }}
          </option>
        </select>

        <!-- Status Filter -->
        <select v-model="selectedStatus" class="select select-bordered">
          <option value="">Semua Status</option>
          <option v-for="status in paymentStatuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>

        <!-- Reset Button (icon only) -->
        <button @click="resetFilters" class="btn btn-ghost btn-square" title="Reset">
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

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Empty State -->
    <div v-else-if="payments.length === 0" class="text-center py-12 text-base-content/60">
      <p class="text-lg">Tidak ada data pembayaran</p>
    </div>

    <!-- Grid View -->
    <div
      v-else-if="viewMode === 'GRID'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="payment in payments"
        :key="payment.id"
        class="card bg-base-100 shadow hover:shadow-md transition-shadow"
      >
        <div class="card-body p-4">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-mono text-sm text-base-content/60">{{ payment.paymentNumber }}</p>
              <h3 class="font-semibold">{{ payment.technician.name }}</h3>
              <p class="text-xs text-base-content/60">{{ payment.technician.type || 'Teknisi' }}</p>
            </div>
            <span class="badge badge-sm" :class="getStatusInfo(payment.status).color">
              {{ getStatusInfo(payment.status).label }}
            </span>
          </div>

          <div class="mt-3 space-y-1 text-sm">
            <div v-if="payment.project" class="flex justify-between">
              <span class="text-base-content/60">Project:</span>
              <span class="font-medium truncate max-w-32">{{ payment.project.projectNumber }}</span>
            </div>
            <div v-if="payment.period" class="flex justify-between">
              <span class="text-base-content/60">Periode:</span>
              <span>{{ payment.period }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/60">Jumlah:</span>
              <span class="font-bold text-primary">{{ formatCurrency(payment.amount) }}</span>
            </div>
            <div v-if="payment.paidDate" class="flex justify-between">
              <span class="text-base-content/60">Tgl Bayar:</span>
              <span>{{ formatDate(payment.paidDate) }}</span>
            </div>
          </div>

          <div class="card-actions justify-end mt-3 pt-3 border-t">
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
            <button @click="deletePayment(payment.id)" class="btn btn-ghost btn-xs text-error">
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
      </div>
    </div>

    <!-- List View -->
    <div v-else class="card bg-base-100 shadow-sm">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th class="w-10">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    v-model="selectAll"
                    @change="toggleSelectAll"
                  />
                </th>
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
              <tr
                v-for="payment in payments"
                :key="payment.id"
                :class="{ 'bg-primary/5': selectedPayments.includes(payment.id) }"
              >
                <td>
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="selectedPayments.includes(payment.id)"
                    @change="togglePaymentSelection(payment.id)"
                  />
                </td>
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

    <!-- Period Slip Modal -->
    <div v-if="showPeriodSlipModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Slip Pembayaran Per Periode</h3>

        <div class="space-y-4">
          <!-- Technician -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Pilih Teknisi *</span>
            </label>
            <select v-model="periodSlipTechnician" class="select select-bordered w-full">
              <option value="">-- Pilih Teknisi --</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                {{ tech.name }}
              </option>
            </select>
          </div>

          <!-- Month & Year -->
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Bulan *</span>
              </label>
              <select v-model="periodSlipMonth" class="select select-bordered w-full">
                <option v-for="month in availableMonths" :key="month.value" :value="month.value">
                  {{ month.label }}
                </option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Tahun *</span>
              </label>
              <select v-model="periodSlipYear" class="select select-bordered w-full">
                <option v-for="year in availableYears" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
          </div>

          <div class="alert alert-info py-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Akan menghasilkan slip gabungan untuk semua pembayaran teknisi yang sudah PAID pada
              periode tersebut.
            </span>
          </div>
        </div>

        <div class="modal-action">
          <button @click="showPeriodSlipModal = false" class="btn">Batal</button>
          <button
            @click="generatePeriodSlip"
            class="btn btn-primary"
            :disabled="!periodSlipTechnician || !periodSlipMonth || generatingSlip"
          >
            <span v-if="generatingSlip" class="loading loading-spinner loading-sm"></span>
            <span v-else>Generate Slip</span>
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showPeriodSlipModal = false"></div>
    </div>
  </div>
</template>
