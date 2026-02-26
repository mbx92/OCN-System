<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()

// Date filters
const fromDate = ref('')
const toDate = ref('')
const groupBy = ref<'day' | 'month' | 'year'>('month')

// Data
const loading = ref(false)
const projects = ref<any[]>([])
const payments = ref<any[]>([])
const summary = ref({
  totalProjects: 0,
  totalRevenue: 0,
  totalPayments: 0,
  averageProjectValue: 0,
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
async function loadSalesReport() {
  loading.value = true
  try {
    // Load projects
    const { data: projectsData } = await useFetch('/api/projects', {
      query: {
        limit: 1000,
      },
    })

    if (projectsData.value) {
      let allProjects = projectsData.value.data || []

      // Filter by date
      if (fromDate.value || toDate.value) {
        allProjects = allProjects.filter((p: any) => {
          const projectDate = new Date(p.createdAt)
          if (fromDate.value && projectDate < new Date(fromDate.value)) return false
          if (toDate.value && projectDate > new Date(toDate.value + ' 23:59:59')) return false
          return true
        })
      }

      projects.value = allProjects
    }

    // Load payments
    const { data: paymentsData } = await useFetch('/api/payments', {
      query: {
        limit: 1000,
      },
    })

    if (paymentsData.value) {
      let allPayments = paymentsData.value.data || []

      // Filter by date
      if (fromDate.value || toDate.value) {
        allPayments = allPayments.filter((p: any) => {
          const paymentDate = new Date(p.paymentDate)
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
    console.error('Error loading sales report:', error)
    const { showAlert } = useAlert()
    showAlert('Gagal memuat laporan penjualan', 'error')
  } finally {
    loading.value = false
  }
}

function calculateSummary() {
  summary.value.totalProjects = projects.value.length

  // Total revenue from projects
  summary.value.totalRevenue = projects.value.reduce((sum, p) => {
    return sum + (parseFloat(p.finalPrice) || parseFloat(p.budget) || 0)
  }, 0)

  // Total payments received
  summary.value.totalPayments = payments.value.reduce((sum, p) => {
    return sum + (parseFloat(p.amount) || 0)
  }, 0)

  // Average project value
  summary.value.averageProjectValue =
    summary.value.totalProjects > 0 ? summary.value.totalRevenue / summary.value.totalProjects : 0
}

function prepareChartData() {
  const dataMap = new Map()

  // Group payments by period
  payments.value.forEach(payment => {
    const date = new Date(payment.paymentDate)
    let key = ''

    if (groupBy.value === 'day') {
      key = date.toISOString().split('T')[0]
    } else if (groupBy.value === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    } else {
      key = String(date.getFullYear())
    }

    if (!dataMap.has(key)) {
      dataMap.set(key, { revenue: 0, count: 0 })
    }

    const current = dataMap.get(key)
    current.revenue += parseFloat(payment.amount) || 0
    current.count += 1
  })

  // Convert to array and sort
  const sortedData = Array.from(dataMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  chartData.value = {
    labels: sortedData.map(([key]) => formatPeriodLabel(key)),
    revenue: sortedData.map(([, data]) => data.revenue),
    count: sortedData.map(([, data]) => data.count),
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
      'Mei',
      'Jun',
      'Jul',
      'Agt',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  } else {
    return key
  }
}

// Export to CSV
function exportToCSV() {
  const headers = [
    'Tanggal Pembayaran',
    'Nomor Pembayaran',
    'Project',
    'Customer',
    'Jumlah',
    'Metode',
  ]
  const rows = payments.value.map(p => [
    formatDate(p.paymentDate),
    p.paymentNumber,
    p.project?.projectNumber || '-',
    p.project?.customer?.name || '-',
    p.amount,
    p.method || '-',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `laporan-penjualan-${fromDate.value}-${toDate.value}.csv`
  link.click()
}

// Print report
function printReport() {
  window.print()
}

// Get status color
function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'badge-success'
    case 'IN_PROGRESS':
      return 'badge-info'
    case 'PLANNING':
      return 'badge-warning'
    default:
      return 'badge-ghost'
  }
}

// Watch filters
watch([fromDate, toDate, groupBy], () => {
  loadSalesReport()
})

// Init
onMounted(() => {
  // Set default dates on client side to prevent hydration mismatch
  const today = new Date()
  fromDate.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  toDate.value = today.toISOString().split('T')[0]

  loadSalesReport()
})
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 print:hidden"
    >
      <div>
        <h1 class="text-xl sm:text-2xl font-bold">Laporan Penjualan</h1>
        <p class="text-sm text-base-content/60 hidden sm:block">
          Analisis penjualan dan pembayaran
        </p>
      </div>
      <div class="flex gap-2">
        <button @click="exportToCSV" class="btn btn-ghost btn-sm">
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span class="hidden sm:inline">Export CSV</span>
        </button>
        <button @click="printReport" class="btn btn-ghost btn-sm hidden sm:inline-flex">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div class="card-body p-3 sm:p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Dari Tanggal</span>
            </label>
            <input v-model="fromDate" type="date" class="input input-bordered" />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Sampai Tanggal</span>
            </label>
            <input v-model="toDate" type="date" class="input input-bordered" />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Kelompokkan Per</span>
            </label>
            <select v-model="groupBy" class="select select-bordered">
              <option value="day">Hari</option>
              <option value="month">Bulan</option>
              <option value="year">Tahun</option>
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-3 sm:p-6">
            <div class="text-xs sm:text-sm text-base-content/60">Total Project</div>
            <div class="text-2xl sm:text-3xl font-bold">{{ summary.totalProjects }}</div>
          </div>
        </div>

        <div class="card bg-primary/10 shadow-sm">
          <div class="card-body p-3 sm:p-6">
            <div class="text-xs sm:text-sm text-primary/80">Total Revenue</div>
            <div class="text-2xl sm:text-3xl font-bold text-primary">
              {{ formatCurrency(summary.totalRevenue) }}
            </div>
          </div>
        </div>

        <div class="card bg-success/10 shadow-sm hidden sm:flex">
          <div class="card-body">
            <div class="text-sm text-success/80">Total Pembayaran</div>
            <div class="text-3xl font-bold text-success">
              {{ formatCurrency(summary.totalPayments) }}
            </div>
          </div>
        </div>

        <div class="card bg-info/10 shadow-sm hidden sm:flex">
          <div class="card-body">
            <div class="text-sm text-info/80">Rata-rata Project</div>
            <div class="text-3xl font-bold text-info">
              {{ formatCurrency(summary.averageProjectValue) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div v-if="chartData && chartData.labels.length > 0" class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Tren Penjualan</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th class="text-right">Jumlah Transaksi</th>
                  <th class="text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(label, index) in chartData.labels" :key="index">
                  <td>{{ label }}</td>
                  <td class="text-right">{{ chartData.count[index] }}</td>
                  <td class="text-right font-medium">
                    {{ formatCurrency(chartData.revenue[index]) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="font-bold">
                  <td>Total</td>
                  <td class="text-right">
                    {{ chartData.count.reduce((a: number, b: number) => a + b, 0) }}
                  </td>
                  <td class="text-right">
                    {{
                      formatCurrency(chartData.revenue.reduce((a: number, b: number) => a + b, 0))
                    }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Projects List -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Detail Project</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>No. Project</th>
                  <th>Customer</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th class="text-right">Nilai Project</th>
                  <th class="text-right">Terbayar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="projects.length === 0">
                  <td colspan="6" class="text-center py-8 text-base-content/60">
                    Tidak ada data project
                  </td>
                </tr>
                <tr v-for="project in projects" :key="project.id">
                  <td class="font-mono">{{ project.projectNumber }}</td>
                  <td>
                    <div class="font-medium">{{ project.customer?.name }}</div>
                    <div class="text-sm text-base-content/60 truncate max-w-xs">
                      {{ project.title }}
                    </div>
                  </td>
                  <td>{{ formatDate(project.createdAt) }}</td>
                  <td>
                    <span class="badge badge-sm" :class="getStatusColor(project.status)">
                      {{ project.status }}
                    </span>
                  </td>
                  <td class="text-right font-medium">
                    {{ formatCurrency(project.finalPrice || project.budget) }}
                  </td>
                  <td class="text-right">
                    {{
                      formatCurrency(
                        payments
                          .filter(p => p.projectId === project.id)
                          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Payments List -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Detail Pembayaran</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>No. Pembayaran</th>
                  <th>Project</th>
                  <th>Customer</th>
                  <th class="text-right">Jumlah</th>
                  <th>Metode</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="payments.length === 0">
                  <td colspan="6" class="text-center py-8 text-base-content/60">
                    Tidak ada data pembayaran
                  </td>
                </tr>
                <tr v-for="payment in payments" :key="payment.id">
                  <td>{{ formatDate(payment.paymentDate) }}</td>
                  <td class="font-mono text-sm">{{ payment.paymentNumber }}</td>
                  <td>
                    <div v-if="payment.project">
                      <div class="font-medium">{{ payment.project.projectNumber }}</div>
                      <div class="text-sm text-base-content/60 truncate max-w-xs">
                        {{ payment.project.title }}
                      </div>
                    </div>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                  <td>{{ payment.project?.customer?.name || '-' }}</td>
                  <td class="text-right font-medium">{{ formatCurrency(payment.amount) }}</td>
                  <td>{{ payment.method || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@media print {
  .print\:hidden {
    display: none !important;
  }
}
</style>
