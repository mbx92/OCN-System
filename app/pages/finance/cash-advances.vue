<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Kas Bon Teknisi</h1>
        <p class="text-gray-600 mt-1">Kelola kas bon (hutang) teknisi</p>
      </div>
      <button
        class="btn btn-primary"
        @click="openAddDialog"
        v-if="user?.role === 'ADMIN' || user?.role === 'OWNER'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
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
        Tambah Kas Bon
      </button>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-lg mb-6">
      <div class="card-body py-4 flex-row items-center gap-4">
        <!-- View Toggle -->
        <AppViewToggle v-model="viewMode" />

        <!-- Technician Filter -->
        <select v-model="selectedTechnician" class="select select-bordered">
          <option value="">Semua Teknisi</option>
          <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
            {{ tech.name }}
          </option>
        </select>

        <!-- Status Filter -->
        <select v-model="selectedStatus" class="select select-bordered">
          <option value="">Semua Status</option>
          <option value="UNPAID">Belum Lunas</option>
          <option value="PARTIALLY_PAID">Sebagian Lunas</option>
          <option value="PAID">Lunas</option>
        </select>

        <!-- Refresh Button -->
        <button class="btn btn-square btn-ghost" @click="loadCashAdvances" :disabled="loading">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            :class="{ 'animate-spin': loading }"
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
        </button>
      </div>
    </div>

    <!-- Cash Advances Grid View -->
    <div v-if="viewMode === 'GRID'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="loading" class="col-span-full flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="cashAdvances.length === 0" class="col-span-full text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 mx-auto text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p class="text-gray-500">Tidak ada data kas bon</p>
      </div>

      <div v-else v-for="ca in cashAdvances" :key="ca.id" class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-bold text-lg">{{ ca.technician.name }}</h3>
              <p class="text-sm text-gray-500">{{ ca.technician.phone }}</p>
            </div>
            <span
              class="badge"
              :class="{
                'badge-error': ca.status === 'UNPAID',
                'badge-warning': ca.status === 'PARTIALLY_PAID',
                'badge-success': ca.status === 'PAID',
              }"
            >
              {{
                ca.status === 'UNPAID'
                  ? 'Belum Lunas'
                  : ca.status === 'PARTIALLY_PAID'
                    ? 'Sebagian Lunas'
                    : 'Lunas'
              }}
            </span>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tanggal:</span>
              <span class="font-medium">{{ formatDate(ca.date) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Alasan:</span>
              <span class="font-medium">{{ ca.reason }}</span>
            </div>
            <div class="divider my-2"></div>
            <div class="flex justify-between">
              <span class="text-gray-600">Total:</span>
              <span class="font-bold">{{ formatCurrency(ca.amount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Terbayar:</span>
              <span class="font-medium text-success">{{ formatCurrency(ca.paidAmount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Sisa:</span>
              <span class="font-bold text-error">{{ formatCurrency(ca.remainingAmount) }}</span>
            </div>
          </div>

          <div
            class="card-actions justify-end mt-4"
            v-if="ca.status !== 'PAID' && (user?.role === 'ADMIN' || user?.role === 'OWNER')"
          >
            <button class="btn btn-sm btn-primary" @click="openPaymentDialog(ca)">Bayar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cash Advances Table -->
    <div v-else class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div v-if="loading" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="cashAdvances.length === 0" class="text-center py-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p class="text-gray-500">Tidak ada data kas bon</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Teknisi</th>
                <th>Alasan</th>
                <th>Jumlah</th>
                <th>Terbayar</th>
                <th>Sisa</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ca in cashAdvances" :key="ca.id">
                <td>{{ formatDate(ca.date) }}</td>
                <td>
                  <div class="font-semibold">{{ ca.technician.name }}</div>
                  <div class="text-sm text-gray-500">{{ ca.technician.phone }}</div>
                </td>
                <td>{{ ca.reason }}</td>
                <td>{{ formatCurrency(ca.amount) }}</td>
                <td>{{ formatCurrency(ca.paidAmount) }}</td>
                <td>{{ formatCurrency(ca.remainingAmount) }}</td>
                <td>
                  <span
                    class="badge"
                    :class="{
                      'badge-error': ca.status === 'UNPAID',
                      'badge-warning': ca.status === 'PARTIALLY_PAID',
                      'badge-success': ca.status === 'PAID',
                    }"
                  >
                    {{
                      ca.status === 'UNPAID'
                        ? 'Belum Lunas'
                        : ca.status === 'PARTIALLY_PAID'
                          ? 'Sebagian Lunas'
                          : 'Lunas'
                    }}
                  </span>
                </td>
                <td>
                  <button
                    v-if="
                      ca.status !== 'PAID' && (user?.role === 'ADMIN' || user?.role === 'OWNER')
                    "
                    class="btn btn-sm btn-primary"
                    @click="openPaymentDialog(ca)"
                  >
                    Bayar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Kas Bon Dialog -->
    <dialog ref="addDialog" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Tambah Kas Bon</h3>
        <form @submit.prevent="addCashAdvance">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Teknisi</span>
            </label>
            <select v-model="form.technicianId" class="select select-bordered w-full" required>
              <option value="">Pilih Teknisi</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                {{ tech.name }}
              </option>
            </select>
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Jumlah</span>
            </label>
            <input
              v-model.number="form.amount"
              type="number"
              class="input input-bordered w-full"
              placeholder="Masukkan jumlah"
              required
              min="0"
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Alasan</span>
            </label>
            <textarea
              v-model="form.reason"
              class="textarea textarea-bordered w-full"
              placeholder="Alasan kas bon"
              rows="3"
              required
            ></textarea>
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Tanggal</span>
            </label>
            <input v-model="form.date" type="date" class="input input-bordered w-full" required />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Catatan (Opsional)</span>
            </label>
            <textarea
              v-model="form.notes"
              class="textarea textarea-bordered w-full"
              placeholder="Catatan tambahan"
              rows="2"
            ></textarea>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeAddDialog">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner"></span>
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <!-- Payment Dialog -->
    <dialog ref="paymentDialog" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Bayar Kas Bon</h3>
        <div v-if="selectedCashAdvance" class="mb-4">
          <div class="bg-base-200 p-4 rounded-lg mb-4">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>Teknisi:</div>
              <div class="font-semibold">{{ selectedCashAdvance.technician.name }}</div>
              <div>Total Kas Bon:</div>
              <div class="font-semibold">{{ formatCurrency(selectedCashAdvance.amount) }}</div>
              <div>Sudah Dibayar:</div>
              <div class="font-semibold">{{ formatCurrency(selectedCashAdvance.paidAmount) }}</div>
              <div>Sisa:</div>
              <div class="font-semibold text-error">
                {{ formatCurrency(selectedCashAdvance.remainingAmount) }}
              </div>
            </div>
          </div>

          <form @submit.prevent="processPayment">
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Jumlah Pembayaran</span>
              </label>
              <input
                v-model.number="paymentForm.amount"
                type="number"
                class="input input-bordered w-full"
                placeholder="Masukkan jumlah pembayaran"
                required
                :max="selectedCashAdvance.remainingAmount"
                min="0"
              />
              <label class="label">
                <span class="label-text-alt">
                  Maksimal: {{ formatCurrency(selectedCashAdvance.remainingAmount) }}
                </span>
              </label>
            </div>

            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Tanggal Bayar</span>
              </label>
              <input
                v-model="paymentForm.paidDate"
                type="date"
                class="input input-bordered w-full"
                required
              />
            </div>

            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Catatan (Opsional)</span>
              </label>
              <textarea
                v-model="paymentForm.notes"
                class="textarea textarea-bordered w-full"
                placeholder="Catatan pembayaran"
                rows="2"
              ></textarea>
            </div>

            <div class="modal-action">
              <button type="button" class="btn" @click="closePaymentDialog">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="loading loading-spinner"></span>
                {{ saving ? 'Memproses...' : 'Bayar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useAuth } from '~/composables/useAuth'
import { useFormatter } from '~/composables/useFormatter'
import { useAlert } from '~/composables/useAlert'

const { user } = useAuth()
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()

definePageMeta({
  layout: 'default',
})

const loading = ref(false)
const saving = ref(false)
const viewMode = ref<'GRID' | 'LIST'>('LIST')
const cashAdvances = ref<any[]>([])
const technicians = ref<any[]>([])
const selectedTechnician = ref('')
const selectedStatus = ref('')
const addDialog = ref<HTMLDialogElement>()
const paymentDialog = ref<HTMLDialogElement>()
const selectedCashAdvance = ref<any>(null)

const form = ref({
  technicianId: '',
  amount: 0,
  reason: '',
  date: dayjs().format('YYYY-MM-DD'),
  notes: '',
})

const paymentForm = ref({
  amount: 0,
  paidDate: dayjs().format('YYYY-MM-DD'),
  notes: '',
})

onMounted(async () => {
  await loadTechnicians()
  await loadCashAdvances()
})

async function loadTechnicians() {
  try {
    const data = await $fetch('/api/technicians')
    technicians.value = data
  } catch (error) {
    console.error('Failed to load technicians:', error)
    showAlert('error', 'Gagal memuat data teknisi')
  }
}

async function loadCashAdvances() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (selectedTechnician.value) params.append('technicianId', selectedTechnician.value)
    if (selectedStatus.value) params.append('status', selectedStatus.value)

    const data = await $fetch(`/api/technicians/cash-advances?${params.toString()}`)
    cashAdvances.value = data
  } catch (error) {
    console.error('Failed to load cash advances:', error)
    showAlert('error', 'Gagal memuat data kas bon')
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  form.value = {
    technicianId: '',
    amount: 0,
    reason: '',
    date: dayjs().format('YYYY-MM-DD'),
    notes: '',
  }
  addDialog.value?.showModal()
}

function closeAddDialog() {
  addDialog.value?.close()
}

async function addCashAdvance() {
  saving.value = true
  try {
    await $fetch('/api/technicians/cash-advances', {
      method: 'POST',
      body: form.value,
    })

    showAlert('success', 'Kas bon berhasil ditambahkan')
    closeAddDialog()
    await loadCashAdvances()
  } catch (error) {
    console.error('Failed to add cash advance:', error)
    showAlert('error', 'Gagal menambahkan kas bon')
  } finally {
    saving.value = false
  }
}

function openPaymentDialog(cashAdvance: any) {
  selectedCashAdvance.value = cashAdvance
  paymentForm.value = {
    amount: cashAdvance.remainingAmount,
    paidDate: dayjs().format('YYYY-MM-DD'),
    notes: '',
  }
  paymentDialog.value?.showModal()
}

function closePaymentDialog() {
  paymentDialog.value?.close()
  selectedCashAdvance.value = null
}

async function processPayment() {
  if (!selectedCashAdvance.value) return

  saving.value = true
  try {
    await $fetch(`/api/technicians/cash-advances/${selectedCashAdvance.value.id}/pay`, {
      method: 'PATCH',
      body: paymentForm.value,
    })

    showAlert('success', 'Pembayaran kas bon berhasil diproses')
    closePaymentDialog()
    await loadCashAdvances()
  } catch (error) {
    console.error('Failed to process payment:', error)
    showAlert('error', 'Gagal memproses pembayaran')
  } finally {
    saving.value = false
  }
}
</script>
