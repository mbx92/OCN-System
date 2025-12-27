<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()

// Asset data
const loading = ref(true)
const asset = ref<any>(null)

// Condition and status options
const assetConditions = [
  { value: 'EXCELLENT', label: 'Sangat Baik', color: 'badge-success' },
  { value: 'GOOD', label: 'Baik', color: 'badge-info' },
  { value: 'FAIR', label: 'Cukup', color: 'badge-warning' },
  { value: 'POOR', label: 'Kurang', color: 'badge-error' },
  { value: 'BROKEN', label: 'Rusak', color: 'badge-error' },
]

const assetStatuses = [
  { value: 'ACTIVE', label: 'Aktif', color: 'badge-success' },
  { value: 'IDLE', label: 'Tidak Terpakai', color: 'badge-warning' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'badge-info' },
  { value: 'DISPOSED', label: 'Dibuang', color: 'badge-ghost' },
]

// Load asset
async function loadAsset() {
  loading.value = true
  try {
    const data = await $fetch<any>(`/api/assets/${route.params.id}`)
    asset.value = data
  } catch (error: any) {
    console.error('Error loading asset:', error)
    showAlert(error.data?.statusMessage || 'Gagal memuat data asset', 'error')
    router.push('/finance/assets')
  } finally {
    loading.value = false
  }
}

// Get status/condition label and color
function getConditionInfo(condition: string) {
  return assetConditions.find(c => c.value === condition) || assetConditions[1]
}

function getStatusInfo(status: string) {
  return assetStatuses.find(s => s.value === status) || assetStatuses[0]
}

