<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency } = useFormatter()

// State
const selectedYear = ref(new Date().getFullYear())

// Computed years for dropdown
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y)
  }
  return years
})

// Fetch data
const { data, pending, refresh } = useFetch('/api/reports/cash-vs-accrual', {
  query: {
    year: selectedYear,
  },
  watch: [selectedYear],
})

// Print report
function printReport() {
  window.print()
}

// Format number with positive/negative styling
function formatAmount(value: number, showSign = false): string {
  if (showSign && value !== 0) {
    return value > 0 ? `+${formatCurrency(value)}` : formatCurrency(value)
  }
  return formatCurrency(value)
}

// Get profit color
function getProfitColor(value: number) {
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-error'
  return 'text-base-content'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden"
    >
      <div>
        <h1 class="text-2xl font-bold">Laporan Kas vs Akrual</h1>
        <p class="text-base-content/60">Perbandingan metode pencatatan kas dan akrual</p>
      </div>

      <div class="flex gap-2">
        <select v-model="selectedYear" class="select select-bordered">
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>
        <button @click="printReport" class="btn btn-ghost">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          <span class="hidden sm:inline">Print</span>
        </button>
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="data" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div class="stat bg-blue-50 rounded-lg border border-blue-200">
          <div class="stat-title text-blue-800">Saldo Kas</div>
          <div class="stat-value text-blue-600 text-2xl">
            {{ formatCurrency(data.cashflow.balance) }}
          </div>
          <div class="stat-desc text-blue-600">Basis Kas (Cash)</div>
        </div>

        <div class="stat bg-green-50 rounded-lg border border-green-200">
          <div class="stat-title text-green-800">Laba Bersih</div>
          <div class="stat-value text-green-600 text-2xl">
            {{ formatCurrency(data.accrual.netProfit) }}
          </div>
          <div class="stat-desc text-green-600">Basis Akrual</div>
        </div>

        <div
          class="stat rounded-lg border"
          :class="
            data.analysis.difference >= 0
              ? 'bg-purple-50 border-purple-200'
              : 'bg-orange-50 border-orange-200'
          "
        >
          <div
            class="stat-title"
            :class="data.analysis.difference >= 0 ? 'text-purple-800' : 'text-orange-800'"
          >
            Selisih
          </div>
          <div
            class="stat-value text-2xl"
            :class="data.analysis.difference >= 0 ? 'text-purple-600' : 'text-orange-600'"
          >
            {{ formatCurrency(data.analysis.difference) }}
          </div>
          <div
            class="stat-desc"
            :class="data.analysis.difference >= 0 ? 'text-purple-600' : 'text-orange-600'"
          >
            Kas - Akrual
          </div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Cashflow (Basis Kas) -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title text-lg border-b pb-2">
              <span class="badge badge-primary">BASIS KAS</span>
              Cashflow
            </h2>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <!-- Income Section -->
                  <tr class="bg-success/10">
                    <td colspan="2" class="font-bold text-success">PEMASUKAN</td>
                  </tr>
                  <tr
                    v-for="(cat, key) in data.cashflow.income.byCategory"
                    :key="key"
                    class="hover"
                  >
                    <td class="pl-6">
                      {{ key }}
                      <span class="ml-2 badge badge-xs badge-ghost">{{ cat.count }}</span>
                    </td>
                    <td class="text-right font-mono">{{ formatCurrency(cat.amount) }}</td>
                  </tr>
                  <tr class="font-bold border-t-2">
                    <td>Total Pemasukan</td>
                    <td class="text-right font-mono text-success">
                      {{ formatCurrency(data.cashflow.income.total) }}
                    </td>
                  </tr>

                  <!-- Spacing -->
                  <tr>
                    <td colspan="2" class="py-2"></td>
                  </tr>

                  <!-- Expense Section -->
                  <tr class="bg-error/10">
                    <td colspan="2" class="font-bold text-error">PENGELUARAN</td>
                  </tr>
                  <tr
                    v-for="(cat, key) in data.cashflow.expense.byCategory"
                    :key="key"
                    class="hover"
                  >
                    <td class="pl-6">
                      {{ key }}
                      <span class="ml-2 badge badge-xs badge-ghost">{{ cat.count }}</span>
                    </td>
                    <td class="text-right font-mono">{{ formatCurrency(cat.amount) }}</td>
                  </tr>
                  <tr class="font-bold border-t-2">
                    <td>Total Pengeluaran</td>
                    <td class="text-right font-mono text-error">
                      {{ formatCurrency(data.cashflow.expense.total) }}
                    </td>
                  </tr>

                  <!-- Balance -->
                  <tr class="bg-base-200 font-bold text-lg border-t-4">
                    <td>SALDO KAS</td>
                    <td class="text-right font-mono" :class="getProfitColor(data.cashflow.balance)">
                      {{ formatCurrency(data.cashflow.balance) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Accrual (Basis Akrual) -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title text-lg border-b pb-2">
              <span class="badge badge-success">BASIS AKRUAL</span>
              Laba Rugi
            </h2>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <!-- Revenue -->
                  <tr class="bg-success/10">
                    <td colspan="2" class="font-bold text-success">PENDAPATAN</td>
                  </tr>
                  <tr>
                    <td class="pl-6">
                      Dari Pembayaran
                      <span class="ml-2 badge badge-xs badge-ghost">
                        {{ data.metadata.paymentsCount }}
                      </span>
                    </td>
                    <td class="text-right font-mono text-success">
                      {{ formatCurrency(data.accrual.revenue) }}
                    </td>
                  </tr>

                  <!-- COGS -->
                  <tr>
                    <td colspan="2" class="py-2"></td>
                  </tr>
                  <tr class="bg-error/10">
                    <td colspan="2" class="font-bold text-error">HARGA POKOK PENJUALAN</td>
                  </tr>
                  <tr class="hover">
                    <td class="pl-6">Material/Items (dari PO)</td>
                    <td class="text-right font-mono">
                      {{ formatCurrency(data.accrual.cogs.items) }}
                    </td>
                  </tr>
                  <tr class="hover bg-warning/10">
                    <td class="pl-6">
                      Service/Habis Pakai
                      <span class="ml-2 badge badge-xs badge-warning">
                        {{ data.analysis.serviceItemsCount }}
                      </span>
                    </td>
                    <td class="text-right font-mono text-warning">
                      {{ formatCurrency(data.accrual.cogs.service) }}
                    </td>
                  </tr>
                  <tr class="hover">
                    <td class="pl-6">Project Expenses</td>
                    <td class="text-right font-mono">
                      {{ formatCurrency(data.accrual.cogs.expenses) }}
                    </td>
                  </tr>
                  <tr class="font-bold border-t-2">
                    <td>Total HPP</td>
                    <td class="text-right font-mono text-error">
                      {{ formatCurrency(data.accrual.cogs.total) }}
                    </td>
                  </tr>

                  <!-- Gross Profit -->
                  <tr class="font-bold bg-base-200">
                    <td>LABA KOTOR</td>
                    <td class="text-right font-mono text-info">
                      {{ formatCurrency(data.accrual.grossProfit) }}
                    </td>
                  </tr>

                  <!-- Operational Expense -->
                  <tr>
                    <td colspan="2" class="py-2"></td>
                  </tr>
                  <tr class="bg-error/10">
                    <td colspan="2" class="font-bold text-error">BIAYA OPERASIONAL</td>
                  </tr>
                  <tr>
                    <td class="pl-6">Gaji & Operasional</td>
                    <td class="text-right font-mono">
                      {{ formatCurrency(data.accrual.operationalExpense) }}
                    </td>
                  </tr>

                  <!-- Net Profit -->
                  <tr class="bg-base-200 font-bold text-lg border-t-4">
                    <td>LABA BERSIH</td>
                    <td
                      class="text-right font-mono"
                      :class="getProfitColor(data.accrual.netProfit)"
                    >
                      {{ formatCurrency(data.accrual.netProfit) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Analysis -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title border-b pb-2">Analisis Perbedaan</h2>

          <div class="alert alert-info mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="stroke-current shrink-0 w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <h3 class="font-bold">Perbedaan Normal</h3>
              <div class="text-sm">
                Basis kas mencatat saat uang masuk/keluar, sementara basis akrual mencatat saat
                transaksi terjadi. Perbedaan ini wajar terjadi.
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Komponen</th>
                  <th class="text-right">Nilai</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr class="hover">
                  <td class="font-bold">Total Selisih</td>
                  <td
                    class="text-right font-mono"
                    :class="getProfitColor(data.analysis.difference)"
                  >
                    {{ formatCurrency(data.analysis.difference) }}
                  </td>
                  <td class="text-sm">Kas - Akrual</td>
                </tr>
                <tr class="hover">
                  <td>Selisih Pemasukan</td>
                  <td class="text-right font-mono">
                    {{ formatAmount(data.analysis.incomeDiff, true) }}
                  </td>
                  <td class="text-sm">
                    {{
                      data.analysis.incomeDiff >= 0
                        ? 'Kas > Akrual (sisa upah teknisi/pemasukan non-operasional)'
                        : 'Kas < Akrual'
                    }}
                  </td>
                </tr>
                <tr class="hover">
                  <td>HPP Service/Habis Pakai</td>
                  <td class="text-right font-mono">
                    {{ formatCurrency(data.analysis.serviceCost) }}
                  </td>
                  <td class="text-sm">
                    Dana cadangan untuk {{ data.analysis.serviceItemsCount }} transaksi (klem, ties,
                    kabel, sewa alat, maintenance)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Explanation -->
          <div class="mt-4">
            <h3 class="font-bold mb-2">Penyebab Umum Perbedaan:</h3>
            <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
              <li>
                <strong>Pemasukan Non-Operasional:</strong>
                Sisa upah teknisi atau pemasukan lain yang tidak termasuk pendapatan project
              </li>
              <li>
                <strong>HPP Service/Habis Pakai:</strong>
                Dana cadangan untuk biaya habis pakai (kabel, klem, ties, cable clip) dan
                maintenance alat yang dicatat sebagai HPP tapi belum/tidak keluar kas karena
                menggunakan stok atau bisa juga untuk pembelian asset baru
              </li>
              <li>
                <strong>Timing Difference:</strong>
                Pembelian PO (keluar kas) vs penggunaan barang di project (masuk HPP)
              </li>
              <li>
                <strong>Piutang/Utang:</strong>
                Transaksi yang dicatat tapi belum dibayar atau sebaliknya
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="stats stats-vertical lg:stats-horizontal shadow w-full print:hidden">
        <div class="stat">
          <div class="stat-title">Total Transaksi Kas</div>
          <div class="stat-value text-primary text-2xl">
            {{ data.metadata.cashTransactionsCount }}
          </div>
          <div class="stat-desc">Pemasukan & Pengeluaran</div>
        </div>

        <div class="stat">
          <div class="stat-title">Total Projects</div>
          <div class="stat-value text-secondary text-2xl">{{ data.metadata.projectsCount }}</div>
          <div class="stat-desc">Tahun {{ selectedYear }}</div>
        </div>

        <div class="stat">
          <div class="stat-title">Total Pembayaran</div>
          <div class="stat-value text-accent text-2xl">{{ data.metadata.paymentsCount }}</div>
          <div class="stat-desc">Payment diterima</div>
        </div>
      </div>
    </div>
  </div>
</template>
