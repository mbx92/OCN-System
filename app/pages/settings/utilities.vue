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

    <!-- Reopen Completed Projects Card -->
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Buka Kembali Proyek yang Sudah Selesai
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
              Fungsi: Mengubah status proyek dari COMPLETED kembali ke ONGOING
            </p>
            <p class="mt-2">
              Pilih proyek yang sudah selesai dan ubah statusnya kembali ke ONGOING agar bisa diedit
              lagi.
            </p>
          </div>
        </div>

        <!-- Project Search and Selection -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">Pilih Proyek</span>
          </label>
          <input
            v-model="reopenSearch"
            type="text"
            placeholder="Cari nomor proyek atau nama customer..."
            class="input input-bordered w-full"
            @input="searchCompletedProjects"
          />
        </div>

        <!-- Projects List -->
        <div v-if="completedProjects.length > 0" class="max-h-96 overflow-y-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Nomor Proyek</th>
                <th>Customer</th>
                <th>Nilai</th>
                <th>Selesai</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="project in completedProjects" :key="project.id">
                <td class="font-mono text-xs">{{ project.projectNumber }}</td>
                <td>{{ project.customer?.name || '-' }}</td>
                <td class="text-right font-mono text-xs">
                  {{ formatCurrency(project.totalPrice) }}
                </td>
                <td class="text-sm">
                  {{ project.endDate ? formatDate(new Date(project.endDate)) : '-' }}
                </td>
                <td class="text-center">
                  <button
                    @click="reopenProject(project.id, project.projectNumber)"
                    class="btn btn-sm btn-warning"
                    :disabled="loadingReopen"
                  >
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Buka
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else-if="reopenSearch" class="alert alert-warning">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Tidak ada proyek yang sesuai dengan pencarian</span>
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

    <!-- Analyze Cashflow vs Profit Loss Card -->
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Analisis Cashflow vs Laba Rugi
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
              Fungsi: Membandingkan saldo cashflow dengan laba bersih untuk menemukan
              ketidaksesuaian
            </p>
            <p class="mt-2">
              Tool ini membantu mengidentifikasi perbedaan antara cash-basis (cashflow) dan
              accrual-basis (laba rugi) untuk memastikan akurasi data keuangan.
            </p>
          </div>
        </div>

        <!-- Year Selection -->
        <div class="form-control w-full max-w-xs">
          <label class="label">
            <span class="label-text font-semibold">Tahun</span>
          </label>
          <select v-model="analysisYear" class="select select-bordered">
            <option :value="2024">2024</option>
            <option :value="2025">2025</option>
            <option :value="2026">2026</option>
          </select>
        </div>

        <!-- Action Button -->
        <div class="card-actions justify-end">
          <button
            @click="analyzeCashflowProfit"
            class="btn btn-primary"
            :disabled="loadingAnalysis"
          >
            <span v-if="loadingAnalysis" class="loading loading-spinner loading-sm"></span>
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            {{ loadingAnalysis ? 'Menganalisis...' : 'Analisis Sekarang' }}
          </button>
        </div>

        <!-- Results -->
        <div v-if="analysisResult" class="mt-6 space-y-4">
          <!-- Stats -->
          <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
            <div class="stat">
              <div class="stat-title">Saldo Cashflow</div>
              <div class="stat-value text-primary text-2xl">
                {{ formatCurrency(analysisResult.cashflow.balance) }}
              </div>
              <div class="stat-desc">
                {{ analysisResult.cashflow.totalIncome > 0 ? 'Positif' : 'Negatif' }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Laba Bersih</div>
              <div class="stat-value text-secondary text-2xl">
                {{ formatCurrency(analysisResult.profitLoss.labaBersih) }}
              </div>
              <div class="stat-desc">Basis Akrual</div>
            </div>
            <div class="stat">
              <div class="stat-title">Selisih</div>
              <div
                class="stat-value text-2xl"
                :class="{
                  'text-success': Math.abs(analysisResult.analysis.selisih) < 1000000,
                  'text-warning':
                    Math.abs(analysisResult.analysis.selisih) >= 1000000 &&
                    Math.abs(analysisResult.analysis.selisih) < 5000000,
                  'text-error': Math.abs(analysisResult.analysis.selisih) >= 5000000,
                }"
              >
                {{ formatCurrency(analysisResult.analysis.selisih) }}
              </div>
              <div class="stat-desc">{{ analysisResult.analysis.percentageDiff }}%</div>
            </div>
          </div>

          <!-- Summary Alert -->
          <div
            class="alert"
            :class="{
              'alert-success': Math.abs(analysisResult.analysis.selisih) < 1000000,
              'alert-warning':
                Math.abs(analysisResult.analysis.selisih) >= 1000000 &&
                Math.abs(analysisResult.analysis.selisih) < 5000000,
              'alert-error': Math.abs(analysisResult.analysis.selisih) >= 5000000,
            }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 flex-shrink-0"
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
              <h3 class="font-bold">
                {{
                  Math.abs(analysisResult.analysis.selisih) < 1000000
                    ? 'Balance - Cashflow & Laba Rugi seimbang'
                    : Math.abs(analysisResult.analysis.selisih) < 5000000
                      ? 'Perhatian - Ada selisih yang cukup besar'
                      : 'Warning - Selisih sangat besar, perlu investigasi'
                }}
              </h3>
              <p class="text-sm mt-2">
                Selisih Rp {{ formatCurrency(Math.abs(analysisResult.analysis.selisih)) }} ({{
                  analysisResult.analysis.percentageDiff
                }}% dari laba bersih)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fix Sisa Upah Teknisi Card -->
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Fix Double Counting Sisa Upah Teknisi
        </h2>

        <div class="alert alert-warning text-sm">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p class="font-semibold">Fungsi: Menghapus transaksi sisa upah teknisi yang salah</p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>CHECK:</strong>
                Lihat transaksi sisa upah yang tercatat sebagai income
              </li>
              <li>
                <strong>EXECUTE:</strong>
                Hapus transaksi sisa upah (tidak bisa undo!)
              </li>
            </ul>
            <p class="mt-2 text-xs">
              Sisa upah teknisi adalah selisih antara fee yang dianggarkan vs yang dibayar. Ini
              BUKAN income, jadi tidak boleh dicatat di cashflow.
            </p>
          </div>
        </div>

        <!-- Mode Selection -->
        <div class="form-control w-full max-w-xs">
          <label class="label">
            <span class="label-text font-semibold">Pilih Mode</span>
          </label>
          <select v-model="sisaUpahMode" class="select select-bordered">
            <option value="CHECK">CHECK - Lihat Data Saja</option>
            <option value="EXECUTE">EXECUTE - Hapus Transaksi</option>
          </select>
        </div>

        <!-- Action Button -->
        <div class="card-actions justify-end">
          <button
            @click="fixSisaUpah"
            class="btn"
            :class="{
              'btn-primary': sisaUpahMode === 'CHECK',
              'btn-error': sisaUpahMode === 'EXECUTE',
            }"
            :disabled="loadingSisaUpah"
          >
            <span v-if="loadingSisaUpah" class="loading loading-spinner loading-sm"></span>
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {{ loadingSisaUpah ? 'Memproses...' : `Jalankan ${sisaUpahMode}` }}
          </button>
        </div>

        <!-- Results -->
        <div v-if="sisaUpahResult" class="mt-6 space-y-4">
          <div class="alert" :class="sisaUpahResult.success ? 'alert-success' : 'alert-error'">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                v-if="sisaUpahResult.success"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 class="font-bold">{{ sisaUpahResult.message }}</h3>
              <div class="text-sm mt-2">
                <p>
                  Total:
                  <strong>{{ formatCurrency(sisaUpahResult.totalAmount || 0) }}</strong>
                </p>
                <p v-if="sisaUpahResult.mode === 'EXECUTE' && sisaUpahResult.deleted">
                  Dihapus:
                  <strong>{{ sisaUpahResult.deleted }} transaksi</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- Transactions List -->
          <div
            v-if="sisaUpahResult.transactions && sisaUpahResult.transactions.length > 0"
            class="card bg-base-200"
          >
            <div class="card-body">
              <h3 class="card-title text-lg">
                Detail Transaksi ({{ sisaUpahResult.transactions.length }})
              </h3>
              <div class="overflow-x-auto max-h-96">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Deskripsi</th>
                      <th class="text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="tx in sisaUpahResult.transactions" :key="tx.id">
                      <td class="text-sm">{{ formatDate(new Date(tx.date)) }}</td>
                      <td class="max-w-xs truncate text-sm">{{ tx.description }}</td>
                      <td class="text-right font-mono text-sm">{{ formatCurrency(tx.amount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fix PO Cashflow Card -->
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Fix Cashflow Purchase Order
        </h2>

        <div class="alert alert-warning text-sm">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p class="font-semibold">
              Fungsi: Menambahkan cashflow untuk PO yang sudah received tapi belum tercatat
            </p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>CHECK:</strong>
                Lihat PO yang sudah received tapi belum ada cashflow
              </li>
              <li>
                <strong>EXECUTE:</strong>
                Buat cashflow untuk PO tersebut (tidak bisa undo!)
              </li>
            </ul>
            <p class="mt-2 text-xs">
              Biasanya terjadi pada data historis yang di-import. Cashflow akan dibuat sesuai
              tanggal received PO.
            </p>
          </div>
        </div>

        <!-- Mode Selection -->
        <div class="form-control w-full max-w-xs">
          <label class="label">
            <span class="label-text font-semibold">Pilih Mode</span>
          </label>
          <select v-model="poCashflowMode" class="select select-bordered">
            <option value="CHECK">CHECK - Lihat Data Saja</option>
            <option value="EXECUTE">EXECUTE - Buat Cashflow</option>
          </select>
        </div>

        <!-- Action Button -->
        <div class="card-actions justify-end">
          <button
            @click="fixPOCashflow"
            class="btn"
            :class="{
              'btn-primary': poCashflowMode === 'CHECK',
              'btn-warning': poCashflowMode === 'EXECUTE',
            }"
            :disabled="loadingPOCashflow"
          >
            <span v-if="loadingPOCashflow" class="loading loading-spinner loading-sm"></span>
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {{ loadingPOCashflow ? 'Memproses...' : `Jalankan ${poCashflowMode}` }}
          </button>
        </div>

        <!-- Results -->
        <div v-if="poCashflowResult" class="mt-6 space-y-4">
          <div class="alert" :class="poCashflowResult.success ? 'alert-success' : 'alert-error'">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                v-if="poCashflowResult.success"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 class="font-bold">{{ poCashflowResult.message }}</h3>
              <div class="text-sm mt-2">
                <p v-if="poCashflowResult.missingCount !== undefined">
                  PO belum tercatat:
                  <strong>{{ poCashflowResult.missingCount }}</strong>
                </p>
                <p>
                  Total:
                  <strong>{{ formatCurrency(poCashflowResult.totalAmount || 0) }}</strong>
                </p>
                <p v-if="poCashflowResult.mode === 'EXECUTE' && poCashflowResult.created">
                  Dibuat:
                  <strong>{{ poCashflowResult.created }} cashflow</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- Missing POs List -->
          <div
            v-if="poCashflowResult.missingPOs && poCashflowResult.missingPOs.length > 0"
            class="card bg-base-200"
          >
            <div class="card-body">
              <h3 class="card-title text-lg">
                PO Belum Tercatat ({{ poCashflowResult.missingPOs.length }})
              </h3>
              <div class="overflow-x-auto max-h-96">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Supplier</th>
                      <th>Project</th>
                      <th class="text-right">Amount</th>
                      <th>Received Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="po in poCashflowResult.missingPOs" :key="po.poNumber">
                      <td class="font-mono text-xs">{{ po.poNumber }}</td>
                      <td class="text-sm">{{ po.supplier }}</td>
                      <td class="font-mono text-xs">{{ po.project }}</td>
                      <td class="text-right font-mono text-sm">{{ formatCurrency(po.amount) }}</td>
                      <td class="text-sm">{{ formatDate(new Date(po.receivedDate)) }}</td>
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
const { confirm } = useConfirm()

const selectedMode = ref<'CHECK' | 'SIMPLE' | 'FULL'>('CHECK')
const loading = ref(false)
const result = ref<any>(null)

// Fix Remaining Wage Date states
const selectedWageMode = ref<'CHECK' | 'EXECUTE'>('CHECK')
const loadingWage = ref(false)
const wageResult = ref<any>(null)

// Reopen Project states
const reopenSearch = ref('')
const completedProjects = ref<any[]>([])
const loadingReopen = ref(false)

// Analyze Cashflow vs Profit states
const analysisYear = ref(2025)
const loadingAnalysis = ref(false)
const analysisResult = ref<any>(null)

// Fix Sisa Upah states
const sisaUpahMode = ref<'CHECK' | 'EXECUTE'>('CHECK')
const loadingSisaUpah = ref(false)
const sisaUpahResult = ref<any>(null)

// Fix PO Cashflow states
const poCashflowMode = ref<'CHECK' | 'EXECUTE'>('CHECK')
const loadingPOCashflow = ref(false)
const poCashflowResult = ref<any>(null)

const searchCompletedProjects = async () => {
  if (!reopenSearch.value || reopenSearch.value.length < 2) {
    completedProjects.value = []
    return
  }

  try {
    const response = await $fetch('/api/projects', {
      params: {
        status: 'COMPLETED',
        search: reopenSearch.value,
        limit: 20,
      },
    })
    // API returns data, not projects
    completedProjects.value = response.data || response.projects || []
  } catch (err) {
    console.error('Error searching projects:', err)
    completedProjects.value = []
  }
}

const reopenProject = async (projectId: string, projectNumber: string) => {
  const confirmed = await confirm({
    title: 'Buka Kembali Proyek',
    message: `Apakah Anda yakin ingin membuka kembali proyek ${projectNumber}?\n\nStatus akan diubah dari COMPLETED ke ONGOING.`,
    confirmText: 'Ya, Buka Kembali',
    cancelText: 'Batal',
    type: 'warning',
  })

  if (!confirmed) {
    return
  }

  loadingReopen.value = true

  try {
    await $fetch(`/api/utilities/reopen-project/${projectId}`, {
      method: 'POST',
    })

    showAlert(`Proyek ${projectNumber} berhasil dibuka kembali`, 'success')

    // Remove from list
    completedProjects.value = completedProjects.value.filter(p => p.id !== projectId)
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal membuka kembali proyek', 'error')
    console.error('Error:', err)
  } finally {
    loadingReopen.value = false
  }
}

const fixRemainingWageDate = async () => {
  if (selectedWageMode.value === 'EXECUTE') {
    const confirmed = await confirm({
      title: 'Perbaiki Tanggal Sisa Upah',
      message:
        'Apakah Anda yakin ingin memperbaiki tanggal transaksi sisa upah teknisi?\n\nData akan diupdate ke tanggal selesai proyek. (tidak bisa diundo)',
      confirmText: 'Ya, Perbaiki',
      cancelText: 'Batal',
      type: 'warning',
    })

    if (!confirmed) {
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
    const confirmed = await confirm({
      title: 'Clear Pending PO',
      message:
        selectedMode.value === 'SIMPLE'
          ? 'Apakah Anda yakin ingin clear status PO PENDING?\n\n(tidak bisa diundo)'
          : 'Apakah Anda yakin ingin membuat PO backdate?\n\nIni akan membuat record baru di database. (tidak bisa diundo)',
      confirmText: selectedMode.value === 'SIMPLE' ? 'Ya, Clear Status' : 'Ya, Buat PO',
      cancelText: 'Batal',
      type: 'warning',
    })

    if (!confirmed) {
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

const analyzeCashflowProfit = async () => {
  loadingAnalysis.value = true
  analysisResult.value = null

  try {
    const response = await $fetch('/api/utilities/analyze-cashflow-profit', {
      params: {
        year: analysisYear.value,
      },
    })

    analysisResult.value = response
    showAlert('Analisis berhasil', 'success')
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal melakukan analisis', 'error')
    console.error('Error:', err)
  } finally {
    loadingAnalysis.value = false
  }
}

const fixSisaUpah = async () => {
  if (sisaUpahMode.value === 'EXECUTE') {
    const confirmed = await confirm({
      title: 'Fix Sisa Upah Teknisi',
      message:
        'Apakah Anda yakin ingin menghapus transaksi sisa upah teknisi?\n\nTransaksi ini salah dicatat sebagai income dan akan dihapus permanen. (tidak bisa diundo)',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'warning',
    })

    if (!confirmed) {
      return
    }
  }

  loadingSisaUpah.value = true
  sisaUpahResult.value = null

  try {
    const response = await $fetch('/api/utilities/fix-sisa-upah', {
      method: 'POST',
      body: {
        mode: sisaUpahMode.value,
        year: analysisYear.value,
      },
    })

    sisaUpahResult.value = response

    if (response.success) {
      const action = sisaUpahMode.value === 'CHECK' ? 'Data berhasil diambil' : response.message
      showAlert(action, 'success')
    }
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal memproses', 'error')
    console.error('Error:', err)
  } finally {
    loadingSisaUpah.value = false
  }
}

const fixPOCashflow = async () => {
  if (poCashflowMode.value === 'EXECUTE') {
    const confirmed = await confirm({
      title: 'Fix PO Cashflow',
      message:
        'Apakah Anda yakin ingin membuat cashflow untuk PO yang sudah received?\n\nCashflow akan dibuat sesuai tanggal received PO. (tidak bisa diundo)',
      confirmText: 'Ya, Buat Cashflow',
      cancelText: 'Batal',
      type: 'warning',
    })

    if (!confirmed) {
      return
    }
  }

  loadingPOCashflow.value = true
  poCashflowResult.value = null

  try {
    const response = await $fetch('/api/utilities/fix-po-cashflow', {
      method: 'POST',
      body: {
        mode: poCashflowMode.value,
      },
    })

    poCashflowResult.value = response

    if (response.success) {
      const action = poCashflowMode.value === 'CHECK' ? 'Data berhasil diambil' : response.message
      showAlert(action, 'success')
    }
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal memproses', 'error')
    console.error('Error:', err)
  } finally {
    loadingPOCashflow.value = false
  }
}
</script>