// Calculate usage age (from purchase date to now)
const usageAge = computed(() => {
  if (!asset.value?.purchaseDate) return { years: 0, months: 0, days: 0, totalMonths: 0 }

  const purchaseDate = new Date(asset.value.purchaseDate)
  const now = new Date()

  let years = now.getFullYear() - purchaseDate.getFullYear()
  let months = now.getMonth() - purchaseDate.getMonth()
  let days = now.getDate() - purchaseDate.getDate()

  if (days < 0) {
    months--
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  const totalMonths = years * 12 + months + days / 30

  return { years, months, days, totalMonths }
})

// Remaining useful life (if depreciation rate is set)
const usefulLifeYears = computed(() => {
  if (!asset.value?.depreciationRate || asset.value.depreciationRate <= 0) return null
  return 100 / asset.value.depreciationRate
})

// Calculate accumulated depreciation
const accumulatedDepreciation = computed(() => {
  if (!asset.value?.depreciationRate || !asset.value?.purchasePrice) return 0

  const monthlyDepreciation = (asset.value.purchasePrice * asset.value.depreciationRate) / 100 / 12
  const totalDepreciation = monthlyDepreciation * usageAge.value.totalMonths

  // Cannot exceed purchase price
  return Math.min(totalDepreciation, asset.value.purchasePrice)
})

// Current book value (purchase price - accumulated depreciation)
const currentBookValue = computed(() => {
  if (!asset.value?.purchasePrice) return 0
  return Math.max(0, asset.value.purchasePrice - accumulatedDepreciation.value)
})

// Depreciation breakdown by year
const depreciationBreakdown = computed(() => {
  if (!asset.value?.purchasePrice || !asset.value?.depreciationRate || !asset.value?.purchaseDate) {
    return []
  }

  const purchaseDate = new Date(asset.value.purchaseDate)
  const purchaseYear = purchaseDate.getFullYear()
  const currentYear = new Date().getFullYear()
  const yearlyRate = asset.value.depreciationRate / 100
  const yearlyDepreciation = asset.value.purchasePrice * yearlyRate

  const breakdown = []
  let remainingValue = asset.value.purchasePrice

  for (let year = purchaseYear; year <= currentYear && remainingValue > 0; year++) {
    let monthsInYear = 12

    // First year: calculate from purchase month
    if (year === purchaseYear) {
      monthsInYear = 12 - purchaseDate.getMonth()
    }

    // Current year: calculate to current month
    if (year === currentYear) {
      const currentMonth = new Date().getMonth()
      if (year === purchaseYear) {
        monthsInYear = currentMonth - purchaseDate.getMonth() + 1
      } else {
        monthsInYear = currentMonth + 1
      }
    }

    const depreciation = Math.min((yearlyDepreciation / 12) * monthsInYear, remainingValue)
    remainingValue -= depreciation

    breakdown.push({
      year,
      months: monthsInYear,
      depreciation,
      remainingValue: Math.max(0, remainingValue),
    })
  }

  return breakdown
})

// Remaining depreciation
const remainingDepreciation = computed(() => {
  return Math.max(0, asset.value?.purchasePrice - accumulatedDepreciation.value)
})

// Delete asset
async function deleteAsset() {
  const { confirm } = useConfirm()

  const confirmed = await confirm({
    title: 'Hapus Asset',
    message: 'Apakah Anda yakin ingin menghapus asset ini?',
    confirmText: 'Hapus',
    cancelText: 'Batal',
  })

  if (!confirmed) return

  try {
    await $fetch(`/api/assets/${route.params.id}`, {
      method: 'DELETE',
    })
    showAlert('Asset berhasil dihapus', 'success')
    router.push('/finance/assets')
  } catch (error: any) {
    console.error('Error deleting asset:', error)
    showAlert(error.data?.statusMessage || 'Gagal menghapus asset', 'error')
  }
}

// Init
onMounted(() => {
  loadAsset()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="flex items-center gap-3">
        <NuxtLink to="/finance/assets" class="btn btn-ghost btn-sm btn-circle">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </NuxtLink>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold">Detail Asset</h1>
          <p v-if="asset" class="text-sm text-base-content/60 font-mono">{{ asset.assetNumber }}</p>
        </div>
      </div>
      <div v-if="asset" class="flex gap-2">
        <NuxtLink :to="`/finance/assets?edit=${asset.id}`" class="btn btn-outline btn-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit
        </NuxtLink>
        <button @click="deleteAsset" class="btn btn-outline btn-error btn-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Hapus
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else-if="asset">
      <!-- Asset Info Card -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title text-lg">{{ asset.name }}</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            <!-- Basic Info -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base-content/80 border-b pb-1">Informasi Dasar</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">No. Asset</span>
                  <span class="font-mono">{{ asset.assetNumber }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Kategori</span>
                  <span>{{ asset.category }}</span>
                </div>
                <div v-if="asset.serialNumber" class="flex justify-between">
                  <span class="text-base-content/60">Serial Number</span>
                  <span class="font-mono">{{ asset.serialNumber }}</span>
                </div>
                <div v-if="asset.location" class="flex justify-between">
                  <span class="text-base-content/60">Lokasi</span>
                  <span>{{ asset.location }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-base-content/60">Status</span>
                  <span class="badge badge-sm" :class="getStatusInfo(asset.status).color">
                    {{ getStatusInfo(asset.status).label }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-base-content/60">Kondisi</span>
                  <span class="badge badge-sm" :class="getConditionInfo(asset.condition).color">
                    {{ getConditionInfo(asset.condition).label }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Financial Info -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base-content/80 border-b pb-1">Informasi Keuangan</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Tanggal Pembelian</span>
                  <span>{{ formatDate(asset.purchaseDate) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Harga Pembelian</span>
                  <span class="font-mono font-medium">
                    {{ formatCurrency(asset.purchasePrice) }}
                  </span>
                </div>
                <div v-if="asset.currentValue" class="flex justify-between">
                  <span class="text-base-content/60">Nilai Manual</span>
                  <span class="font-mono">{{ formatCurrency(asset.currentValue) }}</span>
                </div>
                <div v-if="asset.depreciationRate" class="flex justify-between">
                  <span class="text-base-content/60">Depresiasi/Tahun</span>
                  <span>{{ asset.depreciationRate }}%</span>
                </div>
                <div v-if="usefulLifeYears" class="flex justify-between">
                  <span class="text-base-content/60">Umur Ekonomis</span>
                  <span>{{ usefulLifeYears.toFixed(1) }} tahun</span>
                </div>
              </div>
            </div>

            <!-- Usage Age -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base-content/80 border-b pb-1">Umur Pemakaian</h3>
              <div class="text-center py-4">
                <div class="text-4xl font-bold text-primary">
                  {{ usageAge.years }}
                  <span class="text-lg font-normal text-base-content/60">tahun</span>
                </div>
                <div class="text-xl">
                  {{ usageAge.months }}
                  <span class="text-sm text-base-content/60">bulan</span>
                  {{ usageAge.days }}
                  <span class="text-sm text-base-content/60">hari</span>
                </div>
                <p class="text-xs text-base-content/60 mt-2">
                  Sejak: {{ formatDate(asset.purchaseDate) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Description & Notes -->
          <div
            v-if="asset.description || asset.notes"
            class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t"
          >
            <div v-if="asset.description">
              <h4 class="font-medium text-sm text-base-content/60 mb-1">Deskripsi</h4>
              <p class="text-sm">{{ asset.description }}</p>
            </div>
            <div v-if="asset.notes">
              <h4 class="font-medium text-sm text-base-content/60 mb-1">Catatan</h4>
              <p class="text-sm">{{ asset.notes }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Depreciation Card -->
      <div v-if="asset.depreciationRate" class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title text-lg">Perhitungan Depresiasi</h2>

          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Harga Pembelian</div>
              <div class="stat-value text-lg font-mono">
                {{ formatCurrency(asset.purchasePrice) }}
              </div>
            </div>

            <div class="stat bg-error/10 rounded-lg">
              <div class="stat-title">Akumulasi Depresiasi</div>
              <div class="stat-value text-lg font-mono text-error">
                {{ formatCurrency(accumulatedDepreciation) }}
              </div>
              <div class="stat-desc">
                {{ ((accumulatedDepreciation / asset.purchasePrice) * 100).toFixed(1) }}% dari harga
                beli
              </div>
            </div>

            <div class="stat bg-success/10 rounded-lg">
              <div class="stat-title">Nilai Buku Saat Ini</div>
              <div class="stat-value text-lg font-mono text-success">
                {{ formatCurrency(currentBookValue) }}
              </div>
              <div class="stat-desc">
                {{ ((currentBookValue / asset.purchasePrice) * 100).toFixed(1) }}% dari harga beli
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-4">
            <div class="flex justify-between text-sm mb-1">
              <span>Depresiasi</span>
              <span>{{ ((accumulatedDepreciation / asset.purchasePrice) * 100).toFixed(1) }}%</span>
            </div>
            <progress
              class="progress progress-error w-full"
              :value="accumulatedDepreciation"
              :max="asset.purchasePrice"
            ></progress>
          </div>

          <!-- Breakdown Table -->
          <div v-if="depreciationBreakdown.length > 0" class="mt-6">
            <h3 class="font-semibold mb-3">Rincian Depresiasi per Tahun</h3>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th class="text-center">Bulan</th>
                    <th class="text-right">Depresiasi</th>
                    <th class="text-right">Nilai Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in depreciationBreakdown" :key="row.year">
                    <td class="font-medium">{{ row.year }}</td>
                    <td class="text-center">{{ row.months }}</td>
                    <td class="text-right font-mono text-error">
                      {{ formatCurrency(row.depreciation) }}
                    </td>
                    <td class="text-right font-mono">
                      {{ formatCurrency(row.remainingValue) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="font-bold">
                    <td>Total</td>
                    <td></td>
                    <td class="text-right font-mono text-error">
                      {{ formatCurrency(accumulatedDepreciation) }}
                    </td>
                    <td class="text-right font-mono text-success">
                      {{ formatCurrency(currentBookValue) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Formula Info -->
          <div class="alert mt-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="text-sm">
              <p>
                <strong>Metode:</strong>
                Garis Lurus (Straight-Line Depreciation)
              </p>
              <p>
                <strong>Formula:</strong>
                Depresiasi per bulan = (Harga Beli × {{ asset.depreciationRate }}%) / 12
              </p>
              <p>
                <strong>Per bulan:</strong>
                {{ formatCurrency((asset.purchasePrice * asset.depreciationRate) / 100 / 12) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- No Depreciation Info -->
      <div v-else class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title text-lg">Perhitungan Depresiasi</h2>
          <div class="alert">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              Depresiasi tidak diatur untuk asset ini. Edit asset untuk menambahkan tingkat
              depresiasi per tahun.
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
