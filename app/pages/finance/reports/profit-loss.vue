<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency } = useFormatter()

// State
const selectedYear = ref(new Date().getFullYear())
const selectedPeriod = ref<'month' | 'quarter' | 'year'>('month')
const selectedPeriodValue = ref<number | null>(null)
const showDetailModal = ref(false)

// Computed years for dropdown
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y)
  }
  return years
})

// Fetch summary data for dashboard cards
const {
  data: summaryData,
  pending: loadingSummary,
  refresh: refreshSummary,
} = useFetch('/api/reports/profit-loss-summary', {
  query: {
    year: selectedYear,
    period: selectedPeriod,
  },
  watch: [selectedYear, selectedPeriod],
})

// Fetch detailed report when a period is selected
const {
  data: detailData,
  pending: loadingDetail,
  refresh: refreshDetail,
} = useFetch('/api/reports/profit-loss', {
  query: {
    year: selectedYear,
    period: selectedPeriod,
    periodValue: selectedPeriodValue,
  },
  immediate: false,
  watch: false,
})

// Open detail modal
async function openDetail(periodValue: number) {
  selectedPeriodValue.value = periodValue
  showDetailModal.value = true
  await refreshDetail()
}

// Close detail modal
function closeDetail() {
  showDetailModal.value = false
  selectedPeriodValue.value = null
}

// Format number with parentheses for negative
function formatNumber(value: number, showParentheses = false): string {
  if (showParentheses && value < 0) {
    return `(${formatCurrency(Math.abs(value))})`
  }
  return formatCurrency(value)
}

// Print report
function printReport() {
  window.print()
}

// Export to CSV
function exportToCSV() {
  if (!detailData.value) return

  const d = detailData.value.data
  const rows = [
    ['Laporan Laba Rugi Multi-Step'],
    [detailData.value.companyName],
    [detailData.value.periodLabel],
    [''],
    ['Item', 'Jumlah', 'Total'],
    ['Pendapatan Kotor', '', formatCurrency(d.pendapatanKotor)],
    ['  Diskon Penjualan', formatCurrency(d.diskonPenjualan), ''],
    [
      '  Retur Penjualan',
      formatCurrency(d.returPenjualan),
      `(${formatCurrency(d.diskonPenjualan + d.returPenjualan)})`,
    ],
    ['Penjualan Bersih', '', formatCurrency(d.penjualanBersih)],
    ['HPP', '', `(${formatCurrency(d.hpp)})`],
    ['Laba Kotor', '', formatCurrency(d.labaKotor)],
    [''],
    ['Pengeluaran/Biaya Operasional:'],
    [''],
    ['Biaya/Beban Penjualan:'],
    ...d.biayaPenjualan.items.map((item: any) => [
      `  ${item.name}`,
      formatCurrency(item.amount),
      '',
    ]),
    ['Total Biaya/Beban Penjualan', '', formatCurrency(d.biayaPenjualan.total)],
    [''],
    ['Biaya/Beban Administratif:'],
    ...d.biayaAdministratif.items.map((item: any) => [
      `  ${item.name}`,
      formatCurrency(item.amount),
      '',
    ]),
    ['Total Biaya Administratif', '', formatCurrency(d.biayaAdministratif.total)],
    [''],
    ['Total Operating Expenses', '', `(${formatCurrency(d.totalBiayaOperasional)})`],
    ['Pendapatan Operasional', '', formatCurrency(d.pendapatanOperasional)],
    [''],
    ['Pendapatan (Beban) Lain-Lain:'],
    ...d.pendapatanLainLain.items.map((item: any) => [
      `  ${item.name}`,
      item.amount < 0 ? `(${formatCurrency(Math.abs(item.amount))})` : formatCurrency(item.amount),
      '',
    ]),
    [
      'Total Pendapatan (Beban) Lain-Lain',
      '',
      d.pendapatanLainLain.total < 0
        ? `(${formatCurrency(Math.abs(d.pendapatanLainLain.total))})`
        : formatCurrency(d.pendapatanLainLain.total),
    ],
    [''],
    ['Laba Bersih', '', formatCurrency(d.labaBersih)],
  ]

  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `laporan-laba-rugi-${selectedYear.value}-${selectedPeriod.value}-${selectedPeriodValue.value || 'full'}.csv`
  link.click()
}

