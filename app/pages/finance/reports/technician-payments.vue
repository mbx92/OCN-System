<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()
const { downloadReportPdf, generating: pdfGenerating } = usePdfGenerator()

// Company settings
const { data: company } = await useFetch('/api/company')

// Date filters
const fromDate = ref('')
const toDate = ref('')
const groupBy = ref<'day' | 'month' | 'year'>('month')
const selectedTechnician = ref('')

// Data
const loading = ref(false)
const payments = ref<any[]>([])
const technicians = ref<any[]>([])
const summary = ref({
  totalPayments: 0,
  totalPaid: 0,
  totalPending: 0,
  totalCancelled: 0,
  uniqueTechnicians: 0,
})

// Charts data
const chartData = ref<any>(null)

// Set default dates (current month)
const now = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

fromDate.value = firstDay.toISOString().split('T')[0]
toDate.value = lastDay.toISOString().split('T')[0]

// Load data
async function loadReport() {
  loading.value = true
  try {
    // Load payments
    const query: any = { limit: 1000 }
    if (selectedTechnician.value) query.technicianId = selectedTechnician.value

    const { data: paymentsData } = await useFetch('/api/technician-payments', { query })

    if (paymentsData.value) {
      let allPayments = paymentsData.value.payments || []

      // Filter by date
      if (fromDate.value || toDate.value) {
        allPayments = allPayments.filter((p: any) => {
          const paymentDate = new Date(p.createdAt)
          if (fromDate.value && paymentDate < new Date(fromDate.value)) return false
          if (toDate.value && paymentDate > new Date(toDate.value + ' 23:59:59')) return false
          return true
        })
      }

      payments.value = allPayments
    }

    // Calculate summary
    calculateSummary()
    prepareChartData()
  } catch (error: any) {
    console.error('Error loading report:', error)
    const { showAlert } = useAlert()
    showAlert('Gagal memuat laporan pembayaran teknisi', 'error')
  } finally {
    loading.value = false
  }
}

async function loadTechnicians() {
  try {
    const { data } = await useFetch('/api/technicians', { query: { limit: 1000 } })
    if (data.value) {
      technicians.value = Array.isArray(data.value) ? data.value : (data.value as any).data || []
    }
  } catch (error) {
    console.error('Error loading technicians:', error)
  }
}

function calculateSummary() {
  summary.value.totalPayments = payments.value.reduce((sum, p) => sum + p.amount, 0)
  summary.value.totalPaid = payments.value
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)
  summary.value.totalPending = payments.value
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)
  summary.value.totalCancelled = payments.value
    .filter(p => p.status === 'CANCELLED')
    .reduce((sum, p) => sum + p.amount, 0)

  // Count unique technicians
  const techIds = new Set(payments.value.map(p => p.technicianId))
  summary.value.uniqueTechnicians = techIds.size
}

function prepareChartData() {
  // Group payments by period
  const grouped: Record<string, { paid: number; pending: number; count: number }> = {}

  payments.value.forEach(p => {
    const date = new Date(p.createdAt)
    let key = ''

    if (groupBy.value === 'day') {
      key = date.toISOString().split('T')[0]
    } else if (groupBy.value === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    } else {
      key = date.getFullYear().toString()
    }

    if (!grouped[key]) {
      grouped[key] = { paid: 0, pending: 0, count: 0 }
    }

    if (p.status === 'PAID') {
      grouped[key].paid += p.amount
    } else if (p.status === 'PENDING') {
      grouped[key].pending += p.amount
    }
    grouped[key].count += 1
  })

  const sortedKeys = Object.keys(grouped).sort()

  chartData.value = {
    labels: sortedKeys.map(formatPeriodLabel),
    paid: sortedKeys.map(k => grouped[k].paid),
    pending: sortedKeys.map(k => grouped[k].pending),
    count: sortedKeys.map(k => grouped[k].count),
    keys: sortedKeys,
  }
}

