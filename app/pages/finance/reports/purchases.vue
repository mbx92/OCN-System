<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()

// State
const selectedYear = ref(new Date().getFullYear())
const selectedPeriod = ref<'month' | 'quarter' | 'year'>('month')
const selectedPeriodValue = ref<number | null>(null)
const showDetailModal = ref(false)
const sisaTeknisiData = ref<any>(null)
const loadingSisaTeknisi = ref(false)

// Available years
const currentYear = new Date().getFullYear()
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

// Fetch summary data
const {
  data: summaryData,
  pending: loadingSummary,
  refresh: refreshSummary,
} = useFetch('/api/reports/purchases', {
  query: {
    year: selectedYear,
    period: selectedPeriod,
  },
  watch: [selectedYear, selectedPeriod],
})

// Fetch detail data
const {
  data: detailData,
  pending: loadingDetail,
  refresh: refreshDetail,
} = useFetch('/api/reports/purchases-detail', {
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
  refreshDetail()
  // Fetch sisa teknisi for this period
  loadingSisaTeknisi.value = true
  try {
    sisaTeknisiData.value = await $fetch('/api/reports/technician-remainder', {
      params: {
        year: selectedYear.value,
        period: selectedPeriod.value,
        periodValue,
      },
    })
  } catch (e) {
    sisaTeknisiData.value = null
  } finally {
    loadingSisaTeknisi.value = false
  }
}

// Close modal
function closeDetail() {
  showDetailModal.value = false
  selectedPeriodValue.value = null
  sisaTeknisiData.value = null
}

// Get period label
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
  }
  return `Tahun ${selectedYear.value}`
})

