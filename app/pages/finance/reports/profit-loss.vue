<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()

// Filters
const fromDate = ref('')
const toDate = ref('')
const groupBy = ref<'month' | 'quarter' | 'year'>('month')

// Data
const loading = ref(false)
const projects = ref<any[]>([])
const payments = ref<any[]>([])
const expenses = ref<any[]>([])

const summary = ref({
  totalRevenue: 0,
  totalExpenses: 0,
  grossProfit: 0,
  profitMargin: 0,
})

const expensesByType = ref({
  PROJECT: 0,
  OPERATIONAL: 0,
  SALARY: 0,
  ASSET: 0,
})

// Load data
async function loadProfitLossReport() {
  loading.value = true
  try {
    // Load projects in date range
    const { data: projectsData } = await useFetch('/api/projects', {
      query: {
        limit: 1000,
        fromDate: fromDate.value,
        toDate: toDate.value,
      },
    })

    if (projectsData.value) {
      projects.value = projectsData.value.data || []
    }

    // Load payments
    const { data: paymentsData } = await useFetch('/api/payments', {
      query: {
        limit: 1000,
        fromDate: fromDate.value,
        toDate: toDate.value,
      },
    })

    if (paymentsData.value) {
      payments.value = paymentsData.value.data || []
    }

    // Load expenses
    const { data: expensesData } = await useFetch('/api/expenses', {
      query: {
        limit: 1000,
        fromDate: fromDate.value,
        toDate: toDate.value,
      },
    })

    if (expensesData.value) {
      expenses.value = expensesData.value.data || []
    }

    calculateSummary()
  } catch (error: any) {
    console.error('Error loading P&L report:', error)
    const { showAlert } = useAlert()
    showAlert('Gagal memuat laporan laba rugi', 'error')
  } finally {
    loading.value = false
  }
}

function calculateSummary() {
  // Calculate total revenue from projects
  summary.value.totalRevenue = projects.value.reduce((sum, project) => {
    return sum + (project.finalPrice || project.budget || 0)
  }, 0)

  // Calculate total expenses
  summary.value.totalExpenses = expenses.value.reduce((sum, expense) => {
    return sum + (expense.amount || 0)
  }, 0)

  // Calculate expenses by type
  expensesByType.value = {
    PROJECT: 0,
    OPERATIONAL: 0,
    SALARY: 0,
    ASSET: 0,
  }

  expenses.value.forEach(expense => {
    if (expense.type && expensesByType.value.hasOwnProperty(expense.type)) {
      expensesByType.value[expense.type as keyof typeof expensesByType.value] += expense.amount || 0
    }
  })

  // Calculate gross profit
  summary.value.grossProfit = summary.value.totalRevenue - summary.value.totalExpenses

  // Calculate profit margin
  if (summary.value.totalRevenue > 0) {
    summary.value.profitMargin = (summary.value.grossProfit / summary.value.totalRevenue) * 100
  } else {
    summary.value.profitMargin = 0
  }
}

// Group data by period
const groupedData = computed(() => {
  const groups = new Map<
    string,
    {
      revenue: number
      expenses: number
      profit: number
      projectCount: number
    }
  >()

  // Group projects by period
  projects.value.forEach(project => {
    if (!project.startDate) return

    const key = getPeriodKey(new Date(project.startDate))
    if (!groups.has(key)) {
      groups.set(key, { revenue: 0, expenses: 0, profit: 0, projectCount: 0 })
    }

    const group = groups.get(key)!
    group.revenue += project.finalPrice || project.budget || 0
    group.projectCount++
  })

  // Group expenses by period
  expenses.value.forEach(expense => {
    if (!expense.date) return

    const key = getPeriodKey(new Date(expense.date))
    if (!groups.has(key)) {
      groups.set(key, { revenue: 0, expenses: 0, profit: 0, projectCount: 0 })
    }

    const group = groups.get(key)!
    group.expenses += expense.amount || 0
  })

  // Calculate profit for each period
  groups.forEach(group => {
    group.profit = group.revenue - group.expenses
  })

  // Sort by period key
  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, data]) => ({
      period: formatPeriodLabel(period),
      ...data,
      margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
    }))
})