function formatPeriodLabel(key: string): string {
  if (groupBy.value === 'day') {
    return formatDate(key)
  } else if (groupBy.value === 'month') {
    const [year, month] = key.split('-')
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }
  return key
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PAID':
      return 'badge-success'
    case 'PENDING':
      return 'badge-warning'
    case 'CANCELLED':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PAID':
      return 'Lunas'
    case 'PENDING':
      return 'Pending'
    case 'CANCELLED':
      return 'Dibatalkan'
    default:
      return status
  }
}

// Export to CSV
function exportToCSV() {
  const headers = [
    'No. Pembayaran',
    'Teknisi',
    'Project',
    'Periode',
    'Jumlah',
    'Status',
    'Tgl Bayar',
  ]
  const rows = payments.value.map(p => [
    p.paymentNumber,
    p.technician?.name || '-',
    p.project?.projectNumber || '-',
    p.period || '-',
    p.amount,
    getStatusLabel(p.status),
    p.paidDate ? formatDate(p.paidDate) : '-',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `laporan-pembayaran-teknisi-${fromDate.value}-${toDate.value}.csv`
  link.click()
}

// Print report
function printReport() {
  window.print()
}

// Export to PDF
function exportToPdf() {
  downloadReportPdf({
    title: 'Laporan Pembayaran Teknisi',
    subtitle: company.value?.name || 'OCN CCTV & Networking Solutions',
    period: `${formatDate(fromDate.value)} - ${formatDate(toDate.value)}`,
    summary: [
      { label: 'Total Pembayaran', value: formatCurrency(summary.value.totalPayments) },
      { label: 'Sudah Dibayar', value: formatCurrency(summary.value.totalPaid) },
      { label: 'Pending', value: formatCurrency(summary.value.totalPending) },
      { label: 'Jumlah Teknisi', value: summary.value.uniqueTechnicians.toString() },
    ],
    columns: [
      { header: 'No. Pembayaran', key: 'paymentNumber', align: 'left' },
      { header: 'Teknisi', key: 'technician', align: 'left' },
      { header: 'Project', key: 'project', align: 'left' },
      { header: 'Periode', key: 'period', align: 'left' },
      { header: 'Jumlah', key: 'amount', align: 'right', format: v => formatCurrency(v) },
      { header: 'Status', key: 'status', align: 'center' },
    ],
    data: payments.value.map(p => ({
      paymentNumber: p.paymentNumber,
      technician: p.technician?.name || '-',
      project: p.project?.projectNumber || '-',
      period: p.period || '-',
      amount: p.amount,
      status: getStatusLabel(p.status),
    })),
    filename: `laporan-pembayaran-teknisi-${fromDate.value}-${toDate.value}`,
  })
}

// Watch filters
watch([fromDate, toDate, groupBy, selectedTechnician], () => {
  loadReport()
})

// Init
onMounted(() => {
  const today = new Date()
  fromDate.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  toDate.value = today.toISOString().split('T')[0]

  loadTechnicians()
  loadReport()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center print:hidden">
      <div>
        <h1 class="text-2xl font-bold">Laporan Pembayaran Teknisi</h1>
        <p class="text-base-content/60">Analisis pembayaran fee/gaji teknisi</p>
      </div>
      <div class="flex gap-2">
        <button @click="exportToPdf" class="btn btn-primary btn-sm" :disabled="pdfGenerating">
          <span v-if="pdfGenerating" class="loading loading-spinner loading-sm"></span>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Download PDF
        </button>
        <button @click="exportToCSV" class="btn btn-outline btn-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </button>
        <button @click="printReport" class="btn btn-outline btn-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-sm print:hidden">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Dari Tanggal</span>
            </label>
            <input v-model="fromDate" type="date" class="input input-bordered w-full" />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Sampai Tanggal</span>
            </label>
            <input v-model="toDate" type="date" class="input input-bordered w-full" />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Teknisi</span>
            </label>
            <select v-model="selectedTechnician" class="select select-bordered w-full">
              <option value="">Semua Teknisi</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                {{ tech.name }}
              </option>
            </select>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Group By</span>
            </label>
            <select v-model="groupBy" class="select select-bordered w-full">
              <option value="day">Per Hari</option>
              <option value="month">Per Bulan</option>
              <option value="year">Per Tahun</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-base-content/60">Total Pembayaran</div>
            <div class="text-2xl font-bold text-primary">
              {{ formatCurrency(summary.totalPayments) }}
            </div>
          </div>
        </div>
        <div class="card bg-success/10 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-success/80">Sudah Dibayar</div>
            <div class="text-2xl font-bold text-success">
              {{ formatCurrency(summary.totalPaid) }}
            </div>
          </div>
        </div>
        <div class="card bg-warning/10 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-warning/80">Pending</div>
            <div class="text-2xl font-bold text-warning">
              {{ formatCurrency(summary.totalPending) }}
            </div>
          </div>
        </div>
        <div class="card bg-error/10 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-error/80">Dibatalkan</div>
            <div class="text-2xl font-bold text-error">
              {{ formatCurrency(summary.totalCancelled) }}
            </div>
          </div>
        </div>
        <div class="card bg-info/10 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-info/80">Jumlah Teknisi</div>
            <div class="text-2xl font-bold text-info">
              {{ summary.uniqueTechnicians }}
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Table -->
      <div v-if="chartData && chartData.labels.length > 0" class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Tren Pembayaran</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th class="text-right">Jumlah Transaksi</th>
                  <th class="text-right">Sudah Dibayar</th>
                  <th class="text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(label, index) in chartData.labels" :key="index">
                  <td>{{ label }}</td>
                  <td class="text-right">{{ chartData.count[index] }}</td>
                  <td class="text-right text-success font-medium">
                    {{ formatCurrency(chartData.paid[index]) }}
                  </td>
                  <td class="text-right text-warning font-medium">
                    {{ formatCurrency(chartData.pending[index]) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="font-bold">
                  <td>Total</td>
                  <td class="text-right">
                    {{ chartData.count.reduce((a: number, b: number) => a + b, 0) }}
                  </td>
                  <td class="text-right text-success">
                    {{ formatCurrency(chartData.paid.reduce((a: number, b: number) => a + b, 0)) }}
                  </td>
                  <td class="text-right text-warning">
                    {{
                      formatCurrency(chartData.pending.reduce((a: number, b: number) => a + b, 0))
                    }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Detail Table -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Detail Pembayaran</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>No. Pembayaran</th>
                  <th>Teknisi</th>
                  <th>Project</th>
                  <th>Periode</th>
                  <th>Status</th>
                  <th class="text-right">Jumlah</th>
                  <th>Tgl Bayar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="payments.length === 0">
                  <td colspan="7" class="text-center py-8 text-base-content/60">
                    Tidak ada data pembayaran
                  </td>
                </tr>
                <tr v-for="payment in payments" :key="payment.id">
                  <td class="font-mono text-sm">{{ payment.paymentNumber }}</td>
                  <td>
                    <div class="font-medium">{{ payment.technician?.name || '-' }}</div>
                    <div v-if="payment.technician?.phone" class="text-xs text-base-content/60">
                      {{ payment.technician.phone }}
                    </div>
                  </td>
                  <td>
                    <div v-if="payment.project" class="text-sm">
                      {{ payment.project.projectNumber }}
                    </div>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                  <td>{{ payment.period || '-' }}</td>
                  <td>
                    <span class="badge badge-sm" :class="getStatusColor(payment.status)">
                      {{ getStatusLabel(payment.status) }}
                    </span>
                  </td>
                  <td class="text-right font-medium">{{ formatCurrency(payment.amount) }}</td>
                  <td>
                    <span v-if="payment.paidDate">{{ formatDate(payment.paidDate) }}</span>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
