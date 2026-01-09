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

// Available years
const currentYear = new Date().getFullYear()
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

// Fetch summary data
const {
  data: summaryData,
  pending: loadingSummary,
  refresh: refreshSummary,
} = useFetch('/api/reports/expenses', {
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
} = useFetch('/api/reports/expenses-detail', {
  query: {
    year: selectedYear,
    period: selectedPeriod,
    periodValue: selectedPeriodValue,
  },
  immediate: false,
  watch: false,
})

// Open detail modal
function openDetail(periodValue: number) {
  selectedPeriodValue.value = periodValue
  showDetailModal.value = true
  refreshDetail()
}

// Close modal
function closeDetail() {
  showDetailModal.value = false
  selectedPeriodValue.value = null
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

// Get type label
function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    TECHNICIAN: 'Teknisi',
    PROJECT: 'Project',
    OPERATIONAL: 'Operasional',
    SALARY: 'Gaji',
    CASH: 'Cash',
    ASSET: 'Aset',
  }
  return labels[type] || type
}

// Get type badge class
function getTypeBadgeClass(type: string) {
  const classes: Record<string, string> = {
    TECHNICIAN: 'badge-info',
    PROJECT: 'badge-warning',
    OPERATIONAL: 'badge-success',
    SALARY: 'badge-primary',
    CASH: 'badge-secondary',
    ASSET: 'badge-accent',
  }
  return classes[type] || 'badge-ghost'
}

// Export CSV
function exportToCSV() {
  if (!detailData.value?.items) return
  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah', 'Referensi', 'Project']
  const rows = detailData.value.items.map((item: any) => [
    formatDate(item.date),
    getTypeLabel(item.type),
    item.category,
    item.description,
    item.amount,
    item.reference || '-',
    item.projectNumber || '-',
  ])
  const csvContent = [
    headers.join(','),
    ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `laporan-pengeluaran-${selectedYear.value}.csv`
  link.click()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Laporan Pengeluaran</h1>
        <p class="text-base-content/60">Teknisi, Project, dan Operasional</p>
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
    <div v-if="summaryData?.totals" class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="stat bg-info/10 rounded-lg shadow-sm">
        <div class="stat-title">Teknisi</div>
        <div class="stat-value text-info text-xl">
          {{ formatCurrency(summaryData.totals.technicianTotal) }}
        </div>
      </div>
      <div class="stat bg-warning/10 rounded-lg shadow-sm">
        <div class="stat-title">Project</div>
        <div class="stat-value text-warning text-xl">
          {{ formatCurrency(summaryData.totals.projectExpenseTotal) }}
        </div>
      </div>
      <div class="stat bg-success/10 rounded-lg shadow-sm">
        <div class="stat-title">Operasional</div>
        <div class="stat-value text-success text-xl">
          {{ formatCurrency(summaryData.totals.operationalTotal) }}
        </div>
      </div>
      <div class="stat bg-secondary/10 rounded-lg shadow-sm">
        <div class="stat-title">Cash Lainnya</div>
        <div class="stat-value text-secondary text-xl">
          {{ formatCurrency(summaryData.totals.cashExpenseTotal) }}
        </div>
      </div>
      <div class="stat bg-error/10 rounded-lg shadow-sm">
        <div class="stat-title">Total</div>
        <div class="stat-value text-error text-xl">
          {{ formatCurrency(summaryData.totals.total) }}
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingSummary" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Period Cards -->
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
            <div class="card-body p-4">
              <h3 class="font-bold text-lg text-center">{{ item.periodLabel }}</h3>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Teknisi</span>
                  <span class="text-info">{{ formatCurrency(item.technicianTotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Project</span>
                  <span class="text-warning">{{ formatCurrency(item.projectExpenseTotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Operasional</span>
                  <span class="text-success">{{ formatCurrency(item.operationalTotal) }}</span>
                </div>
                <div class="divider my-1"></div>
                <div class="flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span class="text-error">{{ formatCurrency(item.total) }}</span>
                </div>
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
                <th class="text-right">Teknisi</th>
                <th class="text-right">Project</th>
                <th class="text-right">Operasional</th>
                <th class="text-right">Cash</th>
                <th class="text-right">Total</th>
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
                <td class="text-right text-info">{{ formatCurrency(item.technicianTotal) }}</td>
                <td class="text-right text-warning">
                  {{ formatCurrency(item.projectExpenseTotal) }}
                </td>
                <td class="text-right text-success">{{ formatCurrency(item.operationalTotal) }}</td>
                <td class="text-right text-secondary">
                  {{ formatCurrency(item.cashExpenseTotal) }}
                </td>
                <td class="text-right font-bold text-error">{{ formatCurrency(item.total) }}</td>
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
      <div class="modal-box max-w-5xl">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeDetail">
          ✕
        </button>
        <h3 class="font-bold text-lg mb-4">Detail Pengeluaran - {{ detailPeriodLabel }}</h3>

        <!-- Detail Loading -->
        <div v-if="loadingDetail" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <template v-else-if="detailData">
          <!-- Summary -->
          <div class="grid grid-cols-5 gap-2 mb-6">
            <div class="stat bg-info/10 rounded-lg p-3">
              <div class="stat-title text-xs">Teknisi</div>
              <div class="stat-value text-info text-lg">
                {{ formatCurrency(detailData.totals.technicianTotal) }}
              </div>
            </div>
            <div class="stat bg-warning/10 rounded-lg p-3">
              <div class="stat-title text-xs">Project</div>
              <div class="stat-value text-warning text-lg">
                {{ formatCurrency(detailData.totals.projectExpenseTotal) }}
              </div>
            </div>
            <div class="stat bg-success/10 rounded-lg p-3">
              <div class="stat-title text-xs">Operasional</div>
              <div class="stat-value text-success text-lg">
                {{ formatCurrency(detailData.totals.operationalTotal) }}
              </div>
            </div>
            <div class="stat bg-secondary/10 rounded-lg p-3">
              <div class="stat-title text-xs">Cash</div>
              <div class="stat-value text-secondary text-lg">
                {{ formatCurrency(detailData.totals.cashExpenseTotal) }}
              </div>
            </div>
            <div class="stat bg-error/10 rounded-lg p-3">
              <div class="stat-title text-xs">Total</div>
              <div class="stat-value text-error text-lg">
                {{ formatCurrency(detailData.totals.total) }}
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="overflow-x-auto max-h-96">
            <table class="table table-sm">
              <thead class="sticky top-0 bg-base-100">
                <tr>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th>Project</th>
                  <th class="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!detailData.items?.length">
                  <td colspan="6" class="text-center py-8 text-base-content/60">Tidak ada data</td>
                </tr>
                <tr v-for="item in detailData.items" :key="item.id">
                  <td>{{ formatDate(item.date) }}</td>
                  <td>
                    <span class="badge badge-sm" :class="getTypeBadgeClass(item.type)">
                      {{ getTypeLabel(item.type) }}
                    </span>
                  </td>
                  <td>{{ item.category }}</td>
                  <td class="max-w-xs truncate">{{ item.description }}</td>
                  <td>
                    <span v-if="item.projectNumber" class="font-mono text-xs">
                      {{ item.projectNumber }}
                    </span>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                  <td class="text-right font-medium">{{ formatCurrency(item.amount) }}</td>
                </tr>
              </tbody>
            </table>
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
