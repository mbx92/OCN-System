<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold">Laporan Omzet Bruto</h1>
        <p class="text-sm text-base-content/60 hidden sm:block">
          Laporan peredaran bruto untuk keperluan pajak
        </p>
      </div>
      <div class="flex gap-2">
        <button @click="exportToExcel" class="btn btn-ghost btn-sm" :disabled="!reportData">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span class="hidden sm:inline">Export CSV</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-3 sm:p-6 sm:py-4">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <!-- Period Tabs -->
          <div class="tabs tabs-boxed">
            <button
              class="tab"
              :class="{ 'tab-active': selectedPeriod === 'month' }"
              @click="selectedPeriod = 'month'"
            >
              Bulanan
            </button>
            <button
              class="tab"
              :class="{ 'tab-active': selectedPeriod === 'quarter' }"
              @click="selectedPeriod = 'quarter'"
            >
              Kuartal
            </button>
            <button
              class="tab"
              :class="{ 'tab-active': selectedPeriod === 'year' }"
              @click="selectedPeriod = 'year'"
            >
              Tahun
            </button>
          </div>

          <!-- Year Selector -->
          <div class="form-control">
            <select v-model="selectedYear" class="select select-bordered select-sm">
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>

          <div class="flex-1"></div>

          <!-- Refresh Button -->
          <button class="btn btn-ghost btn-sm" :disabled="loading" @click="fetchYearlyReport()">
            <svg
              class="w-5 h-5"
              :class="{ 'animate-spin': loading }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

    <!-- Yearly Summary -->
    <div v-if="yearlyData" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      <div class="stat bg-success/10 rounded-lg shadow-sm p-3 sm:p-6">
        <div class="stat-title text-xs sm:text-sm">Total Omzet Bruto {{ selectedYear }}</div>
        <div class="stat-value text-success text-lg sm:text-2xl">
          {{ formatCurrency(yearlyData.totalRevenue) }}
        </div>
        <div class="stat-desc text-xs">{{ yearlyData.totalTransactions }} transaksi</div>
      </div>

      <div class="stat bg-primary/10 rounded-lg shadow-sm p-3 sm:p-6">
        <div class="stat-title text-xs sm:text-sm">Rata-rata per Bulan</div>
        <div class="stat-value text-primary text-lg sm:text-2xl">
          {{ formatCurrency(yearlyData.averagePerMonth) }}
        </div>
        <div class="stat-desc text-xs">Total / 12 bulan</div>
      </div>

      <div class="stat bg-info/10 rounded-lg shadow-sm p-3 sm:p-6 hidden sm:flex sm:flex-col">
        <div class="stat-title text-xs sm:text-sm">Rata-rata per Transaksi</div>
        <div class="stat-value text-info text-lg sm:text-2xl">
          {{ formatCurrency(yearlyData.averagePerTransaction) }}
        </div>
        <div class="stat-desc text-xs">Total / Jumlah transaksi</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Period Cards -->
    <div v-else-if="yearlyData" class="card bg-base-100 shadow-sm">
      <div class="card-body p-3 sm:p-6">
        <h2 class="card-title text-base sm:text-lg mb-3 sm:mb-4">
          Omzet per
          {{
            selectedPeriod === 'month'
              ? 'Bulan'
              : selectedPeriod === 'quarter'
                ? 'Kuartal'
                : 'Tahun'
          }}
        </h2>

        <!-- Monthly Grid -->
        <div
          v-if="selectedPeriod === 'month'"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4"
        >
          <div
            v-for="month in monthlyCards"
            :key="month.number"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all shadow-sm hover:shadow-md"
            @click="openMonthDetail(month.number)"
          >
            <div class="card-body p-3 sm:p-4">
              <h3 class="card-title text-sm">{{ month.name }}</h3>
              <div class="text-lg font-bold text-success">
                {{ formatCurrency(month.revenue) }}
              </div>
              <div class="text-xs text-base-content/60">{{ month.transactions }} transaksi</div>
            </div>
          </div>
        </div>

        <!-- Quarterly Grid -->
        <div v-else-if="selectedPeriod === 'quarter'" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="quarter in quarterlyCards"
            :key="quarter.number"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all shadow-sm hover:shadow-md"
            @click="openQuarterDetail(quarter.number)"
          >
            <div class="card-body p-4">
              <h3 class="card-title text-sm">{{ quarter.name }}</h3>
              <div class="text-xl font-bold text-success">
                {{ formatCurrency(quarter.revenue) }}
              </div>
              <div class="text-xs text-base-content/60">{{ quarter.transactions }} transaksi</div>
            </div>
          </div>
        </div>

        <!-- Yearly Card -->
        <div v-else-if="selectedPeriod === 'year'" class="grid grid-cols-1 gap-4">
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body">
              <h3 class="card-title">{{ yearCard.name }}</h3>
              <div class="text-3xl font-bold text-success">
                {{ formatCurrency(yearCard.revenue) }}
              </div>
              <div class="text-sm text-base-content/60">{{ yearCard.transactions }} transaksi</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Month Detail Modal -->
    <dialog class="modal" :class="{ 'modal-open': showMonthModal }">
      <div class="modal-box max-w-6xl w-full">
        <h3 class="font-bold text-base sm:text-lg mb-3 sm:mb-4">
          Detail Omzet - {{ getMonthName(selectedMonth) }} {{ selectedYear }}
        </h3>

        <div v-if="reportData" class="space-y-4">
          <!-- Summary -->
          <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
            <div class="stat">
              <div class="stat-title">Total Omzet Bruto</div>
              <div class="stat-value text-primary">
                {{ formatCurrency(reportData.totalGrossRevenue) }}
              </div>
              <div class="stat-desc">{{ reportData.transactionCount }} transaksi</div>
            </div>
            <div class="stat">
              <div class="stat-title">Rata-rata per Transaksi</div>
              <div class="stat-value text-sm">
                {{ formatCurrency(reportData.averageTransaction) }}
              </div>
            </div>
          </div>

          <!-- Transactions Table -->
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>No. Pembayaran</th>
                  <th>Proyek</th>
                  <th>Customer</th>
                  <th>Tipe</th>
                  <th class="text-right">Jumlah</th>
                  <th class="text-right">Diskon</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in reportData.transactions" :key="transaction.id">
                  <td>{{ formatDate(new Date(transaction.paidDate || transaction.createdAt)) }}</td>
                  <td class="font-mono text-xs">{{ transaction.paymentNumber }}</td>
                  <td>
                    <span v-if="transaction.project" class="font-mono text-xs">
                      {{ transaction.project.projectNumber }}
                    </span>
                    <span v-else class="text-base-content/40">POS</span>
                  </td>
                  <td>
                    <span v-if="transaction.project?.customer">
                      {{ transaction.project.customer.name }}
                    </span>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                  <td>
                    <span class="badge badge-sm">{{ getTypeLabel(transaction.type) }}</span>
                  </td>
                  <td class="text-right font-mono text-sm">
                    {{ formatCurrency(transaction.amount) }}
                  </td>
                  <td class="text-right font-mono text-sm text-warning">
                    {{
                      transaction.discount > 0 ? `-${formatCurrency(transaction.discount)}` : '-'
                    }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(transaction.amount - (transaction.discount || 0)) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="font-bold bg-base-200">
                  <td colspan="7" class="text-right">TOTAL:</td>
                  <td class="text-right font-mono text-lg text-success">
                    {{ formatCurrency(reportData.totalGrossRevenue) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Sisa Pembagian Teknisi -->
        <div v-if="loadingSisaTeknisi" class="flex justify-center py-4">
          <span class="loading loading-spinner loading-sm"></span>
        </div>
        <div
          v-else-if="sisaTeknisiData && sisaTeknisiData.total > 0"
          class="mt-4 bg-teal-500/10 border border-teal-500/30 rounded-lg p-3"
        >
          <div class="flex items-center gap-2 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span class="font-semibold text-teal-700 text-sm">
              Sisa Pembagian Teknisi → Kas Perusahaan
            </span>
            <span class="badge badge-sm bg-teal-500/20 text-teal-700 border-0">
              {{ sisaTeknisiData.count }} entri
            </span>
          </div>
          <p class="text-xs text-teal-600/80 mb-2">
            Sisa upah teknisi yang tidak dialokasikan ke teknisi dan disimpan ke kas perusahaan pada
            periode ini.
          </p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-teal-700">Total Sisa Masuk Kas</span>
            <span class="font-bold text-teal-700 text-lg">
              {{ formatCurrency(sisaTeknisiData.total) }}
            </span>
          </div>
          <div
            v-if="sisaTeknisiData.items.length > 0"
            class="mt-2 space-y-1 max-h-28 overflow-y-auto"
          >
            <div
              v-for="item in sisaTeknisiData.items"
              :key="item.id"
              class="flex justify-between text-xs text-teal-600/70"
            >
              <span class="truncate max-w-xs">{{ item.description }}</span>
              <span class="font-mono ml-2 shrink-0">{{ formatCurrency(item.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Modal Action -->
        <div class="modal-action">
          <button @click="exportMonthToExcel" class="btn btn-success">
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export CSV
          </button>
          <button @click="showMonthModal = false" class="btn">Tutup</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showMonthModal = false">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { formatCurrency, formatDate } = useFormatter()

const selectedYear = ref(new Date().getFullYear())
const selectedPeriod = ref<'month' | 'quarter' | 'year'>('month')
const selectedMonth = ref(1)
const loading = ref(false)
const reportData = ref<any>(null)
const yearlyData = ref<any>(null)
const showMonthModal = ref(false)
const sisaTeknisiData = ref<any>(null)
const loadingSisaTeknisi = ref(false)

// Generate available years (current year - 5 to current year + 1)
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i)
  }
  return years
})

const monthlyCards = computed(() => {
  if (!yearlyData.value?.monthlyData) return []

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  return months.map((name, index) => {
    const monthData = yearlyData.value.monthlyData[index + 1] || { revenue: 0, transactions: 0 }
    return {
      number: index + 1,
      name,
      revenue: monthData.revenue,
      transactions: monthData.transactions,
    }
  })
})

const quarterlyCards = computed(() => {
  if (!yearlyData.value?.monthlyData) return []

  const quarters = []
  for (let q = 1; q <= 4; q++) {
    let revenue = 0
    let transactions = 0

    // Each quarter = 3 months
    for (let m = (q - 1) * 3 + 1; m <= q * 3; m++) {
      const monthData = yearlyData.value.monthlyData[m] || { revenue: 0, transactions: 0 }
      revenue += monthData.revenue
      transactions += monthData.transactions
    }

    quarters.push({
      number: q,
      name: `Kuartal ${q}`,
      revenue,
      transactions,
    })
  }

  return quarters
})

const yearCard = computed(() => {
  if (!yearlyData.value) return null

  return {
    name: `Tahun ${selectedYear.value}`,
    revenue: yearlyData.value.totalRevenue,
    transactions: yearlyData.value.totalTransactions,
  }
})

const getMonthName = (month: number) => {
  // Check if it's a quarter (code >= 100)
  if (month >= 100) {
    const quarter = Math.floor(month / 100)
    return `Kuartal ${quarter}`
  }

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  return months[month - 1]
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    FULL: 'Lunas',
    DP: 'DP',
    INSTALLMENT: 'Cicilan',
    SETTLEMENT: 'Pelunasan',
  }
  return labels[type] || type
}

const fetchYearlyReport = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/reports/gross-revenue/yearly', {
      params: {
        year: selectedYear.value,
      },
    })
    yearlyData.value = response
  } catch (error) {
    console.error('Error fetching yearly report:', error)
  } finally {
    loading.value = false
  }
}