// Get period label for modal title
const detailPeriodLabel = computed(() => {
  if (!selectedPeriodValue.value) return ''

  const monthNames = [
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

  if (selectedPeriod.value === 'month') {
    return `${monthNames[selectedPeriodValue.value - 1]} ${selectedYear.value}`
  } else if (selectedPeriod.value === 'quarter') {
    return `Kuartal ${selectedPeriodValue.value} ${selectedYear.value}`
  } else {
    return `Tahun ${selectedYear.value}`
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Laporan Laba Rugi</h1>
        <p class="text-base-content/60">Klik periode untuk melihat laporan detail</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body py-4">
        <div class="flex flex-col sm:flex-row items-center gap-4">
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
          <button class="btn btn-ghost btn-sm" :disabled="loadingSummary" @click="refreshSummary()">
            <svg
              class="w-5 h-5"
              :class="{ 'animate-spin': loadingSummary }"
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

    <!-- Summary Totals -->
    <div v-if="summaryData?.totals" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat bg-success/10 rounded-lg shadow-sm">
        <div class="stat-title">Total Pendapatan</div>
        <div class="stat-value text-success text-2xl">
          {{ formatCurrency(summaryData.totals.revenue) }}
        </div>
      </div>
      <div class="stat bg-error/10 rounded-lg shadow-sm">
        <div class="stat-title">Total Pengeluaran</div>
        <div class="stat-value text-error text-2xl">
          {{ formatCurrency(summaryData.totals.expenses) }}
        </div>
      </div>
      <div
        class="stat rounded-lg shadow-sm"
        :class="summaryData.totals.profit >= 0 ? 'bg-primary/10' : 'bg-warning/10'"
      >
        <div class="stat-title">Laba/Rugi</div>
        <div
          class="stat-value text-2xl"
          :class="summaryData.totals.profit >= 0 ? 'text-primary' : 'text-warning'"
        >
          {{ formatCurrency(summaryData.totals.profit) }}
        </div>
      </div>
      <div class="stat bg-base-200 rounded-lg shadow-sm">
        <div class="stat-title">Total Project</div>
        <div class="stat-value text-2xl">{{ summaryData.totals.projectCount }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingSummary" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Period Cards Dashboard -->
    <div v-else-if="summaryData?.summaries" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">
          Ringkasan per
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
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          <div
            v-for="item in summaryData.summaries"
            :key="item.periodValue"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:shadow-md"
            @click="openDetail(item.periodValue)"
          >
            <div class="card-body p-4 text-center">
              <h3 class="font-bold text-lg">{{ item.periodLabel }}</h3>
              <div class="divider my-1"></div>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Pendapatan</span>
                  <span class="text-success font-medium">
                    {{ formatCurrency(item.revenue) }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Pengeluaran</span>
                  <span class="text-error font-medium">
                    {{ formatCurrency(item.expenses) }}
                  </span>
                </div>
                <div class="divider my-1"></div>
                <div class="flex justify-between font-bold">
                  <span>Laba/Rugi</span>
                  <span :class="item.profit >= 0 ? 'text-success' : 'text-error'">
                    {{ formatCurrency(item.profit) }}
                  </span>
                </div>
              </div>
              <div class="badge badge-ghost badge-sm mt-2">{{ item.projectCount }} project</div>
            </div>
          </div>
        </div>

        <!-- Quarterly Grid -->
        <div
          v-else-if="selectedPeriod === 'quarter'"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div
            v-for="item in summaryData.summaries"
            :key="item.periodValue"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:shadow-md"
            @click="openDetail(item.periodValue)"
          >
            <div class="card-body p-6 text-center">
              <h3 class="font-bold text-2xl">{{ item.periodLabel }}</h3>
              <p class="text-base-content/60 text-sm">
                {{
                  item.periodValue === 1
                    ? 'Jan - Mar'
                    : item.periodValue === 2
                      ? 'Apr - Jun'
                      : item.periodValue === 3
                        ? 'Jul - Sep'
                        : 'Okt - Des'
                }}
              </p>
              <div class="divider my-2"></div>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Pendapatan</span>
                  <span class="text-success font-bold text-lg">
                    {{ formatCurrency(item.revenue) }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Pengeluaran</span>
                  <span class="text-error font-bold text-lg">
                    {{ formatCurrency(item.expenses) }}
                  </span>
                </div>
                <div class="divider my-2"></div>
                <div class="flex justify-between">
                  <span class="font-semibold">Laba/Rugi</span>
                  <span
                    class="font-bold text-xl"
                    :class="item.profit >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(item.profit) }}
                  </span>
                </div>
              </div>
              <div class="badge badge-ghost mt-3">{{ item.projectCount }} project</div>
            </div>
          </div>
        </div>

        <!-- Yearly Card -->
        <div v-else class="max-w-md mx-auto">
          <div
            v-for="item in summaryData.summaries"
            :key="item.periodValue"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:shadow-lg"
            @click="openDetail(item.periodValue)"
          >
            <div class="card-body p-8 text-center">
              <h3 class="font-bold text-3xl">{{ item.periodLabel }}</h3>
              <p class="text-base-content/60">Laporan Tahunan Lengkap</p>
              <div class="divider my-3"></div>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-base-content/60 text-lg">Total Pendapatan</span>
                  <span class="text-success font-bold text-2xl">
                    {{ formatCurrency(item.revenue) }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-base-content/60 text-lg">Total Pengeluaran</span>
                  <span class="text-error font-bold text-2xl">
                    {{ formatCurrency(item.expenses) }}
                  </span>
                </div>
                <div class="divider my-3"></div>
                <div class="flex justify-between items-center">
                  <span class="font-semibold text-lg">Laba/Rugi Bersih</span>
                  <span
                    class="font-bold text-3xl"
                    :class="item.profit >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(item.profit) }}
                  </span>
                </div>
              </div>
              <div class="badge badge-ghost badge-lg mt-4">{{ item.projectCount }} project</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <dialog :class="{ 'modal modal-open': showDetailModal, modal: !showDetailModal }">
      <div class="modal-box max-w-4xl">
        <!-- Modal Header -->
        <div class="flex justify-between items-center mb-4 print:hidden">
          <h3 class="font-bold text-xl">Detail Laporan Laba Rugi</h3>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" @click="exportToCSV">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              CSV
            </button>
            <button class="btn btn-ghost btn-sm" @click="printReport">
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
            <button class="btn btn-ghost btn-sm btn-circle" @click="closeDetail">✕</button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingDetail" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Report Content -->
        <div v-else-if="detailData" class="space-y-4 print:space-y-2">
          <!-- Report Header -->
          <div class="text-center mb-6 bg-primary/10 py-4 rounded-lg">
            <h2 class="text-xl font-bold text-primary">{{ detailData.companyName }}</h2>
            <p class="text-lg font-semibold mt-1">Laporan Laba Rugi Multi-Step</p>
            <p class="text-base-content/70">{{ detailData.periodLabel }}</p>
          </div>

          <!-- Report Table -->
          <div class="overflow-x-auto">
            <table class="table table-sm w-full">
              <tbody>
                <!-- Pendapatan Kotor -->
                <tr class="bg-primary/5">
                  <td class="font-semibold">Pendapatan Kotor</td>
                  <td class="text-right"></td>
                  <td class="text-right font-bold">
                    {{ formatCurrency(detailData.data.pendapatanKotor) }}
                  </td>
                </tr>

                <!-- Diskon & Retur -->
                <tr>
                  <td class="pl-6">Diskon Penjualan</td>
                  <td class="text-right">{{ formatCurrency(detailData.data.diskonPenjualan) }}</td>
                  <td class="text-right"></td>
                </tr>
                <tr>
                  <td class="pl-6">Retur Penjualan</td>
                  <td class="text-right">{{ formatCurrency(detailData.data.returPenjualan) }}</td>
                  <td class="text-right text-error">
                    ({{
                      formatCurrency(
                        detailData.data.diskonPenjualan + detailData.data.returPenjualan
                      )
                    }})
                  </td>
                </tr>

                <!-- Penjualan Bersih -->
                <tr class="bg-base-200">
                  <td class="font-semibold">Penjualan Bersih</td>
                  <td class="text-right"></td>
                  <td class="text-right font-bold">
                    {{ formatCurrency(detailData.data.penjualanBersih) }}
                  </td>
                </tr>

                <!-- HPP -->
                <tr class="bg-error/5">
                  <td class="font-semibold">HPP (Harga Pokok Penjualan)</td>
                  <td class="text-right"></td>
                  <td class="text-right font-bold text-error">
                    ({{ formatCurrency(detailData.data.hpp) }})
                  </td>
                </tr>

                <!-- Laba Kotor -->
                <tr class="bg-success/10">
                  <td class="font-bold">Laba Kotor</td>
                  <td class="text-right"></td>
                  <td class="text-right font-bold text-success text-lg">
                    {{ formatCurrency(detailData.data.labaKotor) }}
                  </td>
                </tr>

                <!-- Separator -->
                <tr>
                  <td colspan="3" class="py-2"></td>
                </tr>

                <!-- Operating Expenses Header -->
                <tr class="bg-warning/10">
                  <td colspan="3" class="font-bold">Pengeluaran/Biaya Operasional:</td>
                </tr>

                <!-- Biaya Penjualan -->
                <tr>
                  <td colspan="3" class="font-semibold italic">Biaya/Beban Penjualan:</td>
                </tr>
                <tr
                  v-for="(item, idx) in detailData.data.biayaPenjualan.items"
                  :key="'penjualan-' + idx"
                >
                  <td class="pl-6">{{ item.name }}</td>
                  <td class="text-right">{{ formatCurrency(item.amount) }}</td>
                  <td class="text-right"></td>
                </tr>
                <tr v-if="detailData.data.biayaPenjualan.items.length === 0">
                  <td class="pl-6 text-base-content/50 italic">Tidak ada data</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr class="border-t">
                  <td class="font-semibold">Total Biaya/Beban Penjualan</td>
                  <td class="text-right"></td>
                  <td class="text-right font-semibold">
                    {{ formatCurrency(detailData.data.biayaPenjualan.total) }}
                  </td>
                </tr>

                <!-- Separator -->
                <tr>
                  <td colspan="3" class="py-1"></td>
                </tr>

                <!-- Biaya Administratif -->
                <tr>
                  <td colspan="3" class="font-semibold italic">Biaya/Beban Administratif:</td>
                </tr>
                <tr
                  v-for="(item, idx) in detailData.data.biayaAdministratif.items"
                  :key="'admin-' + idx"
                >
                  <td class="pl-6">{{ item.name }}</td>
                  <td class="text-right">{{ formatCurrency(item.amount) }}</td>
                  <td class="text-right"></td>
                </tr>
                <tr v-if="detailData.data.biayaAdministratif.items.length === 0">
                  <td class="pl-6 text-base-content/50 italic">Tidak ada data</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr class="border-t">
                  <td class="font-semibold">Total Biaya Administratif</td>
                  <td class="text-right"></td>
                  <td class="text-right font-semibold">
                    {{ formatCurrency(detailData.data.biayaAdministratif.total) }}
                  </td>
                </tr>

                <!-- Separator -->
                <tr>
                  <td colspan="3" class="py-1"></td>
                </tr>

                <!-- Biaya Operasional Project -->
                <tr>
                  <td colspan="3" class="font-semibold italic">Biaya Operasional Project:</td>
                </tr>
                <tr
                  v-for="(item, idx) in detailData.data.biayaProject?.items || []"
                  :key="'project-' + idx"
                >
                  <td class="pl-6">{{ item.name }}</td>
                  <td class="text-right">{{ formatCurrency(item.amount) }}</td>
                  <td class="text-right"></td>
                </tr>
                <tr v-if="!detailData.data.biayaProject?.items?.length">
                  <td class="pl-6 text-base-content/50 italic">Tidak ada data</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr class="border-t">
                  <td class="font-semibold">Total Biaya Operasional Project</td>
                  <td class="text-right"></td>
                  <td class="text-right font-semibold">
                    {{ formatCurrency(detailData.data.biayaProject?.total || 0) }}
                  </td>
                </tr>

                <!-- Total Operating Expenses -->
                <tr class="bg-error/10">
                  <td class="font-bold">Total Operating Expenses</td>
                  <td class="text-right"></td>
                  <td class="text-right font-bold text-error">
                    ({{ formatCurrency(detailData.data.totalBiayaOperasional) }})
                  </td>
                </tr>

                <!-- Pendapatan Operasional -->
                <tr class="bg-primary/10">
                  <td class="font-bold">Pendapatan Operasional</td>
                  <td class="text-right"></td>
                  <td
                    class="text-right font-bold text-lg"
                    :class="
                      detailData.data.pendapatanOperasional >= 0 ? 'text-primary' : 'text-error'
                    "
                  >
                    {{ formatCurrency(detailData.data.pendapatanOperasional) }}
                  </td>
                </tr>

                <!-- Separator -->
                <tr>
                  <td colspan="3" class="py-2"></td>
                </tr>

                <!-- Pendapatan Lain-lain -->
                <tr class="bg-info/10">
                  <td colspan="3" class="font-bold">Pendapatan (Beban) Lain-Lain:</td>
                </tr>
                <tr
                  v-for="(item, idx) in detailData.data.pendapatanLainLain.items"
                  :key="'lain-' + idx"
                >
                  <td class="pl-6">{{ item.name }}</td>
                  <td class="text-right" :class="item.amount < 0 ? 'text-error' : 'text-success'">
                    {{
                      item.amount < 0
                        ? `(${formatCurrency(Math.abs(item.amount))})`
                        : formatCurrency(item.amount)
                    }}
                  </td>
                  <td class="text-right"></td>
                </tr>
                <tr v-if="detailData.data.pendapatanLainLain.items.length === 0">
                  <td class="pl-6 text-base-content/50 italic">Tidak ada data</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr class="border-t">
                  <td class="font-semibold">Total Pendapatan (Beban) Lain-Lain</td>
                  <td class="text-right"></td>
                  <td class="text-right font-semibold">
                    {{
                      detailData.data.pendapatanLainLain.total < 0
                        ? `(${formatCurrency(Math.abs(detailData.data.pendapatanLainLain.total))})`
                        : formatCurrency(detailData.data.pendapatanLainLain.total)
                    }}
                  </td>
                </tr>

                <!-- Separator -->
                <tr>
                  <td colspan="3" class="py-2"></td>
                </tr>

                <!-- Laba Bersih -->
                <tr class="bg-success/20">
                  <td class="font-bold text-lg">Laba Bersih</td>
                  <td class="text-right"></td>
                  <td
                    class="text-right font-bold text-xl"
                    :class="detailData.data.labaBersih >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(detailData.data.labaBersih) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Notes -->
          <div class="text-xs text-base-content/50 mt-4 print:mt-2">
            <p>* Angka dalam kurung () menunjukkan nilai negatif/pengurang</p>
            <p>* Laporan ini dihasilkan otomatis berdasarkan data transaksi yang tercatat</p>
          </div>
        </div>

        <!-- Modal Action -->
        <div class="modal-action print:hidden">
          <button class="btn" @click="closeDetail">Tutup</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeDetail">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
@media print {
  .print\:hidden {
    display: none !important;
  }
  .print\:space-y-2 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.5rem;
  }
  .print\:mt-2 {
    margin-top: 0.5rem;
  }
  .modal-backdrop {
    display: none !important;
  }
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    box-shadow: none !important;
  }
}
</style>
