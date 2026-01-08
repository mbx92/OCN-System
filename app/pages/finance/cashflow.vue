<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Laporan Cashflow</h1>
        <p class="text-base-content/60">Arus kas masuk dan keluar</p>
      </div>
      <button @click="showAddModal = true" class="btn btn-primary">
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
        Transaksi Manual
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- View Toggle -->
          <div class="flex-none">
            <AppViewToggle v-model="viewMode" />
          </div>

          <!-- Search -->
          <div class="flex-1">
            <div class="form-control">
              <input
                v-model="search"
                type="text"
                placeholder="Cari deskripsi/kategori..."
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-3 lg:flex-none lg:w-auto">
            <div class="form-control w-full sm:w-36">
              <select v-model="filterType" class="select select-bordered w-full">
                <option value="">Semua Tipe</option>
                <option value="INCOME">Pemasukan</option>
                <option value="EXPENSE">Pengeluaran</option>
              </select>
            </div>
            <div class="form-control w-full sm:w-40">
              <select v-model="filterCategory" class="select select-bordered w-full">
                <option value="">Semua Kategori</option>
                <option value="PAYMENT">Pembayaran</option>
                <option value="PO">Purchase Order</option>
                <option value="EXPENSE">Expense</option>
                <option value="SALARY">Gaji Teknisi</option>
                <option value="ASSET">Aset</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div class="form-control w-full sm:w-36">
              <input
                v-model="dateFrom"
                type="date"
                class="input input-bordered w-full"
                placeholder="Dari"
              />
            </div>
            <div class="form-control w-full sm:w-36">
              <input
                v-model="dateTo"
                type="date"
                class="input input-bordered w-full"
                placeholder="Sampai"
              />
            </div>
            <button @click="resetFilters" class="btn btn-ghost gap-1" title="Reset Filter">
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Total Pemasukan</div>
        <div class="stat-value text-success text-2xl">
          {{ formatCurrency(summary?.totalIncome || 0) }}
        </div>
        <div class="stat-desc">{{ summary?.incomeCount || 0 }} transaksi</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Total Pengeluaran</div>
        <div class="stat-value text-error text-2xl">
          {{ formatCurrency(summary?.totalExpense || 0) }}
        </div>
        <div class="stat-desc">{{ summary?.expenseCount || 0 }} transaksi</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Saldo</div>
        <div
          class="stat-value text-2xl"
          :class="(summary?.balance || 0) >= 0 ? 'text-primary' : 'text-error'"
        >
          {{ formatCurrency(summary?.balance || 0) }}
        </div>
        <div class="stat-desc">Pemasukan - Pengeluaran</div>
      </div>
    </div>

    <!-- Category Breakdown -->
    <div v-if="summary?.categoryBreakdown?.length" class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-lg">Breakdown per Kategori</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-2">
          <div
            v-for="cat in summary.categoryBreakdown"
            :key="`${cat.type}-${cat.category}`"
            class="p-3 rounded-lg"
            :class="cat.type === 'INCOME' ? 'bg-success/10' : 'bg-error/10'"
          >
            <div class="text-xs text-base-content/60">{{ getCategoryLabel(cat.category) }}</div>
            <div
              class="font-mono font-bold"
              :class="cat.type === 'INCOME' ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(cat.total) }}
            </div>
            <div class="text-xs text-base-content/40">{{ cat.count }}x</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-lg">Riwayat Transaksi</h2>

        <div v-if="pending" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!transactions?.length" class="text-center py-8 text-base-content/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 mx-auto mb-2 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>Belum ada transaksi</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Referensi</th>
                <th class="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in transactions" :key="tx.id">
                <td class="text-sm">{{ formatDate(tx.date) }}</td>
                <td>
                  <span
                    class="badge badge-sm"
                    :class="tx.type === 'INCOME' ? 'badge-success' : 'badge-error'"
                  >
                    {{ tx.type === 'INCOME' ? 'Masuk' : 'Keluar' }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-ghost badge-sm">
                    {{ getCategoryLabel(tx.category) }}
                  </span>
                </td>
                <td class="max-w-xs truncate">{{ tx.description }}</td>
                <td class="text-sm font-mono text-base-content/60">{{ tx.reference || '-' }}</td>
                <td
                  class="text-right font-mono font-bold"
                  :class="tx.type === 'INCOME' ? 'text-success' : 'text-error'"
                >
                  {{ tx.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="meta && meta.totalPages > 1" class="flex justify-center mt-4">
          <div class="join">
            <button class="join-item btn btn-sm" :disabled="page <= 1" @click="page--">«</button>
            <button class="join-item btn btn-sm">Halaman {{ page }} / {{ meta.totalPages }}</button>
            <button
              class="join-item btn btn-sm"
              :disabled="page >= meta.totalPages"
              @click="page++"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Manual Transaction Modal -->
    <dialog class="modal" :class="{ 'modal-open': showAddModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Tambah Transaksi Manual</h3>

        <form @submit.prevent="addTransaction">
          <div class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Tipe *</span></label>
              <select v-model="form.type" class="select select-bordered w-full" required>
                <option value="INCOME">Pemasukan</option>
                <option value="EXPENSE">Pengeluaran</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Kategori *</span></label>
              <input
                v-model="form.category"
                type="text"
                class="input input-bordered w-full"
                placeholder="e.g. Modal, Lain-lain"
                required
              />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Jumlah *</span></label>
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                class="input input-bordered w-full"
                placeholder="0"
                required
              />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Deskripsi *</span></label>
              <input
                v-model="form.description"
                type="text"
                class="input input-bordered w-full"
                placeholder="Keterangan transaksi"
                required
              />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Tanggal</span></label>
              <input v-model="form.date" type="date" class="input input-bordered w-full" />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Referensi (opsional)</span></label>
              <input
                v-model="form.reference"
                type="text"
                class="input input-bordered w-full"
                placeholder="No. Invoice, dll"
              />
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="showAddModal = false" :disabled="saving">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-sm"></span>
              Simpan
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showAddModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()

const dateFrom = ref('')
const dateTo = ref('')
const filterType = ref('')
const filterCategory = ref('')
const search = ref('')
const viewMode = ref<'GRID' | 'LIST'>('LIST')
const page = ref(1)
const showAddModal = ref(false)
const saving = ref(false)

const resetFilters = () => {
  dateFrom.value = ''
  dateTo.value = ''
  filterType.value = ''
  filterCategory.value = ''
  search.value = ''
  page.value = 1
}

const form = reactive({
  type: 'INCOME' as 'INCOME' | 'EXPENSE',
  category: '',
  amount: 0,
  description: '',
  date: '',
  reference: '',
})

// Fetch transactions
const {
  data: transactionsData,
  pending,
  refresh,
} = await useFetch('/api/cashflow', {
  query: {
    page,
    limit: 20,
    type: filterType,
    category: filterCategory,
    dateFrom,
    dateTo,
  },
  watch: [page, filterType, filterCategory, dateFrom, dateTo],
})

const transactions = computed(() => (transactionsData.value as any)?.data || [])
const meta = computed(() => (transactionsData.value as any)?.meta)

// Fetch summary
const { data: summary, refresh: refreshSummary } = await useFetch('/api/cashflow/summary', {
  query: { dateFrom, dateTo },
  watch: [dateFrom, dateTo],
})

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    PAYMENT: 'Pembayaran',
    PO: 'Purchase Order',
    EXPENSE: 'Expense',
    SALARY: 'Gaji Teknisi',
    ASSET: 'Aset',
    MANUAL: 'Manual',
  }
  return labels[category] || category
}

const addTransaction = async () => {
  if (!form.amount || !form.description || !form.category) {
    showAlert('Mohon lengkapi semua field wajib', 'error')
    return
  }

  saving.value = true
  try {
    await $fetch('/api/cashflow', {
      method: 'POST',
      body: {
        type: form.type,
        category: form.category.toUpperCase(),
        amount: form.amount,
        description: form.description,
        date: form.date || undefined,
        reference: form.reference || undefined,
      },
    })

    showAlert('Transaksi berhasil ditambahkan', 'success')
    showAddModal.value = false

    // Reset form
    form.type = 'INCOME'
    form.category = ''
    form.amount = 0
    form.description = ''
    form.date = ''
    form.reference = ''

    // Refresh data
    await Promise.all([refresh(), refreshSummary()])
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menambahkan transaksi', 'error')
  } finally {
    saving.value = false
  }
}
</script>
