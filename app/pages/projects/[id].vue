<template>
  <div class="space-y-6">
    <!-- Back Button -->
    <button @click="navigateTo('/projects')" class="btn btn-ghost btn-sm gap-2">
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
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Kembali
    </button>

    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ error.message || 'Terjadi kesalahan' }}</span>
    </div>

    <template v-else-if="project">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold">{{ project.title }}</h1>
            <span class="badge" :class="getStatusClass(project.status)">
              {{ getStatusLabel(project.status) }}
            </span>
          </div>
          <p class="text-base-content/60 font-mono text-sm">{{ project.projectNumber }}</p>
        </div>
        <div class="flex gap-2">
          <!-- Start Project Button -->
          <button
            v-if="project.status === 'APPROVED'"
            @click="startProject"
            class="btn btn-primary"
            :disabled="!!processing"
          >
            <span v-if="processing === 'starting'" class="loading loading-spinner"></span>
            Mulai Proyek
          </button>
          <button
            v-if="project.status === 'ONGOING'"
            @click="completeProject"
            class="btn btn-success text-white"
            :disabled="!!processing"
          >
            <span v-if="processing === 'completing'" class="loading loading-spinner"></span>
            Selesai Proyek
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Project Details -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Informasi Proyek</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-base-content/60">Pelanggan</p>
                  <p class="font-medium">{{ project.customer?.name }}</p>
                </div>
                <div>
                  <p class="text-sm text-base-content/60">Budget (Dari Quotation)</p>
                  <p class="font-medium font-mono text-primary">
                    {{ formatCurrency(project.budget) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-base-content/60">Total Harga Jual</p>
                  <p class="font-medium font-mono text-success">
                    {{ formatCurrency(calculatedItemPrice) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-base-content/60">Total HPP (Modal)</p>
                  <p class="font-medium font-mono text-warning">
                    {{ formatCurrency(calculatedItemCost) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-base-content/60">Total Expense</p>
                  <p class="font-medium font-mono">{{ formatCurrency(calculatedExpenseCost) }}</p>
                </div>
                <div>
                  <p class="text-sm text-base-content/60">Estimasi Margin</p>
                  <p
                    class="font-medium font-mono"
                    :class="calculatedMargin >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(calculatedMargin) }}
                  </p>
                  <p class="text-xs text-base-content/50">Harga Jual - HPP - Expenses</p>
                </div>
                <div>
                  <p class="text-sm text-base-content/60">Selisih Budget</p>
                  <p
                    class="font-medium font-mono"
                    :class="budgetVariance >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ budgetVariance >= 0 ? '+' : '' }}{{ budgetVariance.toFixed(2) }}%
                  </p>
                  <p class="text-xs text-base-content/50">(Aktual - Budget) / Budget</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p class="text-sm text-base-content/60">Tanggal Mulai</p>
                  <p class="font-medium">{{ formatDate(project.startDate) || '-' }}</p>
                </div>
                <div>
                  <p class="text-sm text-base-content/60">Tanggal Selesai</p>
                  <p class="font-medium">{{ formatDate(project.endDate) || '-' }}</p>
                </div>
              </div>

              <div v-if="project.description" class="mt-4">
                <p class="text-sm text-base-content/60">Deskripsi</p>
                <p class="mt-1">{{ project.description }}</p>
              </div>
            </div>
          </div>

          <!-- Items Management -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="flex justify-between items-center mb-4">
                <h2 class="card-title">Item & Material</h2>
                <button
                  v-if="['ONGOING', 'APPROVED', 'QUOTATION'].includes(project.status)"
                  @click="showAddItem = true"
                  class="btn btn-sm btn-outline"
                >
                  + Tambah Item
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Return</th>
                      <th class="text-right">HPP</th>
                      <th class="text-right">Total HPP</th>
                      <th class="text-right">Harga Jual</th>
                      <th class="text-right">Total Jual</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in project.items" :key="item.id">
                      <td>
                        <p class="font-medium">{{ item.name }}</p>
                        <span
                          class="badge badge-sm"
                          :class="item.type === 'QUOTATION' ? 'badge-ghost' : 'badge-accent'"
                        >
                          {{ item.type }}
                        </span>
                      </td>
                      <td class="text-right">{{ item.quantity }} {{ item.unit }}</td>
                      <td class="text-right">
                        <span v-if="item.returnedQty" class="text-warning">
                          {{ item.returnedQty }}
                        </span>
                        <span v-else class="text-base-content/40">-</span>
                      </td>
                      <td class="text-right font-mono text-xs">
                        {{ formatCurrency(item.cost || 0) }}
                      </td>
                      <td class="text-right font-mono text-warning">
                        {{ formatCurrency(item.totalCost || 0) }}
                      </td>
                      <td class="text-right font-mono text-xs text-success">
                        {{ formatCurrency(item.price) }}
                      </td>
                      <td class="text-right font-mono font-semibold text-success">
                        {{ formatCurrency(item.totalPrice) }}
                      </td>
                      <td>
                        <button
                          v-if="
                            item.productId &&
                            ['ONGOING', 'APPROVED'].includes(project.status) &&
                            item.quantity - (item.returnedQty || 0) > 0
                          "
                          @click="openReturnModal(item)"
                          class="btn btn-xs btn-ghost text-warning"
                          title="Kembalikan item"
                        >
                          ↩ Return
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!project.items?.length">
                      <td colspan="9" class="text-center py-4 text-base-content/60">
                        Belum ada item
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colspan="3" class="text-right">Total HPP (Modal)</th>
                      <th class="text-right font-mono text-warning">
                        {{ formatCurrency(calculatedItemCost) }}
                      </th>
                      <th class="text-right">Total Harga Jual</th>
                      <th class="text-right font-mono text-success">
                        {{ formatCurrency(calculatedItemPrice) }}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- Expenses Management -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="flex justify-between items-center mb-4">
                <h2 class="card-title">Pengeluaran (Expenses)</h2>
                <button
                  v-if="['ONGOING', 'APPROVED'].includes(project.status)"
                  @click="showAddExpense = true"
                  class="btn btn-sm btn-outline"
                >
                  + Tambah Pengeluaran
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Deskripsi</th>
                      <th>Kategori</th>
                      <th class="text-right">Jumlah</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="expense in project.expenses" :key="expense.id">
                      <td>{{ formatDate(expense.date) }}</td>
                      <td>{{ expense.description }}</td>
                      <td>
                        <span class="badge badge-ghost badge-sm">{{ expense.category }}</span>
                      </td>
                      <td class="text-right font-mono font-semibold">
                        {{ formatCurrency(expense.amount) }}
                      </td>
                      <td>
                        <button
                          v-if="['ONGOING', 'APPROVED'].includes(project.status)"
                          @click="deleteExpense(expense.id)"
                          class="btn btn-ghost btn-xs text-error"
                          :disabled="!!processing"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!project.expenses?.length">
                      <td colspan="5" class="text-center py-4 text-base-content/60">
                        Belum ada pengeluaran
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colspan="4" class="text-right">Total Pengeluaran</th>
                      <th class="text-right font-mono text-lg">
                        {{ formatCurrency(calculatedExpenseCost) }}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- Technician Management -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="flex justify-between items-center mb-4">
                <h2 class="card-title">Teknisi</h2>
                <button
                  v-if="['ONGOING', 'APPROVED'].includes(project.status)"
                  @click="showAssignTechnician = true"
                  class="btn btn-sm btn-outline"
                >
                  + Assign Teknisi
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Tipe</th>
                      <th class="text-right">Fee (Est)</th>
                      <th class="text-center">Status Bayar</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="tech in project.technicians" :key="tech.id">
                      <td>
                        <div class="font-bold">{{ tech.technician.name }}</div>
                        <div class="text-xs text-base-content/60">{{ tech.technician.phone }}</div>
                      </td>
                      <td>
                        <span
                          class="badge badge-sm"
                          :class="
                            tech.technician.type === 'INTERNAL' ? 'badge-primary' : 'badge-ghost'
                          "
                        >
                          {{ tech.technician.type }}
                        </span>
                      </td>
                      <td class="text-right font-mono">
                        <!-- For PERCENTAGE: Calculate dynamically from margin -->
                        <!-- For FIXED: Show stored fee value -->
                        {{
                          tech.feeType === 'PERCENTAGE'
                            ? formatCurrency(calculatedMargin * (Number(tech.fee) / 100))
                            : formatCurrency(tech.fee)
                        }}
                        <div class="text-xs text-base-content/60">
                          {{ tech.feeType === 'PERCENTAGE' ? `${tech.fee}%` : 'Flat' }}
                        </div>
                      </td>
                      <td class="text-center">
                        <span
                          class="badge badge-sm"
                          :class="tech.isPaid ? 'badge-success' : 'badge-warning'"
                        >
                          {{ tech.isPaid ? 'Sudah Dibayar' : 'Belum' }}
                        </span>
                      </td>
                      <td>
                        <button
                          v-if="['ONGOING', 'APPROVED'].includes(project.status)"
                          @click="removeTechnician(tech.technician.id)"
                          class="btn btn-ghost btn-xs text-error"
                          :disabled="!!processing"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!project.technicians?.length">
                      <td colspan="5" class="text-center py-4 text-base-content/60">
                        Belum ada teknisi
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Quotations Link -->
          <div v-if="project.quotations?.length" class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Penawaran Terkait</h2>
              <div class="space-y-2">
                <NuxtLink
                  v-for="quotation in project.quotations"
                  :key="quotation.id"
                  :to="`/quotations/${quotation.id}`"
                  class="btn btn-outline btn-sm w-full"
                >
                  {{ quotation.quotationNo }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Stats -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h3 class="font-semibold mb-2">Statistik</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-base-content/60">Total HPP (Modal)</span>
                  <span class="text-sm font-bold text-warning">
                    {{ formatCurrency(calculatedItemCost) }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-base-content/60">Total Expense</span>
                  <span class="text-sm font-bold">{{ formatCurrency(calculatedExpenseCost) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-base-content/60">Estimasi Margin</span>
                  <span
                    class="text-sm font-bold"
                    :class="calculatedMargin >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(calculatedMargin) }}
                  </span>
                </div>
                <div class="divider my-1"></div>
                <div class="flex justify-between">
                  <span class="text-sm text-base-content/60">Dibuat</span>
                  <span class="text-sm">{{ formatDate(project.createdAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-base-content/60">Diupdate</span>
                  <span class="text-sm">{{ formatDate(project.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Item Modal -->
      <dialog class="modal" :class="{ 'modal-open': showAddItem }">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Tambah Item Proyek</h3>
          <form @submit.prevent="addItem" class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Nama Item</span></label>
              <AppProductSelect
                v-model="newItem.name"
                placeholder="Cari produk atau keti nama item manual"
                @select="onProductSelect"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Jumlah</span></label>
                <input
                  v-model.number="newItem.quantity"
                  type="number"
                  min="1"
                  class="input input-bordered w-full"
                  required
                />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Satuan</span></label>
                <input
                  v-model="newItem.unit"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="pcs, m, roll"
                  required
                />
              </div>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Harga Satuan (Estimasi)</span></label>
              <label class="input input-bordered flex items-center gap-2">
                Rp
                <input
                  v-model.number="newItem.price"
                  type="number"
                  min="0"
                  class="grow"
                  placeholder="0"
                  required
                />
              </label>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Modal Satuan (Estimasi)</span></label>
              <label class="input input-bordered flex items-center gap-2">
                Rp
                <input
                  v-model.number="newItem.cost"
                  type="number"
                  min="0"
                  class="grow"
                  placeholder="0"
                />
              </label>
              <label class="label">
                <span class="label-text-alt text-base-content/60">
                  Kosongkan jika 0. Diambil dari master produk jika ada.
                </span>
              </label>
            </div>

            <div class="modal-action">
              <button
                type="button"
                class="btn"
                @click="showAddItem = false"
                :disabled="!!processing"
              >
                Batal
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!!processing">
                <span v-if="processing === 'adding'" class="loading loading-spinner"></span>
                Simpan
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="showAddItem = false">close</button>
        </form>
      </dialog>

      <!-- Return Item Modal -->
      <dialog class="modal" :class="{ 'modal-open': showReturnModal }">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Kembalikan Item</h3>
          <div v-if="returnItem" class="space-y-4">
            <div class="bg-base-200 p-3 rounded-lg">
              <p class="font-medium">{{ returnItem.name }}</p>
              <p class="text-sm text-base-content/60">
                Qty: {{ returnItem.quantity }} | Sudah dikembalikan:
                {{ returnItem.returnedQty || 0 }}
              </p>
              <p class="text-sm text-success">
                Dapat dikembalikan: {{ returnItem.quantity - (returnItem.returnedQty || 0) }}
              </p>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Jumlah Return</span></label>
              <input
                v-model.number="returnQty"
                type="number"
                min="1"
                :max="returnItem.quantity - (returnItem.returnedQty || 0)"
                class="input input-bordered w-full"
                required
              />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Catatan (opsional)</span></label>
              <input
                v-model="returnNotes"
                type="text"
                class="input input-bordered w-full"
                placeholder="Alasan return"
              />
            </div>

            <div class="modal-action">
              <button type="button" class="btn" @click="closeReturnModal" :disabled="!!processing">
                Batal
              </button>
              <button
                @click="submitReturn"
                class="btn btn-warning"
                :disabled="!!processing || returnQty < 1"
              >
                <span v-if="processing === 'returning'" class="loading loading-spinner"></span>
                Kembalikan
              </button>
            </div>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="closeReturnModal">close</button>
        </form>
      </dialog>

      <!-- Add Expense Modal -->
      <dialog class="modal" :class="{ 'modal-open': showAddExpense }">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Tambah Pengeluaran</h3>
          <form @submit.prevent="addExpense" class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Deskripsi</span></label>
              <input
                v-model="newExpense.description"
                type="text"
                class="input input-bordered w-full"
                placeholder="Contoh: Bensin, Makan Siang"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Kategori</span></label>
                <select v-model="newExpense.category" class="select select-bordered w-full">
                  <option value="TRANSPORT">Transport</option>
                  <option value="MEAL">Makan</option>
                  <option value="TOOL">Alat</option>
                  <option value="MATERIAL">Material Darurat</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Tanggal</span></label>
                <input
                  v-model="newExpense.date"
                  type="date"
                  class="input input-bordered w-full"
                  required
                />
              </div>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Jumlah</span></label>
              <label class="input input-bordered flex items-center gap-2">
                Rp
                <input
                  v-model.number="newExpense.amount"
                  type="number"
                  min="0"
                  class="grow"
                  placeholder="0"
                  required
                />
              </label>
            </div>

            <div class="modal-action">
              <button
                type="button"
                class="btn"
                @click="showAddExpense = false"
                :disabled="!!processing"
              >
                Batal
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!!processing">
                <span v-if="processing === 'adding_expense'" class="loading loading-spinner"></span>
                Simpan
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="showAddExpense = false">close</button>
        </form>
      </dialog>

      <!-- Assign Technician Modal -->
      <dialog class="modal" :class="{ 'modal-open': showAssignTechnician }">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Assign Teknisi</h3>
          <form @submit.prevent="assignTechnician" class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Pilih Teknisi</span></label>
              <select
                v-model="assignment.technicianId"
                class="select select-bordered w-full"
                required
                @change="onTechnicianChange"
              >
                <option value="" disabled>-- Pilih Teknisi --</option>
                <option v-for="tech in availableTechnicians" :key="tech.id" :value="tech.id">
                  {{ tech.name }} ({{ tech.type }})
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Tipe Fee</span></label>
                <select v-model="assignment.feeType" class="select select-bordered w-full">
                  <option value="PERCENTAGE">Persentase</option>
                  <option value="FIXED">Flat (Tetap)</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Nominal / %</span></label>
                <label class="input input-bordered flex items-center gap-2">
                  <span v-if="assignment.feeType === 'FIXED'">Rp</span>
                  <input
                    v-model.number="assignment.feeInput"
                    type="number"
                    min="0"
                    class="grow"
                    placeholder="0"
                    required
                  />
                  <span v-if="assignment.feeType === 'PERCENTAGE'">%</span>
                </label>
                <span
                  v-if="assignment.feeType === 'PERCENTAGE'"
                  class="label-text-alt mt-1 text-info"
                >
                  Estimasi:
                  {{ formatCurrency(calculatedMargin * (assignment.feeInput / 100)) }}
                </span>
              </div>
            </div>

            <div class="modal-action">
              <button
                type="button"
                class="btn"
                @click="showAssignTechnician = false"
                :disabled="!!processing"
              >
                Batal
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!!processing">
                <span v-if="processing === 'assigning'" class="loading loading-spinner"></span>
                Simpan
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="showAssignTechnician = false">close</button>
        </form>
      </dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()
const { confirm } = useConfirm()

const {
  data: project,
  pending,
  error,
  refresh,
} = await useFetch(`/api/projects/${route.params.id}`, {
  key: `project-${route.params.id}`,
})

const processing = ref<string | null>(null)
const showAddItem = ref(false)
const showAddExpense = ref(false)
const showAssignTechnician = ref(false)
const showReturnModal = ref(false)
const returnItem = ref<any>(null)
const returnQty = ref(1)
const returnNotes = ref('')

const { data: availableTechnicians } = await useFetch('/api/technicians')

const newItem = reactive({
  name: '',
  quantity: 1,
  unit: '',
  price: 0,
  cost: 0,
  productId: undefined as string | undefined,
})

// ... (other code)
const newExpense = reactive({
  description: '',
  amount: 0,
  category: 'TRANSPORT',
  date: dayjs().format('YYYY-MM-DD'),
})

const assignment = reactive({
  technicianId: '',
  feeType: 'PERCENTAGE',
  feeInput: 0,
})

const calculatedItemPrice = computed(() => {
  if (!project.value?.items) return 0
  return project.value.items.reduce((sum: number, item: any) => {
    // Use actual quantity (qty - returned) for calculation
    const actualQty = item.quantity - (item.returnedQty || 0)
    return sum + actualQty * Number(item.price || 0)
  }, 0)
})

const calculatedItemCost = computed(() => {
  if (!project.value?.items) return 0
  return project.value.items.reduce((sum: number, item: any) => {
    // Use actual quantity (qty - returned) for calculation
    const actualQty = item.quantity - (item.returnedQty || 0)
    return sum + actualQty * Number(item.cost || 0)
  }, 0)
})

const calculatedExpenseCost = computed(() => {
  if (!project.value?.expenses) return 0
  return project.value.expenses.reduce(
    (sum: number, expense: any) => sum + Number(expense.amount),
    0
  )
})

const calculatedTotalCost = computed(() => {
  return calculatedItemCost.value + calculatedExpenseCost.value
})

// Margin = Total Harga Jual - Total HPP - Expenses
const calculatedMargin = computed(() => {
  return calculatedItemPrice.value - calculatedItemCost.value - calculatedExpenseCost.value
})

// Budget vs Actual = (Actual - Budget) / Budget * 100
const budgetVariance = computed(() => {
  const budget = Number(project.value?.budget) || 0
  if (budget === 0) return 0
  const actual = calculatedItemPrice.value
  return ((actual - budget) / budget) * 100
})

const onProductSelect = (product: any) => {
  newItem.unit = product.unit || 'pcs'
  newItem.price = Number(product.sellingPrice) || 0
  newItem.cost = Number(product.purchasePrice) || 0 // Auto-fill cost from product
  newItem.productId = product.id
  newItem.quantity = 1
}

const onTechnicianChange = () => {
  const tech = availableTechnicians.value?.find((t: any) => t.id === assignment.technicianId)
  if (tech) {
    assignment.feeType = tech.feeType
    assignment.feeInput = Number(tech.feePercentage) || 0
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    QUOTATION: 'Penawaran',
    APPROVED: 'Disetujui',
    ONGOING: 'Dikerjakan',
    COMPLETED: 'Selesai',
    PAID: 'Lunas',
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    QUOTATION: 'badge-info',
    APPROVED: 'badge-success',
    ONGOING: 'badge-warning',
    COMPLETED: 'badge-primary',
    PAID: 'badge-accent',
  }
  return classes[status] || 'badge-ghost'
}

const startProject = async () => {
  const isConfirmed = await confirm({
    title: 'Mulai Proyek',
    message: 'Apakah Anda yakin ingin memulai proyek ini? Status akan berubah menjadi Dikerjakan.',
    confirmText: 'Ya, Mulai',
    type: 'success',
  })

  if (!isConfirmed) return

  processing.value = 'starting'
  try {
    await $fetch(`/api/projects/${route.params.id}/start`, {
      method: 'POST',
    })
    showAlert('Proyek berhasil dimulai', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal memulai proyek', 'error')
  } finally {
    processing.value = null
  }
}

const completeProject = async () => {
  const isConfirmed = await confirm({
    title: 'Selesaikan Proyek',
    message:
      'Apakah Anda yakin ingin menyelesaikan proyek ini? Status akan berubah menjadi Selesai.',
    confirmText: 'Ya, Selesai',
    type: 'success',
  })

  if (!isConfirmed) return

  processing.value = 'completing'
  try {
    await $fetch(`/api/projects/${route.params.id}/complete`, {
      method: 'POST',
    })
    showAlert('Proyek berhasil diselesaikan', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyelesaikan proyek', 'error')
  } finally {
    processing.value = null
  }
}

const addItem = async () => {
  processing.value = 'adding'
  try {
    await $fetch(`/api/projects/${route.params.id}/items`, {
      method: 'POST',
      body: {
        ...newItem,
        type: 'ADDITIONAL',
        productId: newItem.productId,
      },
    })

    showAlert('Item berhasil ditambahkan', 'success')
    showAddItem.value = false
    // Reset form
    newItem.name = ''
    newItem.quantity = 1
    newItem.quantity = 1
    newItem.unit = ''
    newItem.price = 0
    newItem.cost = 0
    newItem.productId = undefined

    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menambahkan item', 'error')
  } finally {
    processing.value = null
  }
}

const addExpense = async () => {
  processing.value = 'adding_expense'
  try {
    await $fetch(`/api/projects/${route.params.id}/expenses`, {
      method: 'POST',
      body: {
        ...newExpense,
        date: new Date(newExpense.date).toISOString(),
      },
    })

    showAlert('Pengeluaran berhasil ditambahkan', 'success')
    showAddExpense.value = false
    // Reset form
    newExpense.description = ''
    newExpense.amount = 0
    newExpense.category = 'TRANSPORT'
    newExpense.date = dayjs().format('YYYY-MM-DD')

    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menambahkan pengeluaran', 'error')
  } finally {
    processing.value = null
  }
}

const assignTechnician = async () => {
  processing.value = 'assigning'
  try {
    // For PERCENTAGE: Save the percentage value directly (will be calculated dynamically on display)
    // For FIXED: Save the actual fee amount
    const finalFee = assignment.feeInput

    await $fetch(`/api/projects/${route.params.id}/technicians`, {
      method: 'POST',
      body: {
        technicianId: assignment.technicianId,
        fee: finalFee,
        feeType: assignment.feeType,
      },
    })

    showAlert('Teknisi berhasil ditugaskan', 'success')
    showAssignTechnician.value = false
    // Reset
    assignment.technicianId = ''
    assignment.feeInput = 0

    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menugaskan teknisi', 'error')
  } finally {
    processing.value = null
  }
}

const removeTechnician = async (technicianId: string) => {
  const isConfirmed = await confirm({
    title: 'Hapus Teknisi',
    message: 'Apakah Anda yakin ingin menghapus teknisi ini dari proyek?',
    confirmText: 'Ya, Hapus',
    type: 'danger',
  })

  if (!isConfirmed) return

  processing.value = 'removing_tech'
  try {
    await $fetch('/api/projects/remove-technician', {
      method: 'POST',
      body: {
        projectId: route.params.id,
        technicianId,
      },
    })
    showAlert('Teknisi berhasil dihapus dari proyek', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menghapus teknisi', 'error')
  } finally {
    processing.value = null
  }
}

const deleteExpense = async (expenseId: string) => {
  const isConfirmed = await confirm({
    title: 'Hapus Pengeluaran',
    message: 'Apakah Anda yakin ingin menghapus pengeluaran ini?',
    confirmText: 'Ya, Hapus',
    type: 'danger',
  })

  if (!isConfirmed) return

  processing.value = 'deleting_expense'
  try {
    await $fetch('/api/expenses/delete', {
      method: 'POST',
      body: { expenseId },
    })
    showAlert('Pengeluaran berhasil dihapus', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menghapus pengeluaran', 'error')
  } finally {
    processing.value = null
  }
}

// Return modal handlers
const openReturnModal = (item: any) => {
  returnItem.value = item
  returnQty.value = 1
  returnNotes.value = ''
  showReturnModal.value = true
}

const closeReturnModal = () => {
  showReturnModal.value = false
  returnItem.value = null
  returnQty.value = 1
  returnNotes.value = ''
}

const submitReturn = async () => {
  if (!returnItem.value || returnQty.value < 1) return

  processing.value = 'returning'
  try {
    await $fetch(`/api/projects/${route.params.id}/items/${returnItem.value.id}/return`, {
      method: 'POST',
      body: {
        returnQty: returnQty.value,
        notes: returnNotes.value,
      },
    })
    showAlert('Item berhasil dikembalikan', 'success')
    closeReturnModal()
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengembalikan item', 'error')
  } finally {
    processing.value = null
  }
}
</script>