const openMonthDetail = async (month: number) => {
  selectedMonth.value = month
  loading.value = true
  showMonthModal.value = true

  try {
    const response = await $fetch('/api/reports/gross-revenue', {
      params: {
        month: month,
        year: selectedYear.value,
      },
    })
    reportData.value = response
  } catch (error) {
    console.error('Error fetching report:', error)
  } finally {
    loading.value = false
  }

  // Fetch sisa teknisi for this month
  loadingSisaTeknisi.value = true
  try {
    sisaTeknisiData.value = await $fetch('/api/reports/technician-remainder', {
      params: {
        year: selectedYear.value,
        period: 'month',
        periodValue: month,
      },
    })
  } catch (e) {
    sisaTeknisiData.value = null
  } finally {
    loadingSisaTeknisi.value = false
  }
}

const openQuarterDetail = async (quarter: number) => {
  // For quarterly view, get all months in that quarter and show aggregated data
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = quarter * 3

  loading.value = true
  showMonthModal.value = true

  try {
    // Fetch all months in quarter
    const promises = []
    for (let m = startMonth; m <= endMonth; m++) {
      promises.push(
        $fetch('/api/reports/gross-revenue', {
          params: {
            month: m,
            year: selectedYear.value,
          },
        })
      )
    }

    const results = await Promise.all(promises)

    // Aggregate transactions from all months
    const allTransactions: any[] = []
    let totalRevenue = 0

    results.forEach((result: any) => {
      allTransactions.push(...result.transactions)
      totalRevenue += result.totalGrossRevenue
    })

    reportData.value = {
      transactions: allTransactions,
      totalGrossRevenue: totalRevenue,
    }

    // Set month name to quarter
    selectedMonth.value = quarter * 100 // Use special code to identify quarter
  } catch (error) {
    console.error('Error fetching quarterly report:', error)
  } finally {
    loading.value = false
  }

  // Fetch sisa teknisi for this quarter
  loadingSisaTeknisi.value = true
  try {
    sisaTeknisiData.value = await $fetch('/api/reports/technician-remainder', {
      params: {
        year: selectedYear.value,
        period: 'quarter',
        periodValue: quarter,
      },
    })
  } catch (e) {
    sisaTeknisiData.value = null
  } finally {
    loadingSisaTeknisi.value = false
  }
}

