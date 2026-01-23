<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Utilitas Sistem</h1>
      <p class="text-base-content/60">Tools untuk maintenance dan perbaikan data</p>
    </div>

    <!-- Fix Remaining Wage Date Card -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Perbaiki Tanggal Sisa Upah Teknisi
        </h2>

        <div class="alert alert-info text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p class="font-semibold">
              Fungsi: Memperbaiki tanggal transaksi sisa upah teknisi ke periode proyek
            </p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>CHECK:</strong>
                Lihat transaksi yang perlu diperbaiki
              </li>
              <li>
                <strong>EXECUTE:</strong>
                Update tanggal transaksi ke tanggal selesai proyek (endDate)
              </li>
            </ul>
          </div>
        </div>

        <!-- Mode Selection -->
        <div class="form-control w-full max-w-xs">
          <label class="label">
            <span class="label-text font-semibold">Pilih Mode</span>
          </label>
          <select v-model="selectedWageMode" class="select select-bordered">
            <option value="CHECK">CHECK - Lihat Data Saja</option>
            <option value="EXECUTE">EXECUTE - Perbaiki Tanggal</option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions justify-end">
          <button
            @click="fixRemainingWageDate"
            class="btn"
            :class="{
              'btn-primary': selectedWageMode === 'CHECK',
              'btn-warning': selectedWageMode === 'EXECUTE',
            }"
            :disabled="loadingWage"
          >
            <span v-if="loadingWage" class="loading loading-spinner loading-sm"></span>
            <svg
              v-else
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {{ loadingWage ? 'Memproses...' : `Jalankan ${selectedWageMode}` }}
          </button>
        </div>

        <!-- Results -->
        <div v-if="wageResult" class="mt-6 space-y-4">
          <!-- Summary -->
          <div class="alert" :class="wageResult.success ? 'alert-success' : 'alert-error'">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                v-if="wageResult.success"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 class="font-bold">{{ wageResult.message }}</h3>
              <div class="text-sm mt-2">
                <p>
                  Mode:
                  <strong>{{ wageResult.mode }}</strong>
                </p>
                <p>
                  Total transaksi:
                  <strong>{{ wageResult.totalTransactions }}</strong>
                </p>
                <p v-if="wageResult.mode === 'CHECK'">
                  Perlu update:
                  <strong class="text-warning">{{ wageResult.needsUpdateCount }}</strong>
                </p>
                <p v-if="wageResult.mode === 'CHECK'">
                  Sudah benar:
                  <strong class="text-success">{{ wageResult.alreadyCorrectCount }}</strong>
                </p>
                <p v-if="wageResult.updated !== undefined">
                  Berhasil diupdate:
                  <strong class="text-success">{{ wageResult.updated }}</strong>
                </p>
                <p v-if="wageResult.skipped !== undefined">
                  Diskip:
                  <strong>{{ wageResult.skipped }}</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- Updated Transactions List (EXECUTE mode) -->
          <div
            v-if="wageResult.updatedTransactions && wageResult.updatedTransactions.length > 0"
            class="card bg-base-200"
          >
            <div class="card-body">
              <h3 class="card-title text-lg">Transaksi yang Diupdate:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li
                  v-for="(tx, idx) in wageResult.updatedTransactions"
                  :key="idx"
                  class="font-mono text-sm"
                >
                  {{ tx }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Transactions Table (CHECK mode) -->
          <div
            v-if="wageResult.transactions && wageResult.transactions.length > 0"
            class="card bg-base-200"
          >
            <div class="card-body">
              <h3 class="card-title text-lg">
                Detail Transaksi ({{ wageResult.transactions.length }})
              </h3>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Deskripsi</th>
                      <th class="text-right">Jumlah</th>
                      <th>Tanggal Saat Ini</th>
                      <th>Tanggal Project</th>
                      <th class="text-center">Perlu Update?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="tx in wageResult.transactions"
                      :key="tx.id"
                      :class="{ 'bg-warning/10': tx.needsUpdate }"
                    >
                      <td class="font-mono text-xs">{{ tx.projectNumber }}</td>
                      <td>
                        <span class="badge badge-sm">{{ tx.projectStatus }}</span>
                      </td>
                      <td class="max-w-xs truncate">{{ tx.description }}</td>
                      <td class="text-right font-mono text-xs">
                        {{ formatCurrency(tx.amount) }}
                      </td>
                      <td class="text-sm">{{ formatDate(new Date(tx.currentDate)) }}</td>
                      <td class="text-sm">
                        {{ tx.projectDate ? formatDate(new Date(tx.projectDate)) : 'Tidak ada' }}
                      </td>
                      <td class="text-center">
                        <span v-if="tx.needsUpdate" class="text-warning font-bold">⚠️ YA</span>
                        <span v-else class="text-success">✅ Tidak</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear Pending PO Card -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
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
          Clear Pending PO dari Proyek Selesai
        </h2>

        <div class="alert alert-info text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p class="font-semibold">
              Fungsi: Membersihkan status PO PENDING pada proyek yang sudah selesai
            </p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>CHECK:</strong>
                Hanya melihat data, tidak ada perubahan
              </li>
              <li>
                <strong>SIMPLE:</strong>
                Clear status saja (laporan laba-rugi tetap balance)
              </li>
              <li>
                <strong>FULL:</strong>
                Buat PO backdate (laporan pembelian juga lengkap)
              </li>
            </ul>
          </div>
        </div>

        <!-- Mode Selection -->
        <div class="form-control w-full max-w-xs">
          <label class="label">
            <span class="label-text font-semibold">Pilih Mode</span>
          </label>
          <select v-model="selectedMode" class="select select-bordered">
            <option value="CHECK">CHECK - Lihat Data Saja</option>
            <option value="SIMPLE">SIMPLE - Clear Status</option>
            <option value="FULL">FULL - Buat PO Backdate</option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions justify-end">
          <button
            @click="clearPendingPO"
            class="btn btn-primary"
            :disabled="loading"
            :class="{
              'btn-warning': selectedMode === 'SIMPLE',
              'btn-error': selectedMode === 'FULL',
            }"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <svg
              v-else
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {{ loading ? 'Memproses...' : `Jalankan ${selectedMode}` }}
          </button>
        </div>

        <!-- Results -->
        <div v-if="result" class="mt-6 space-y-4">
          <!-- Summary -->
          <div class="alert" :class="result.success ? 'alert-success' : 'alert-error'">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                v-if="result.success"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 class="font-bold">{{ result.message }}</h3>
              <div class="text-sm mt-2">
                <p>
                  Mode:
                  <strong>{{ result.mode }}</strong>
                </p>
                <p>
                  Items ditemukan:
                  <strong>{{ result.itemsFound }}</strong>
                </p>
                <p v-if="result.itemsProcessed !== undefined">
                  Items diproses:
                  <strong>{{ result.itemsProcessed }}</strong>
                </p>
                <p v-if="result.poCreated">
                  PO dibuat:
                  <strong>{{ result.poCreated }}</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- CHECK mode extra info -->
          <div
            v-if="result.mode === 'CHECK' && result.itemsFound > 0"
            class="stats stats-vertical lg:stats-horizontal shadow w-full"
          >
            <div class="stat">
              <div class="stat-title">Total Items</div>
              <div class="stat-value text-primary">{{ result.itemsFound }}</div>
              <div class="stat-desc">Pending PO items</div>
            </div>
            <div class="stat">
              <div class="stat-title">Missing Cost</div>
              <div class="stat-value text-warning">{{ result.itemsWithMissingCost }}</div>
              <div class="stat-desc">Items tanpa harga</div>
            </div>
            <div class="stat">
              <div class="stat-title">With Product</div>
              <div class="stat-value text-success">{{ result.itemsWithProduct }}</div>
              <div class="stat-desc">Items punya produk</div>
            </div>
          </div>

          <!-- Created POs List (FULL mode) -->
          <div v-if="result.createdPOs && result.createdPOs.length > 0" class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title text-lg">PO yang Dibuat:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="po in result.createdPOs" :key="po" class="font-mono text-sm">
                  {{ po }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Items Table -->
          <div v-if="result.items && result.items.length > 0" class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title text-lg">Detail Items ({{ result.items.length }})</h3>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Item</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Cost</th>
                      <th class="text-right">Total Cost</th>
                      <th class="text-center">Produk</th>
                      <th class="text-center">Cost OK?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in result.items" :key="idx">
                      <td class="font-mono text-xs">{{ item.projectNumber }}</td>
                      <td>
                        <span class="badge badge-sm">{{ item.projectStatus }}</span>
                      </td>
                      <td class="max-w-xs truncate">{{ item.itemName }}</td>
                      <td class="text-right">{{ item.quantity }}</td>
                      <td class="text-right font-mono text-xs">
                        {{ formatCurrency(item.cost) }}
                      </td>
                      <td class="text-right font-mono text-xs">
                        {{ formatCurrency(item.totalCost) }}
                      </td>
                      <td class="text-center">
                        <span v-if="item.hasProduct" class="text-success">✅</span>
                        <span v-else class="text-error">❌</span>
                      </td>
                      <td class="text-center">
                        <span v-if="item.costOk" class="text-success">✅</span>
                        <span v-else class="text-warning">⚠️</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { showAlert } = useAlert()
const { formatCurrency, formatDate } = useFormatter()

const selectedMode = ref<'CHECK' | 'SIMPLE' | 'FULL'>('CHECK')
const loading = ref(false)
const result = ref<any>(null)

// Fix Remaining Wage Date states
const selectedWageMode = ref<'CHECK' | 'EXECUTE'>('CHECK')
const loadingWage = ref(false)
const wageResult = ref<any>(null)

const fixRemainingWageDate = async () => {
  if (selectedWageMode.value === 'EXECUTE') {
    const confirmMessage =
      'Apakah Anda yakin ingin memperbaiki tanggal transaksi sisa upah teknisi? Data akan diupdate ke tanggal selesai proyek. (tidak bisa diundo)'

    if (!confirm(confirmMessage)) {
      return
    }
  }

  loadingWage.value = true
  wageResult.value = null

  try {
    const response = await $fetch('/api/utilities/fix-remaining-wage-date', {
      method: 'POST',
      body: {
        mode: selectedWageMode.value,
      },
    })

    wageResult.value = response

    if (response.success) {
      const action =
        selectedWageMode.value === 'CHECK'
          ? 'Data berhasil diambil'
          : 'Tanggal transaksi berhasil diperbaiki'
      showAlert(action, 'success')
    }
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal memproses', 'error')
    console.error('Error:', err)
  } finally {
    loadingWage.value = false
  }
}

const clearPendingPO = async () => {
  if (selectedMode.value !== 'CHECK') {
    const confirmMessage =
      selectedMode.value === 'SIMPLE'
        ? 'Apakah Anda yakin ingin clear status PO PENDING? (tidak bisa diundo)'
        : 'Apakah Anda yakin ingin membuat PO backdate? Ini akan membuat record baru di database. (tidak bisa diundo)'

    if (!confirm(confirmMessage)) {
      return
    }
  }

  loading.value = true
  result.value = null

  try {
    const response = await $fetch('/api/utilities/clear-pending-po', {
      method: 'POST',
      body: {
        mode: selectedMode.value,
      },
    })

    result.value = response

    if (response.success) {
      const action =
        selectedMode.value === 'CHECK'
          ? 'Data berhasil diambil'
          : selectedMode.value === 'SIMPLE'
            ? 'Status berhasil di-clear'
            : 'PO backdate berhasil dibuat'
      showAlert(action, 'success')
    }
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal memproses', 'error')
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}
</script>
