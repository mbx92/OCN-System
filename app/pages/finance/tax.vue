<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Pajak UMKM - PPh Final 0,5%</h1>
        <p class="text-base-content/60">Kelola pembayaran PPh Final sesuai PP 55/2022</p>
      </div>
      <div class="flex gap-2">
        <button @click="showAutoGenerateModal = true" class="btn btn-outline btn-sm">
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
          Auto Generate
        </button>
        <button @click="showAddModal = true" class="btn btn-primary btn-sm">
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
          Catat Pajak
        </button>
      </div>
    </div>

    <!-- Alert for Overdue/Upcoming -->
    <div v-if="upcomingData?.overdue?.length" class="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div>
        <h3 class="font-bold">Ada {{ upcomingData.overdue.length }} pajak yang terlambat!</h3>
        <div class="text-sm">
          <span v-for="(item, idx) in upcomingData.overdue" :key="item.id">
            {{ item.period }} ({{ formatCurrency(item.taxAmount) }}){{
              idx < upcomingData.overdue.length - 1 ? ', ' : ''
            }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="upcomingData?.urgent?.length" class="alert alert-warning">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div>
        <h3 class="font-bold">Pajak akan jatuh tempo dalam 7 hari</h3>
        <div class="text-sm">
          <span v-for="(item, idx) in upcomingData.urgent" :key="item.id">
            {{ item.period }} - Jatuh tempo {{ formatDate(item.dueDate)
            }}{{ idx < upcomingData.urgent.length - 1 ? ', ' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Total Omzet {{ selectedYear }}</div>
        <div class="stat-value text-xl">{{ formatCurrency(summaryData?.totalOmzet || 0) }}</div>
        <div class="stat-desc" :class="summaryData?.isExempted ? 'text-success' : ''">
          {{ summaryData?.isExempted ? 'Bebas pajak (< 500jt)' : 'Kena PPh Final 0,5%' }}
        </div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Total Pajak Tahun Ini</div>
        <div class="stat-value text-xl text-primary">
          {{ formatCurrency(summaryData?.totalTax || 0) }}
        </div>
        <div class="stat-desc">0,5% dari omzet</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Sudah Dibayar</div>
        <div class="stat-value text-xl text-success">
          {{ formatCurrency(summaryData?.totalPaid || 0) }}
        </div>
        <div class="stat-desc">{{ summaryData?.counts?.paid || 0 }} bulan</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Belum Dibayar</div>
        <div class="stat-value text-xl text-error">
          {{ formatCurrency(summaryData?.totalUnpaid || 0) }}
        </div>
        <div class="stat-desc">
          {{ (summaryData?.counts?.unpaid || 0) + (summaryData?.counts?.overdue || 0) }} bulan
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-4">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="form-control">
            <select v-model="selectedYear" class="select select-bordered select-sm w-32">
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="form-control">
            <select v-model="filterStatus" class="select select-bordered select-sm w-40">
              <option value="">Semua Status</option>
              <option value="UNPAID">Belum Bayar</option>
              <option value="PAID">Sudah Bayar</option>
              <option value="OVERDUE">Terlambat</option>
              <option value="EXEMPTED">Bebas Pajak</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Tax Payments Table -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-lg">Daftar PPh Final Bulanan</h2>

        <div v-if="pending" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!taxPayments?.length" class="text-center py-8 text-base-content/60">
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
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
            />
          </svg>
          <p>Belum ada data pajak untuk tahun {{ selectedYear }}</p>
          <button @click="showAutoGenerateModal = true" class="btn btn-primary btn-sm mt-2">
            Generate Data Pajak
          </button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Periode</th>
                <th class="text-right">Omzet</th>
                <th class="text-right">PPh 0,5%</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
                <th>Tanggal Bayar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tax in taxPayments" :key="tax.id">
                <td class="font-medium">{{ tax.period }}</td>
                <td class="text-right font-mono">{{ formatCurrency(tax.omzet) }}</td>
                <td class="text-right font-mono font-bold">{{ formatCurrency(tax.taxAmount) }}</td>
                <td class="text-sm">{{ formatDate(tax.dueDate) }}</td>
                <td>
                  <span class="badge" :class="getStatusClass(tax.status)">
                    {{ getStatusLabel(tax.status) }}
                  </span>
                </td>
                <td class="text-sm">{{ tax.paymentDate ? formatDate(tax.paymentDate) : '-' }}</td>
                <td>
                  <div class="flex gap-1">
                    <button @click="viewDetail(tax)" class="btn btn-ghost btn-xs" title="Detail">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="tax.status !== 'PAID' && tax.status !== 'EXEMPTED'"
                      @click="openPayModal(tax)"
                      class="btn btn-primary btn-xs"
                      title="Bayar"
                    >
                      Bayar
                    </button>
                  </div>
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

    <!-- Add Tax Modal -->
    <dialog class="modal" :class="{ 'modal-open': showAddModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Catat Pajak Bulanan</h3>

        <form @submit.prevent="addTax">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Tahun *</span></label>
                <input
                  v-model.number="addForm.year"
                  type="number"
                  min="2020"
                  max="2099"
                  class="input input-bordered w-full"
                  required
                />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Bulan *</span></label>
                <select
                  v-model.number="addForm.month"
                  class="select select-bordered w-full"
                  required
                >
                  <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">
                    {{ name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Preview -->
            <div v-if="previewData" class="bg-base-200 p-4 rounded-lg space-y-2">
              <div class="flex justify-between">
                <span class="text-base-content/60">Omzet:</span>
                <span class="font-mono font-bold">{{ formatCurrency(previewData.omzet) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">PPh 0,5%:</span>
                <span class="font-mono font-bold text-primary">
                  {{ formatCurrency(previewData.taxAmount) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Jatuh Tempo:</span>
                <span>{{ formatDate(previewData.dueDate) }}</span>
              </div>
              <div v-if="previewData.exists" class="text-warning text-sm mt-2">
                ⚠️ Data untuk periode ini sudah ada
              </div>
            </div>

            <button
              type="button"
              @click="calculatePreview"
              class="btn btn-outline btn-sm w-full"
              :disabled="!addForm.year || !addForm.month"
            >
              Hitung Pajak
            </button>

            <div class="form-control">
              <label class="label"><span class="label-text">Kode Billing (opsional)</span></label>
              <input
                v-model="addForm.billingCode"
                type="text"
                class="input input-bordered w-full"
                placeholder="Dari DJP Online"
              />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Catatan (opsional)</span></label>
              <textarea
                v-model="addForm.notes"
                class="textarea textarea-bordered w-full"
                rows="2"
                placeholder="Catatan tambahan"
              ></textarea>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeAddModal" :disabled="saving">
              Batal
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="saving || !previewData || previewData.exists"
            >
              <span v-if="saving" class="loading loading-spinner loading-sm"></span>
              Simpan
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeAddModal">close</button>
      </form>
    </dialog>

    <!-- Pay Tax Modal -->
    <dialog class="modal" :class="{ 'modal-open': showPayModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Bayar Pajak - {{ selectedTax?.period }}</h3>

        <form @submit.prevent="payTax">
          <div class="space-y-4">
            <div class="bg-base-200 p-4 rounded-lg">
              <div class="flex justify-between mb-2">
                <span class="text-base-content/60">Omzet:</span>
                <span class="font-mono">{{ formatCurrency(selectedTax?.omzet || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">PPh 0,5%:</span>
                <span class="font-mono font-bold text-primary">
                  {{ formatCurrency(selectedTax?.taxAmount || 0) }}
                </span>
              </div>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Tanggal Pembayaran *</span></label>
              <input
                v-model="payForm.paymentDate"
                type="date"
                class="input input-bordered w-full"
                required
              />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Kode Billing</span></label>
              <input
                v-model="payForm.billingCode"
                type="text"
                class="input input-bordered w-full"
                placeholder="Dari e-Billing DJP"
              />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Upload Bukti Pembayaran</span></label>
              <input
                type="file"
                class="file-input file-input-bordered w-full"
                accept=".pdf,.jpg,.jpeg,.png"
                @change="handleFileUpload"
              />
              <label class="label">
                <span class="label-text-alt">PDF, JPG, PNG (max 5MB)</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Catatan</span></label>
              <textarea
                v-model="payForm.notes"
                class="textarea textarea-bordered w-full"
                rows="2"
                placeholder="Catatan pembayaran"
              ></textarea>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closePayModal" :disabled="paying">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="paying">
              <span v-if="paying" class="loading loading-spinner loading-sm"></span>
              Konfirmasi Bayar
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closePayModal">close</button>
      </form>
    </dialog>

    <!-- Detail Modal -->
    <dialog class="modal" :class="{ 'modal-open': showDetailModal }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Detail Pajak - {{ detailData?.period }}</h3>

        <div v-if="loadingDetail" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="detailData" class="space-y-4">
          <!-- Summary -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-base-200 p-4 rounded-lg">
              <div class="text-sm text-base-content/60">Total Omzet</div>
              <div class="text-xl font-bold font-mono">{{ formatCurrency(detailData.omzet) }}</div>
            </div>
            <div class="bg-primary/10 p-4 rounded-lg">
              <div class="text-sm text-base-content/60">PPh Final 0,5%</div>
              <div class="text-xl font-bold font-mono text-primary">
                {{ formatCurrency(detailData.taxAmount) }}
              </div>
            </div>
          </div>

          <!-- Status Info -->
          <div class="flex items-center gap-4">
            <span class="badge badge-lg" :class="getStatusClass(detailData.status)">
              {{ getStatusLabel(detailData.status) }}
            </span>
            <span v-if="detailData.status !== 'PAID'" class="text-sm">
              Jatuh tempo: {{ formatDate(detailData.dueDate) }}
              <span v-if="detailData.isOverdue" class="text-error">
                ({{ Math.abs(detailData.daysUntilDue) }} hari terlambat)
              </span>
              <span v-else class="text-base-content/60">
                ({{ detailData.daysUntilDue }} hari lagi)
              </span>
            </span>
            <span v-else class="text-sm text-success">
              Dibayar: {{ formatDate(detailData.paymentDate) }}
            </span>
          </div>

          <!-- Payment Details -->
          <div v-if="detailData.paymentDetails?.length" class="mt-4">
            <h4 class="font-semibold mb-2">
              Rincian Omzet ({{ detailData.paymentDetails.length }} transaksi)
            </h4>
            <div class="overflow-x-auto max-h-60">
              <table class="table table-sm table-zebra">
                <thead>
                  <tr>
                    <th>No. Pembayaran</th>
                    <th>Project</th>
                    <th>Customer</th>
                    <th class="text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in detailData.paymentDetails" :key="p.id">
                    <td class="font-mono text-sm">{{ p.paymentNumber }}</td>
                    <td class="text-sm">{{ p.projectNumber || '-' }}</td>
                    <td class="text-sm">{{ p.customerName || '-' }}</td>
                    <td class="text-right font-mono">{{ formatCurrency(p.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Billing Code & Notes -->
          <div v-if="detailData.billingCode || detailData.notes" class="bg-base-200 p-4 rounded-lg">
            <div v-if="detailData.billingCode" class="mb-2">
              <span class="text-sm text-base-content/60">Kode Billing:</span>
              <span class="ml-2 font-mono">{{ detailData.billingCode }}</span>
            </div>
            <div v-if="detailData.notes">
              <span class="text-sm text-base-content/60">Catatan:</span>
              <p class="mt-1">{{ detailData.notes }}</p>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="showDetailModal = false">Tutup</button>
          <button
            v-if="detailData && detailData.status !== 'PAID' && detailData.status !== 'EXEMPTED'"
            @click="openPayModalFromDetail"
            class="btn btn-primary"
          >
            Bayar Sekarang
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showDetailModal = false">close</button>
      </form>
    </dialog>

    <!-- Auto Generate Modal -->
    <dialog class="modal" :class="{ 'modal-open': showAutoGenerateModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Generate Data Pajak Otomatis</h3>
        <p class="text-base-content/60 mb-4">
          Generate data pajak untuk periode yang belum tercatat berdasarkan data pembayaran yang
          sudah ada.
        </p>

        <form @submit.prevent="autoGenerate">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Dari Tahun</span></label>
                <input
                  v-model.number="autoGenForm.fromYear"
                  type="number"
                  min="2020"
                  max="2099"
                  class="input input-bordered w-full"
                  required
                />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Dari Bulan</span></label>
                <select
                  v-model.number="autoGenForm.fromMonth"
                  class="select select-bordered w-full"
                  required
                >
                  <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">
                    {{ name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Sampai Tahun</span></label>
                <input
                  v-model.number="autoGenForm.toYear"
                  type="number"
                  min="2020"
                  max="2099"
                  class="input input-bordered w-full"
                  required
                />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Sampai Bulan</span></label>
                <select
                  v-model.number="autoGenForm.toMonth"
                  class="select select-bordered w-full"
                  required
                >
                  <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">
                    {{ name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="showAutoGenerateModal = false"
              :disabled="generating"
            >
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="generating">
              <span v-if="generating" class="loading loading-spinner loading-sm"></span>
              Generate
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showAutoGenerateModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()

// State
const page = ref(1)
const selectedYear = ref(new Date().getFullYear())
const filterStatus = ref('')
const showAddModal = ref(false)
const showPayModal = ref(false)
const showDetailModal = ref(false)
const showAutoGenerateModal = ref(false)
const saving = ref(false)
const paying = ref(false)
const generating = ref(false)
const loadingDetail = ref(false)

const selectedTax = ref<any>(null)
const detailData = ref<any>(null)
const previewData = ref<any>(null)

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

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= 2020; y--) {
    years.push(y)
  }
  return years
})

// Forms
const addForm = reactive({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  billingCode: '',
  notes: '',
})

const payForm = reactive({
  paymentDate: new Date().toISOString().split('T')[0],
  billingCode: '',
  paymentProof: '',
  notes: '',
})

const autoGenForm = reactive({
  fromYear: new Date().getFullYear(),
  fromMonth: 1,
  toYear: new Date().getFullYear(),
  toMonth: new Date().getMonth() + 1,
})

// Fetch data
const {
  data: taxData,
  pending,
  refresh,
} = await useFetch('/api/tax', {
  query: {
    year: selectedYear,
    status: filterStatus,
    page,
    limit: 12,
  },
  watch: [selectedYear, filterStatus, page],
})

const taxPayments = computed(() => (taxData.value as any)?.data || [])
const meta = computed(() => (taxData.value as any)?.meta)

// Fetch summary
const { data: summaryData, refresh: refreshSummary } = await useFetch('/api/tax/summary')

// Fetch upcoming
const { data: upcomingData, refresh: refreshUpcoming } = await useFetch('/api/tax/upcoming')

// Methods
const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    PAID: 'badge-success',
    UNPAID: 'badge-warning',
    OVERDUE: 'badge-error',
    EXEMPTED: 'badge-info',
  }
  return classes[status] || 'badge-ghost'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PAID: 'Lunas',
    UNPAID: 'Belum Bayar',
    OVERDUE: 'Terlambat',
    EXEMPTED: 'Bebas Pajak',
  }
  return labels[status] || status
}

const calculatePreview = async () => {
  try {
    const result = await $fetch(`/api/tax/calculate/${addForm.year}/${addForm.month}`)
    previewData.value = result
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menghitung pajak', 'error')
  }
}

const closeAddModal = () => {
  showAddModal.value = false
  previewData.value = null
  addForm.billingCode = ''
  addForm.notes = ''
}

const addTax = async () => {
  if (!previewData.value || previewData.value.exists) return

  saving.value = true
  try {
    await $fetch('/api/tax', {
      method: 'POST',
      body: {
        year: addForm.year,
        month: addForm.month,
        billingCode: addForm.billingCode || undefined,
        notes: addForm.notes || undefined,
      },
    })

    showAlert('Data pajak berhasil dicatat', 'success')
    closeAddModal()
    await Promise.all([refresh(), refreshSummary(), refreshUpcoming()])
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan data pajak', 'error')
  } finally {
    saving.value = false
  }
}

const openPayModal = (tax: any) => {
  selectedTax.value = tax
  payForm.billingCode = tax.billingCode || ''
  payForm.paymentDate = new Date().toISOString().split('T')[0]
  payForm.notes = ''
  payForm.paymentProof = ''
  showPayModal.value = true
}

const closePayModal = () => {
  showPayModal.value = false
  selectedTax.value = null
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    showAlert('File terlalu besar (max 5MB)', 'error')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const result = await $fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    payForm.paymentProof = (result as any).url
    showAlert('File berhasil diupload', 'success')
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal upload file', 'error')
  }
}

const payTax = async () => {
  if (!selectedTax.value) return

  paying.value = true
  try {
    await $fetch(`/api/tax/${selectedTax.value.id}/pay`, {
      method: 'POST',
      body: {
        paymentDate: payForm.paymentDate,
        billingCode: payForm.billingCode || undefined,
        paymentProof: payForm.paymentProof || undefined,
        notes: payForm.notes || undefined,
      },
    })

    showAlert('Pembayaran pajak berhasil dicatat', 'success')
    closePayModal()
    await Promise.all([refresh(), refreshSummary(), refreshUpcoming()])
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mencatat pembayaran', 'error')
  } finally {
    paying.value = false
  }
}

const viewDetail = async (tax: any) => {
  showDetailModal.value = true
  loadingDetail.value = true

  try {
    const result = await $fetch(`/api/tax/${tax.id}`)
    detailData.value = result
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal memuat detail', 'error')
    showDetailModal.value = false
  } finally {
    loadingDetail.value = false
  }
}

const openPayModalFromDetail = () => {
  if (!detailData.value) return
  showDetailModal.value = false
  openPayModal(detailData.value)
}

const autoGenerate = async () => {
  generating.value = true
  try {
    const result: any = await $fetch('/api/tax/auto-generate', {
      method: 'POST',
      body: autoGenForm,
    })

    showAlert(`Berhasil generate ${result.summary.generatedCount} data pajak`, 'success')
    showAutoGenerateModal.value = false
    await Promise.all([refresh(), refreshSummary(), refreshUpcoming()])
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal generate data pajak', 'error')
  } finally {
    generating.value = false
  }
}
</script>
