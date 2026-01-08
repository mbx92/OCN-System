<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold mb-2">Pendapatan Saya</h1>
      <p class="text-base-content/60">Riwayat pembayaran dan fee yang tertunda</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Total Earnings This Month -->
      <div class="card bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-lg">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-80">Pendapatan Bulan Ini</p>
              <h3 class="text-2xl font-bold mt-1">
                {{ formatCurrency(stats?.totalEarnings || 0) }}
              </h3>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-12 h-12 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Pending Payment -->
      <div class="card bg-gradient-to-br from-warning to-warning-focus text-warning-content shadow-lg">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-80">Belum Dibayar</p>
              <h3 class="text-2xl font-bold mt-1">
                {{ formatCurrency(stats?.pendingPayment || 0) }}
              </h3>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-12 h-12 opacity-50"
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
          </div>
        </div>
      </div>

      <!-- Completed Projects This Month -->
      <div class="card bg-gradient-to-br from-success to-success-focus text-success-content shadow-lg">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-80">Proyek Selesai Bulan Ini</p>
              <h3 class="text-2xl font-bold mt-1">{{ stats?.completedProjects || 0 }}</h3>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-12 h-12 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment History -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title mb-4">Riwayat Pembayaran</h2>

        <!-- Loading -->
        <div v-if="loadingPayments" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Payments Table -->
        <div v-else-if="payments && payments.length > 0" class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Proyek</th>
                <th>Deskripsi</th>
                <th class="text-right">Jumlah</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in payments" :key="payment.id">
                <td>{{ formatDate(payment.paymentDate) }}</td>
                <td>
                  <div class="font-semibold">{{ payment.projectName || '-' }}</div>
                  <div class="text-xs text-base-content/60">{{ payment.projectCode || '-' }}</div>
                </td>
                <td>
                  <div class="max-w-xs truncate">{{ payment.notes || '-' }}</div>
                </td>
                <td class="text-right font-semibold">{{ formatCurrency(payment.amount) }}</td>
                <td>
                  <div class="badge badge-success">Dibayar</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-16 h-16 text-base-content/30 mb-4 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
            />
          </svg>
          <h3 class="text-xl font-semibold mb-2">Belum ada pembayaran</h3>
          <p class="text-base-content/60">Riwayat pembayaran Anda akan muncul di sini</p>
        </div>
      </div>
    </div>

    <!-- Pending Payments -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title mb-4">Fee Tertunda</h2>

        <!-- Loading -->
        <div v-if="loadingPending" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Pending Table -->
        <div v-else-if="pendingFees && pendingFees.length > 0" class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Proyek</th>
                <th>Pelanggan</th>
                <th>Status Proyek</th>
                <th class="text-right">Fee</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pendingFees" :key="item.id">
                <td>
                  <div class="font-semibold">{{ item.projectName }}</div>
                  <div class="text-xs text-base-content/60">{{ item.projectCode }}</div>
                </td>
                <td>{{ item.customer }}</td>
                <td>
                  <div class="badge" :class="getStatusClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </div>
                </td>
                <td class="text-right font-semibold text-warning">
                  {{ formatCurrency(item.fee) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="font-bold">
                <td colspan="3" class="text-right">Total Tertunda:</td>
                <td class="text-right text-warning text-lg">
                  {{ formatCurrency(totalPending) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-16 h-16 text-success/30 mb-4 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <h3 class="text-xl font-semibold mb-2">Semua fee sudah dibayar</h3>
          <p class="text-base-content/60">Tidak ada pembayaran yang tertunda</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()

// Fetch dashboard stats
const { data: stats } = await useFetch('/api/technician/dashboard-stats')

// Fetch payment history
const { data: payments, pending: loadingPayments } = await useFetch(
  '/api/technician/payment-history'
)

// Fetch pending fees
const { data: pendingFees, pending: loadingPending } = await useFetch(
  '/api/technician/pending-fees'
)

// Calculate total pending
const totalPending = computed(() => {
  if (!pendingFees.value) return 0
  return pendingFees.value.reduce((sum: number, item: any) => sum + Number(item.fee), 0)
})

// Status helpers
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    COMPLETED: 'Selesai',
    PAID: 'Dibayar',
    CLOSED: 'Ditutup',
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    COMPLETED: 'badge-success',
    PAID: 'badge-success',
    CLOSED: 'badge-ghost',
  }
  return classes[status] || 'badge-ghost'
}
</script>
