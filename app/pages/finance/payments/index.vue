<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Pembayaran</h1>
        <p class="text-base-content/60">Kelola pembayaran proyek dan POS</p>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <button
          @click="openModal('PROJECT')"
          class="btn btn-sm sm:btn-md btn-primary flex-1 sm:flex-initial"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span class="hidden sm:inline">Bayar Proyek</span>
          <span class="sm:hidden">Proyek</span>
        </button>
        <button
          @click="openModal('POS')"
          class="btn btn-sm sm:btn-md btn-outline btn-success flex-1 sm:flex-initial"
        >
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
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          POS
        </button>
      </div>
    </div>

    <!-- Search & Filters Card -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Mode Tabs -->
          <div class="flex-none">
            <div class="tabs tabs-boxed">
              <button class="tab" :class="{ 'tab-active': !modeFilter }" @click="modeFilter = ''">
                Semua
              </button>
              <button
                class="tab"
                :class="{ 'tab-active': modeFilter === 'PROJECT' }"
                @click="modeFilter = 'PROJECT'"
              >
                Proyek
              </button>
              <button
                class="tab"
                :class="{ 'tab-active': modeFilter === 'POS' }"
                @click="modeFilter = 'POS'"
              >
                POS
              </button>
            </div>
          </div>

          <!-- View Toggle -->
          <div class="flex-none">
            <AppViewToggle v-model="viewMode" />
          </div>

          <!-- Search -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nomor pembayaran..."
            class="input input-bordered flex-1"
          />

          <!-- Project Filter -->
          <select v-model="projectFilter" class="select select-bordered w-full lg:w-48">
            <option value="">Semua Project</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">
              {{ p.projectNumber }} - {{ p.title?.substring(0, 20) }}
            </option>
          </select>

          <!-- From Date -->
          <input v-model="fromDate" type="date" class="input input-bordered w-full lg:w-40" />

          <!-- To Date -->
          <input v-model="toDate" type="date" class="input input-bordered w-full lg:w-40" />

          <!-- Reset Button -->
          <button @click="resetFilters" class="btn btn-ghost">
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

    <!-- Grid View -->
    <div v-if="viewMode === 'GRID'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="pending" class="col-span-full text-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div
        v-else-if="!payments?.length"
        class="col-span-full text-center py-8 text-base-content/60"
      >
        <p class="text-lg">Belum ada pembayaran</p>
      </div>
      <div
        v-for="pay in payments"
        :key="pay.id"
        @click="navigateTo(`/finance/payments/${pay.id}`)"
        class="card bg-base-200 hover:bg-base-300 transition-all cursor-pointer"
      >
        <div class="card-body p-4">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <h3 class="font-mono text-sm font-bold">{{ pay.paymentNumber }}</h3>
              <span
                class="badge badge-xs sm:badge-sm mt-1"
                :class="pay.mode === 'PROJECT' ? 'badge-primary' : 'badge-success'"
              >
                {{ pay.mode }}
              </span>
            </div>
            <span class="badge badge-ghost badge-xs sm:badge-sm">
              {{ getTypeLabel(pay.type) }}
            </span>
          </div>

          <div class="space-y-2 text-sm">
            <div v-if="pay.project" class="flex justify-between items-center">
              <span class="text-base-content/60">Proyek</span>
              <div class="text-right">
                <div class="text-xs font-medium">{{ pay.project.projectNumber }}</div>
                <div class="text-xs text-base-content/60">{{ pay.project.customer?.name }}</div>
              </div>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-base-content/60">Metode</span>
              <span class="text-xs">{{ pay.method }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-base-content/60">Tanggal</span>
              <span class="text-xs">{{ formatDate(pay.paymentDate) }}</span>
            </div>

            <div class="flex justify-between items-center pt-2 border-t border-base-300">
              <span class="text-base-content/60 font-semibold">Jumlah</span>
              <span class="font-mono font-bold text-success">
                {{ formatCurrency(pay.amount) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-sm sm:table-md">
            <thead>
              <tr>
                <th>No. Pembayaran</th>
                <th>Mode</th>
                <th>Proyek</th>
                <th>Tipe</th>
                <th class="text-right">Jumlah</th>
                <th>Metode</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pending" class="text-center">
                <td colspan="7" class="py-8">
                  <span class="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
              <tr v-else-if="!payments?.length" class="text-center">
                <td colspan="7" class="py-8 text-base-content/60">
                  <p class="text-lg">Belum ada pembayaran</p>
                </td>
              </tr>
              <tr
                v-for="pay in payments"
                :key="pay.id"
                class="hover cursor-pointer"
                @click="navigateTo(`/finance/payments/${pay.id}`)"
              >
                <td class="font-mono text-sm">
                  <NuxtLink :to="`/finance/payments/${pay.id}`" class="link link-primary">
                    {{ pay.paymentNumber }}
                  </NuxtLink>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="pay.mode === 'PROJECT' ? 'badge-primary' : 'badge-success'"
                  >
                    {{ pay.mode }}
                  </span>
                </td>
                <td>
                  <template v-if="pay.project">
                    <NuxtLink :to="`/projects/${pay.project.id}`" class="link link-primary">
                      {{ pay.project.projectNumber }}
                    </NuxtLink>
                    <p class="text-xs text-base-content/60">{{ pay.project.customer?.name }}</p>
                  </template>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td>
                  <span class="badge badge-ghost">{{ getTypeLabel(pay.type) }}</span>
                </td>
                <td class="text-right font-mono font-bold text-success">
                  {{ formatCurrency(pay.amount) }}
                </td>
                <td>{{ pay.method }}</td>
                <td class="text-sm">{{ formatDate(pay.paymentDate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="paymentsData?.meta?.total"
          class="flex justify-between items-center p-4 border-t border-base-200"
        >
          <span class="text-sm text-base-content/60">
            Menampilkan {{ payments?.length || 0 }} dari {{ paymentsData.meta.total }} data
          </span>
          <AppPagination
            :total="paymentsData.meta.total"
            :per-page="20"
            v-model:current-page="page"
          />
        </div>
      </div>
    </div>

    <!-- Add Payment Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ modalMode === 'PROJECT' ? 'Pembayaran Proyek' : 'Pembayaran POS' }}
        </h3>
        <form @submit.prevent="savePayment">
          <div class="space-y-4">
            <!-- Project Selection (PROJECT mode only) -->
            <div v-if="modalMode === 'PROJECT'" class="form-control">
              <label class="label"><span class="label-text">Proyek *</span></label>
              <AppProjectSelect
                v-model="form.projectId"
                placeholder="Cari proyek..."
                @select="onProjectSelectFromComponent"
              />
              <div v-if="selectedProject" class="text-sm mt-2 space-y-1">
                <p class="text-base-content/60">
                  Total Harga Jual:
                  <span class="font-mono font-bold text-success">
                    {{ formatCurrency(getProjectTotal(selectedProject)) }}
                  </span>
                </p>
                <p v-if="selectedProject.paidAmount > 0" class="text-base-content/60">
                  Sudah Dibayar:
                  <span class="font-mono font-bold text-info">
                    {{ formatCurrency(selectedProject.paidAmount) }}
                  </span>
                </p>
                <p
                  v-if="
                    selectedProject.remainingAmount !== undefined &&
                    selectedProject.remainingAmount > 0
                  "
                  class="text-warning font-semibold"
                >
                  Sisa Pembayaran:
                  <span class="font-mono">
                    {{ formatCurrency(selectedProject.remainingAmount) }}
                  </span>
                </p>
                <p
                  v-else-if="selectedProject.paidAmount >= getProjectTotal(selectedProject)"
                  class="text-success font-semibold"
                >
                  ✓ Sudah Lunas
                </p>
              </div>
            </div>

            <!-- Payment Type -->
            <div>
              <label class="block text-sm font-medium mb-2">Tipe Pembayaran *</label>
              <select v-model="form.type" class="select select-bordered w-full" required>
                <option value="FULL">Lunas</option>
                <option value="DP">Down Payment</option>
                <option value="INSTALLMENT">Cicilan</option>
                <option value="SETTLEMENT">Pelunasan</option>
              </select>
            </div>

            <!-- Amount -->
            <div>
              <label class="block text-sm font-medium mb-2">Jumlah *</label>
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                class="input input-bordered w-full"
                required
              />
            </div>

            <!-- Method -->
            <div>
              <label class="block text-sm font-medium mb-2">Metode Pembayaran *</label>
              <select v-model="form.method" class="select select-bordered w-full" required>
                <option value="CASH">Cash</option>
                <option value="TRANSFER">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="CARD">Kartu Debit/Kredit</option>
              </select>
            </div>

            <!-- Reference -->
            <div>
              <label class="block text-sm font-medium mb-2">Referensi (opsional)</label>
              <input
                v-model="form.reference"
                type="text"
                class="input input-bordered w-full"
                placeholder="No. rekening, no. transaksi"
              />
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium mb-2">Catatan</label>
              <textarea
                v-model="form.notes"
                class="textarea textarea-bordered w-full"
                rows="2"
              ></textarea>
            </div>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false" :disabled="saving">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner"></span>
              Simpan
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()

const modeFilter = ref('')
const page = ref(1)
// Filter states
const searchQuery = ref('')
const projectFilter = ref('')
const fromDate = ref('')
const toDate = ref('')

// Default to GRID on mobile, LIST on desktop
const viewMode = ref<'LIST' | 'GRID'>(
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'GRID' : 'LIST'
)
const showModal = ref(false)
const modalMode = ref<'PROJECT' | 'POS'>('PROJECT')
const saving = ref(false)

const form = reactive({
  projectId: '',
  type: 'FULL' as 'FULL' | 'DP' | 'INSTALLMENT' | 'SETTLEMENT',
  amount: 0,
  method: 'CASH',
  reference: '',
  notes: '',
})

const {
  data: paymentsData,
  pending,
  refresh,
} = await useFetch('/api/payments', {
  query: {
    mode: modeFilter,
    page,
    limit: 20,
    search: searchQuery,
    projectId: projectFilter,
    fromDate,
    toDate,
  },
  watch: [modeFilter, page, searchQuery, projectFilter, fromDate, toDate],
})

const payments = computed(() => (paymentsData.value as any)?.data || [])

// Fetch projects for dropdown
const { data: projectsData } = await useFetch('/api/projects', { query: { limit: 100 } })
const projects = computed(() => (projectsData.value as any)?.data || [])

// Selected project for showing value
const selectedProject = computed(() => {
  if (!form.projectId) return null
  return projects.value.find((p: any) => p.id === form.projectId)
})

// Calculate project total from items (selling price)
const getProjectTotal = (project: any): number => {
  if (!project?.items?.length) {
    // Fallback to totalAmount if items not loaded
    return parseFloat(project?.totalAmount || 0)
  }
  return project.items.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice || 0), 0)
}

// Auto-fill amount when project is selected
const onProjectSelect = () => {
  if (selectedProject.value) {
    form.amount = getProjectTotal(selectedProject.value)
  }
}

// Handler for AppProjectSelect component
const onProjectSelectFromComponent = (project: any) => {
  form.projectId = project.id
  // Use remaining amount if available, otherwise use total
  if (project.remainingAmount !== undefined && project.remainingAmount > 0) {
    form.amount = project.remainingAmount
    // Auto-set type based on payment status
    if (project.paidAmount > 0) {
      form.type = 'SETTLEMENT' // If already paid some, suggest settlement
    }
  } else if (project.paidAmount >= getProjectTotal(project)) {
    form.amount = 0 // Already fully paid
  } else {
    form.amount = getProjectTotal(project)
  }
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

const openModal = (mode: 'PROJECT' | 'POS') => {
  modalMode.value = mode
  form.projectId = ''
  form.type = 'FULL'
  form.amount = 0
  form.method = 'CASH'
  form.reference = ''
  form.notes = ''
  showModal.value = true
}

const savePayment = async () => {
  saving.value = true
  try {
    await $fetch('/api/payments', {
      method: 'POST',
      body: {
        mode: modalMode.value,
        projectId: modalMode.value === 'PROJECT' ? form.projectId : null,
        type: form.type,
        amount: form.amount,
        method: form.method,
        reference: form.reference || null,
        notes: form.notes || null,
      },
    })
    showAlert('Pembayaran berhasil disimpan!', 'success')
    showModal.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan pembayaran', 'error')
  } finally {
    saving.value = false
  }
}

// Reset all filters
const resetFilters = () => {
  searchQuery.value = ''
  projectFilter.value = ''
  fromDate.value = ''
  toDate.value = ''
  modeFilter.value = ''
  page.value = 1
}
</script>