// Export CSV
function exportToCSV() {
  if (!detailData.value?.items) return
  const headers = [
    'Tanggal',
    'Tipe',
    'Referensi',
    'Deskripsi',
    'Kategori',
    'Supplier',
    'Jumlah',
    'Project',
  ]
  const rows = detailData.value.items.map((item: any) => [
    formatDate(item.date),
    item.type,
    item.reference,
    item.description,
    item.category,
    item.supplier || '-',
    item.amount,
    item.projectNumber || '-',
  ])
  const csvContent = [
    headers.join(','),
    ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `laporan-pembelian-${selectedYear.value}.csv`
  link.click()
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4"
    >
      <div>
        <h1 class="text-xl sm:text-2xl font-bold">Laporan Pembelian</h1>
        <p class="text-sm text-base-content/60 hidden sm:block">Purchase Order dan Asset</p>
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

          <!-- Year Select -->
          <select v-model="selectedYear" class="select select-bordered select-sm">
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>

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
    <div
      v-if="summaryData?.totals"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      <div class="stat bg-blue-500/10 rounded-lg shadow-sm p-3 sm:p-6">
        <div class="stat-title text-xs sm:text-sm">Total PO</div>
        <div class="stat-value text-blue-600 text-lg sm:text-2xl">
          {{ formatCurrency(summaryData.totals.poTotal) }}
        </div>
        <div class="stat-desc text-xs">{{ summaryData.totals.poCount }} transaksi</div>
      </div>
      <div class="stat bg-purple-500/10 rounded-lg shadow-sm p-3 sm:p-6">
        <div class="stat-title text-xs sm:text-sm">Total Asset</div>
        <div class="stat-value text-purple-600 text-lg sm:text-2xl">
          {{ formatCurrency(summaryData.totals.assetTotal) }}
        </div>
        <div class="stat-desc text-xs">{{ summaryData.totals.assetCount }} item</div>
      </div>
      <div class="stat bg-success/10 rounded-lg shadow-sm p-3 sm:p-6 hidden sm:flex sm:flex-col">
        <div class="stat-title text-xs sm:text-sm">Total Pembelian</div>
        <div class="stat-value text-success text-lg sm:text-2xl">
          {{ formatCurrency(summaryData.totals.total) }}
        </div>
        <div class="stat-desc text-xs">
          {{ summaryData.totals.poCount + summaryData.totals.assetCount }} total
        </div>
      </div>
      <div class="stat bg-base-200 rounded-lg shadow-sm p-3 sm:p-6 hidden sm:flex sm:flex-col">
        <div class="stat-title text-xs sm:text-sm">Total Project</div>
        <div class="stat-value text-lg sm:text-2xl">
          {{ summaryData.totals.poCount + summaryData.totals.assetCount }}
        </div>
        <div class="stat-desc text-xs">Transaksi pembelian</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingSummary" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Period Cards -->
    <div v-else-if="summaryData?.summaries" class="card bg-base-100 shadow-sm">
      <div class="card-body p-3 sm:p-6">
        <h2 class="card-title text-base sm:text-lg mb-3 sm:mb-4">
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
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4"
        >
          <div
            v-for="item in summaryData.summaries"
            :key="item.periodValue"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:shadow-md"
            @click="openDetail(item.periodValue)"
          >
            <div class="card-body p-3 sm:p-4">
              <h3 class="font-bold text-lg text-center">{{ item.periodLabel }}</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">PO</span>
                  <span class="text-blue-600 font-medium">{{ formatCurrency(item.poTotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Asset</span>
                  <span class="text-purple-600 font-medium">
                    {{ formatCurrency(item.assetTotal) }}
                  </span>
                </div>
                <div class="divider my-1"></div>
                <div class="flex justify-between font-bold">
                  <span>Total</span>
                  <span class="text-success">{{ formatCurrency(item.total) }}</span>
                </div>
              </div>
              <div class="text-xs text-base-content/50 text-center mt-2">
                {{ item.poCount + item.assetCount }} transaksi
              </div>
            </div>
          </div>
        </div>

        <!-- Quarterly/Yearly Table -->
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Periode</th>
                <th class="text-right">PO</th>
                <th class="text-right">Asset</th>
                <th class="text-right">Total</th>
                <th class="text-center">Jumlah</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in summaryData.summaries"
                :key="item.periodValue"
                class="hover cursor-pointer"
                @click="openDetail(item.periodValue)"
              >
                <td class="font-bold">{{ item.periodLabel }}</td>
                <td class="text-right text-blue-600">{{ formatCurrency(item.poTotal) }}</td>
                <td class="text-right text-purple-600">{{ formatCurrency(item.assetTotal) }}</td>
                <td class="text-right font-bold text-success">{{ formatCurrency(item.total) }}</td>
                <td class="text-center">{{ item.poCount + item.assetCount }}</td>
                <td>
                  <button class="btn btn-ghost btn-xs">Detail</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <dialog :class="['modal', { 'modal-open': showDetailModal }]">
      <div class="modal-box max-w-5xl w-full">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeDetail">
          ✕
        </button>
        <h3 class="font-bold text-base sm:text-lg mb-3 sm:mb-4">
          Detail Pembelian - {{ detailPeriodLabel }}
        </h3>

        <!-- Detail Loading -->
        <div v-if="loadingDetail" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <template v-else-if="detailData">
          <!-- Summary -->
          <div class="mb-4 sm:mb-6">
            <!-- Mobile: Only Total -->
            <div class="grid grid-cols-1 gap-2 sm:hidden">
              <div class="stat bg-success/10 rounded-lg p-3">
                <div class="stat-title text-xs">Total Pembelian</div>
                <div class="stat-value text-success text-lg">
                  {{ formatCurrency(detailData.totals.total) }}
                </div>
              </div>
            </div>
            <!-- Desktop: All cards -->
            <div class="hidden sm:grid grid-cols-3 gap-3">
              <div class="stat bg-blue-500/10 rounded-lg p-4">
                <div class="stat-title text-sm">Total PO</div>
                <div class="stat-value text-blue-600 text-xl">
                  {{ formatCurrency(detailData.totals.poTotal) }}
                </div>
              </div>
              <div class="stat bg-purple-500/10 rounded-lg p-4">
                <div class="stat-title text-sm">Total Asset</div>
                <div class="stat-value text-purple-600 text-xl">
                  {{ formatCurrency(detailData.totals.assetTotal) }}
                </div>
              </div>
              <div class="stat bg-success/10 rounded-lg p-4">
                <div class="stat-title text-sm">Total</div>
                <div class="stat-value text-success text-xl">
                  {{ formatCurrency(detailData.totals.total) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="overflow-x-auto max-h-96">
            <table class="table table-sm">
              <thead class="sticky top-0 bg-base-100">
                <tr>
                  <th class="hidden sm:table-cell">Tanggal</th>
                  <th>Tipe</th>
                  <th class="hidden md:table-cell">Referensi</th>
                  <th>Deskripsi</th>
                  <th class="hidden lg:table-cell">Supplier/Kategori</th>
                  <th class="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!detailData.items?.length">
                  <td colspan="6" class="text-center py-8 text-base-content/60">Tidak ada data</td>
                </tr>
                <tr v-for="item in detailData.items" :key="item.id">
                  <td class="hidden sm:table-cell text-xs">{{ formatDate(item.date) }}</td>
                  <td>
                    <span
                      class="badge badge-sm"
                      :class="item.type === 'PO' ? 'badge-info' : 'badge-secondary'"
                    >
                      {{ item.type }}
                    </span>
                  </td>
                  <td class="hidden md:table-cell font-mono text-xs">{{ item.reference }}</td>
                  <td class="max-w-xs truncate text-xs">
                    <div class="font-medium">{{ item.description }}</div>
                    <div class="text-base-content/60 text-xs sm:hidden">
                      {{ formatDate(item.date) }}
                    </div>
                  </td>
                  <td class="hidden lg:table-cell text-xs">{{ item.supplier || item.category }}</td>
                  <td class="text-right font-medium text-xs sm:text-sm">
                    {{ formatCurrency(item.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
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
              Sisa upah teknisi yang tidak dialokasikan ke teknisi dan disimpan ke kas perusahaan
              pada periode ini.
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

          <!-- Export -->
          <div class="modal-action">
            <button class="btn btn-ghost" @click="exportToCSV">Export CSV</button>
            <button class="btn" @click="closeDetail">Tutup</button>
          </div>
        </template>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeDetail">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
