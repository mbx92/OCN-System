<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Rekap Pembayaran Saya</h1>
    </div>

    <!-- Filter Periode -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Filter Periode</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Pilih Bulan</span>
            </label>
            <input v-model="selectedPeriod" type="month" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Atau Range Tanggal</span>
            </label>
            <input
              v-model="startDate"
              type="date"
              class="input input-bordered"
              placeholder="Dari"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">&nbsp;</span>
            </label>
            <input
              v-model="endDate"
              type="date"
              class="input input-bordered"
              placeholder="Sampai"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button @click="loadRecap" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            Tampilkan Rekap
          </button>
          <button @click="downloadPDF" class="btn btn-success" :disabled="!recap || downloading">
            <span v-if="downloading" class="loading loading-spinner"></span>
            Download PDF
          </button>
          <button
            @click="sendViaTelegram"
            class="btn btn-info"
            :disabled="!recap || sending"
            v-if="user?.role === 'ADMIN' || user?.role === 'OWNER'"
          >
            <span v-if="sending" class="loading loading-spinner"></span>
            Kirim via Telegram
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Rekap Display -->
    <template v-else-if="recap">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-title">Total Pembayaran</div>
          <div class="stat-value text-success text-2xl">
            {{ formatCurrency(recap.summary.totalPayments) }}
          </div>
        </div>
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-title">Total Bonus</div>
          <div class="stat-value text-primary text-2xl">
            {{ formatCurrency(recap.summary.totalBonuses) }}
          </div>
        </div>
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-title">Potongan Kas Bon</div>
          <div class="stat-value text-warning text-2xl">
            {{ formatCurrency(recap.summary.totalCashAdvances) }}
          </div>
        </div>
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-title">Total Bersih</div>
          <div class="stat-value text-primary text-2xl">
            {{ formatCurrency(recap.summary.netPayment) }}
          </div>
        </div>
      </div>

      <!-- Pembayaran List -->
      <div v-if="recap.payments.length > 0" class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Rincian Pembayaran</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>No. Pembayaran</th>
                  <th>Proyek</th>
                  <th>Keterangan</th>
                  <th class="text-right">Jumlah</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(payment, idx) in recap.payments" :key="payment.id">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ formatDate(payment.createdAt) }}</td>
                  <td class="font-mono text-xs">{{ payment.paymentNumber }}</td>
                  <td>{{ payment.project?.projectNumber || '-' }}</td>
                  <td>{{ payment.description || '-' }}</td>
                  <td class="text-right font-mono">{{ formatCurrency(payment.amount) }}</td>
                  <td>
                    <span
                      class="badge badge-sm"
                      :class="{
                        'badge-success': payment.status === 'PAID',
                        'badge-warning': payment.status === 'PENDING',
                        'badge-error': payment.status === 'CANCELLED',
                      }"
                    >
                      {{ payment.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Bonus List -->
      <div v-if="recap.bonuses.length > 0" class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Bonus</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Keterangan</th>
                  <th class="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(bonus, idx) in recap.bonuses" :key="bonus.id">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ formatDate(bonus.date) }}</td>
                  <td>
                    <span class="badge badge-primary badge-sm">{{ bonus.bonusType }}</span>
                  </td>
                  <td>{{ bonus.description }}</td>
                  <td class="text-right font-mono text-primary">
                    {{ formatCurrency(bonus.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Kas Bon List -->
      <div v-if="recap.cashAdvances.length > 0" class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Potongan Kas Bon</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th class="text-right">Total</th>
                  <th class="text-right">Sisa Hutang</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(advance, idx) in recap.cashAdvances" :key="advance.id">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ formatDate(advance.date) }}</td>
                  <td>{{ advance.reason }}</td>
                  <td class="text-right font-mono">{{ formatCurrency(advance.amount) }}</td>
                  <td class="text-right font-mono text-warning">
                    {{ formatCurrency(advance.remainingAmount) }}
                  </td>
                  <td>
                    <span
                      class="badge badge-sm"
                      :class="{
                        'badge-success': advance.status === 'PAID',
                        'badge-warning': advance.status === 'UNPAID',
                        'badge-info': advance.status === 'PARTIALLY_PAID',
                      }"
                    >
                      {{ advance.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- No Data -->
      <div
        v-if="
          recap.payments.length === 0 &&
          recap.bonuses.length === 0 &&
          recap.cashAdvances.length === 0
        "
        class="card bg-base-100 shadow"
      >
        <div class="card-body text-center py-12">
          <p class="text-base-content/60">Tidak ada data pembayaran dalam periode ini</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

definePageMeta({
  middleware: 'auth',
})

const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()
const { user } = useAuth()

const selectedPeriod = ref(dayjs().format('YYYY-MM'))
const startDate = ref('')
const endDate = ref('')
const loading = ref(false)
const downloading = ref(false)
const sending = ref(false)
const recap = ref<any>(null)

// Get technician ID from user
const technicianId = computed(() => {
  // Assuming user has technician relation
  return user.value?.technician?.id || user.value?.id
})

const loadRecap = async () => {
  if (!technicianId.value) {
    showAlert('Technician ID not found', 'error')
    return
  }

  loading.value = true
  try {
    const params = new URLSearchParams({
      technicianId: technicianId.value,
    })

    if (selectedPeriod.value && !startDate.value && !endDate.value) {
      params.append('period', selectedPeriod.value)
    } else if (startDate.value && endDate.value) {
      params.append('startDate', startDate.value)
      params.append('endDate', endDate.value)
    } else if (selectedPeriod.value) {
      params.append('period', selectedPeriod.value)
    }

    recap.value = await $fetch(`/api/technicians/payment-recap?${params.toString()}`)
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal memuat rekap pembayaran', 'error')
  } finally {
    loading.value = false
  }
}

const downloadPDF = async () => {
  if (!recap.value || !technicianId.value) return

  downloading.value = true
  try {
    const params = new URLSearchParams({
      technicianId: technicianId.value,
    })

    if (selectedPeriod.value && !startDate.value && !endDate.value) {
      params.append('period', selectedPeriod.value)
    } else if (startDate.value && endDate.value) {
      params.append('startDate', startDate.value)
      params.append('endDate', endDate.value)
    }

    const response: any = await $fetch(
      `/api/technicians/payment-slip/generate?${params.toString()}`
    )

    // Use browser's print functionality to save as PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(response.data.html)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }

    showAlert('PDF siap didownload', 'success')
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal generate PDF', 'error')
  } finally {
    downloading.value = false
  }
}

const sendViaTelegram = async () => {
  if (!recap.value || !technicianId.value) return

  sending.value = true
  try {
    const params: any = {
      technicianId: technicianId.value,
    }

    if (selectedPeriod.value && !startDate.value && !endDate.value) {
      params.period = selectedPeriod.value
    } else if (startDate.value && endDate.value) {
      params.startDate = startDate.value
      params.endDate = endDate.value
    }

    await $fetch('/api/technicians/payment-slip/send-telegram', {
      method: 'POST',
      body: params,
    })

    showAlert('Slip pembayaran berhasil dikirim via Telegram', 'success')
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengirim via Telegram', 'error')
  } finally {
    sending.value = false
  }
}

// Load current month on mount
onMounted(() => {
  if (technicianId.value) {
    loadRecap()
  }
})
</script>