function getPeriodKey(date: Date): string {
  if (groupBy.value === 'year') {
    return date.getFullYear().toString()
  } else if (groupBy.value === 'quarter') {
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return `${date.getFullYear()}-Q${quarter}`
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
}

function formatPeriodLabel(key: string): string {
  if (groupBy.value === 'year') {
    return key
  } else if (groupBy.value === 'quarter') {
    return key
  } else {
    const [year, month] = key.split('-')
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }
}

// Export to CSV
function exportToCSV() {
  const headers = [
    'Periode',
    'Pendapatan',
    'Pengeluaran',
    'Laba/Rugi',
    'Margin (%)',
    'Jumlah Project',
  ]
  const rows = groupedData.value.map(d => [
    d.period,
    d.revenue,
    d.expenses,
    d.profit,
    d.margin.toFixed(2),
    d.projectCount,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `laporan-laba-rugi-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// Print report
function printReport() {
  window.print()
}

// Watchers
watch([fromDate, toDate, groupBy], () => {
  loadProfitLossReport()
})

// Init
onMounted(() => {
  // Set default dates on client side to prevent hydration mismatch
  const today = new Date()
  fromDate.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  toDate.value = today.toISOString().split('T')[0]

  loadProfitLossReport()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center print:hidden">
      <div>
        <h1 class="text-2xl font-bold">Laporan Laba Rugi</h1>
        <p class="text-base-content/60">Analisis pendapatan dan pengeluaran</p>
      </div>
      <div class="flex gap-2">
        <button @click="exportToCSV" class="btn btn-ghost btn-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </button>
        <button @click="printReport" class="btn btn-ghost btn-sm">
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
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Dari Tanggal</span>
            </label>
            <input type="date" v-model="fromDate" class="input input-bordered w-full" />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Sampai Tanggal</span>
            </label>
            <input type="date" v-model="toDate" class="input input-bordered w-full" />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Grup Berdasarkan</span>
            </label>
            <select v-model="groupBy" class="select select-bordered w-full">
              <option value="month">Bulan</option>
              <option value="quarter">Kuartal</option>
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card bg-success/10 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-success/80">Total Pendapatan</div>
            <div class="text-3xl font-bold text-success">
              {{ formatCurrency(summary.totalRevenue) }}
            </div>
          </div>
        </div>

        <div class="card bg-error/10 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-error/80">Total Pengeluaran</div>
            <div class="text-3xl font-bold text-error">
              {{ formatCurrency(summary.totalExpenses) }}
            </div>
          </div>
        </div>

        <div
          class="card shadow-sm"
          :class="summary.grossProfit >= 0 ? 'bg-primary/10' : 'bg-warning/10'"
        >
          <div class="card-body">
            <div
              class="text-sm"
              :class="summary.grossProfit >= 0 ? 'text-primary/80' : 'text-warning/80'"
            >
              Laba/Rugi Bersih
            </div>
            <div
              class="text-3xl font-bold"
              :class="summary.grossProfit >= 0 ? 'text-primary' : 'text-warning'"
            >
              {{ formatCurrency(summary.grossProfit) }}
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-base-content/60">Margin Laba</div>
            <div
              class="text-3xl font-bold"
              :class="summary.profitMargin >= 0 ? 'text-success' : 'text-error'"
            >
              {{ summary.profitMargin.toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Breakdown -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">Rincian Pengeluaran per Kategori</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Pengeluaran Project</div>
              <div class="stat-value text-2xl">{{ formatCurrency(expensesByType.PROJECT) }}</div>
              <div class="stat-desc">
                {{
                  summary.totalExpenses > 0
                    ? ((expensesByType.PROJECT / summary.totalExpenses) * 100).toFixed(1)
                    : 0
                }}% dari total
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Operasional</div>
              <div class="stat-value text-2xl">
                {{ formatCurrency(expensesByType.OPERATIONAL) }}
              </div>
              <div class="stat-desc">
                {{
                  summary.totalExpenses > 0
                    ? ((expensesByType.OPERATIONAL / summary.totalExpenses) * 100).toFixed(1)
                    : 0
                }}% dari total
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Gaji/Fee</div>
              <div class="stat-value text-2xl">{{ formatCurrency(expensesByType.SALARY) }}</div>
              <div class="stat-desc">
                {{
                  summary.totalExpenses > 0
                    ? ((expensesByType.SALARY / summary.totalExpenses) * 100).toFixed(1)
                    : 0
                }}% dari total
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Asset</div>
              <div class="stat-value text-2xl">{{ formatCurrency(expensesByType.ASSET) }}</div>
              <div class="stat-desc">
                {{
                  summary.totalExpenses > 0
                    ? ((expensesByType.ASSET / summary.totalExpenses) * 100).toFixed(1)
                    : 0
                }}% dari total
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Table -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th class="text-right">Pendapatan</th>
                  <th class="text-right">Pengeluaran</th>
                  <th class="text-right">Laba/Rugi</th>
                  <th class="text-right">Margin</th>
                  <th class="text-center">Jumlah Project</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="groupedData.length === 0">
                  <td colspan="6" class="text-center py-8 text-base-content/60">
                    Tidak ada data pada periode ini
                  </td>
                </tr>
                <tr v-for="item in groupedData" :key="item.period">
                  <td class="font-medium">{{ item.period }}</td>
                  <td class="text-right text-success">{{ formatCurrency(item.revenue) }}</td>
                  <td class="text-right text-error">{{ formatCurrency(item.expenses) }}</td>
                  <td
                    class="text-right font-bold"
                    :class="item.profit >= 0 ? 'text-primary' : 'text-warning'"
                  >
                    {{ formatCurrency(item.profit) }}
                  </td>
                  <td class="text-right" :class="item.margin >= 0 ? 'text-success' : 'text-error'">
                    {{ item.margin.toFixed(2) }}%
                  </td>
                  <td class="text-center">{{ item.projectCount }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="font-bold">
                  <td>Total</td>
                  <td class="text-right text-success">
                    {{ formatCurrency(summary.totalRevenue) }}
                  </td>
                  <td class="text-right text-error">{{ formatCurrency(summary.totalExpenses) }}</td>
                  <td
                    class="text-right"
                    :class="summary.grossProfit >= 0 ? 'text-primary' : 'text-warning'"
                  >
                    {{ formatCurrency(summary.grossProfit) }}
                  </td>
                  <td
                    class="text-right"
                    :class="summary.profitMargin >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ summary.profitMargin.toFixed(2) }}%
                  </td>
                  <td class="text-center">{{ projects.length }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Detailed Project List -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">Detail Project</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>No. Project</th>
                  <th>Customer</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th class="text-right">Nilai Project</th>
                  <th class="text-right">Pengeluaran</th>
                  <th class="text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="projects.length === 0">
                  <td colspan="7" class="text-center py-4 text-base-content/60">
                    Tidak ada project
                  </td>
                </tr>
                <tr v-for="project in projects" :key="project.id">
                  <td class="font-mono text-sm">{{ project.projectNumber }}</td>
                  <td>{{ project.customer?.name || '-' }}</td>
                  <td>{{ formatDate(project.startDate) }}</td>
                  <td>
                    <span
                      class="badge badge-sm"
                      :class="{
                        'badge-info': project.status === 'PENDING',
                        'badge-warning': project.status === 'IN_PROGRESS',
                        'badge-success': project.status === 'COMPLETED',
                        'badge-error': project.status === 'CANCELLED',
                      }"
                    >
                      {{ project.status }}
                    </span>
                  </td>
                  <td class="text-right">
                    {{ formatCurrency(project.finalPrice || project.budget) }}
                  </td>
                  <td class="text-right text-error">
                    {{
                      formatCurrency(
                        project.expenses?.reduce(
                          (sum: number, e: any) => sum + (e.amount || 0),
                          0
                        ) || 0
                      )
                    }}
                  </td>
                  <td
                    class="text-right font-medium"
                    :class="
                      (project.finalPrice || project.budget) -
                        (project.expenses?.reduce(
                          (sum: number, e: any) => sum + (e.amount || 0),
                          0
                        ) || 0) >=
                      0
                        ? 'text-success'
                        : 'text-error'
                    "
                  >
                    {{
                      formatCurrency(
                        (project.finalPrice || project.budget) -
                          (project.expenses?.reduce(
                            (sum: number, e: any) => sum + (e.amount || 0),
                            0
                          ) || 0)
                      )
                    }}
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

<style scoped>
@media print {
  .print\:hidden {
    display: none !important;
  }
}
</style>