const exportToExcel = () => {
  if (!yearlyData.value) return

  const filename = `Laporan_Omzet_Bruto_${selectedYear.value}.csv`

  // Create CSV content
  let csv = 'Bulan,Total Omzet,Jumlah Transaksi,Rata-rata\n'

  monthlyCards.value.forEach((month: any) => {
    const avg = month.transactions > 0 ? month.revenue / month.transactions : 0
    csv += `${month.name},${month.revenue},${month.transactions},${avg}\n`
  })

  csv += `\nTOTAL,${yearlyData.value.totalRevenue},${yearlyData.value.totalTransactions},${yearlyData.value.averagePerTransaction}\n`

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

const exportMonthToExcel = () => {
  if (!reportData.value) return

  const monthName = getMonthName(selectedMonth.value)
  const filename = `Laporan_Omzet_Bruto_${monthName}_${selectedYear.value}.csv`

  // Create CSV content
  let csv = 'Tanggal,No. Pembayaran,Proyek,Customer,Tipe,Jumlah,Diskon,Total\n'

  reportData.value.transactions.forEach((t: any) => {
    const date = formatDate(new Date(t.paidDate || t.createdAt))
    const paymentNumber = t.paymentNumber
    const project = t.project ? t.project.projectNumber : 'POS'
    const customer = t.project?.customer?.name || '-'
    const type = getTypeLabel(t.type)
    const amount = t.amount
    const discount = t.discount || 0
    const total = amount - discount

    csv += `${date},"${paymentNumber}","${project}","${customer}","${type}",${amount},${discount},${total}\n`
  })

  csv += `\n,,,,,,,TOTAL,${reportData.value.totalGrossRevenue}\n`

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

// Auto-fetch on mount
onMounted(() => {
  fetchYearlyReport()
})

// Watch for year changes and refetch
watch(selectedYear, () => {
  fetchYearlyReport()
})
</script>
