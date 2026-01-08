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
          <!-- Cancel Project Button -->
          <button
            v-if="['QUOTATION', 'APPROVED', 'ONGOING'].includes(project.status)"
            @click="showCancelModal = true"
            class="btn btn-error btn-outline"
            :disabled="!!processing"
          >
            Batalkan
          </button>
        </div>
      </div>

      <!-- Overview Card -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title mb-4">Overview Proyek</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
            </div>
            <div>
              <p class="text-sm text-base-content/60">Selisih Budget</p>
              <p
                class="font-medium font-mono"
                :class="budgetVariance >= 0 ? 'text-success' : 'text-error'"
              >
                {{ budgetVariance >= 0 ? '+' : '' }}{{ budgetVariance.toFixed(2) }}%
              </p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Tanggal Mulai</p>
              <div class="flex items-center gap-2">
                <p class="font-medium">{{ formatDate(project.startDate) || '-' }}</p>
                <button @click="openEditDates" class="btn btn-ghost btn-xs" title="Edit Tanggal">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Tanggal Selesai</p>
              <p class="font-medium">{{ formatDate(project.endDate) || '-' }}</p>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm text-base-content/60">Dibuat</p>
                <button
                  v-if="isOwner()"
                  @click="openEditTimestamps"
                  class="btn btn-ghost btn-xs"
                  title="Edit tanggal (OWNER only)"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
              <p class="font-medium text-sm">{{ formatDate(project.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Diupdate</p>
              <p class="font-medium text-sm">{{ formatDate(project.updatedAt) }}</p>
            </div>
          </div>

          <div v-if="project.description" class="mt-4 pt-4 border-t border-base-300">
            <p class="text-sm text-base-content/60">Deskripsi</p>
            <p class="mt-1">{{ project.description }}</p>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div role="tablist" class="tabs tabs-boxed bg-base-100 shadow">
        <input
          type="radio"
          name="project_tabs"
          role="tab"
          class="tab"
          aria-label="Item & Material"
          checked
        />
        <div role="tabpanel" class="tab-content p-4 sm:p-6">
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4"
          >
            <h2 class="text-base sm:text-lg font-bold">Item & Material</h2>
            <div class="flex gap-2 w-full sm:w-auto">
              <AppViewToggle v-model="itemsViewMode" class="flex-shrink-0" />
              <button
                v-if="['ONGOING', 'APPROVED', 'QUOTATION'].includes(project.status)"
                @click="showAddItem = true"
                class="btn btn-sm btn-outline flex-1 sm:flex-initial"
              >
                + Tambah Item
              </button>
            </div>
          </div>

          <!-- Grid View -->
          <div
            v-if="itemsViewMode === 'GRID'"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div
              v-for="item in project.items"
              :key="item.id"
              class="card bg-base-200 hover:bg-base-300 transition-all"
            >
              <div class="card-body p-4">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex-1">
                    <h3 class="font-bold text-sm sm:text-base">{{ item.name }}</h3>
                    <span
                      class="badge badge-xs sm:badge-sm mt-1"
                      :class="item.type === 'QUOTATION' ? 'badge-ghost' : 'badge-accent'"
                    >
                      {{ item.type }}
                    </span>
                  </div>
                  <button
                    v-if="
                      item.productId &&
                      ['ONGOING', 'APPROVED'].includes(project.status) &&
                      item.quantity - (item.returnedQty || 0) > 0
                    "
                    @click="openReturnModal(item)"
                    class="btn btn-xs btn-ghost text-warning flex-shrink-0"
                    title="Kembalikan item"
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
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                  </button>
                </div>

                <div class="space-y-2 text-sm">
                  <!-- Quantity -->
                  <div class="flex justify-between items-center">
                    <span class="text-base-content/60">Qty</span>
                    <span class="font-mono font-semibold">{{ item.quantity }} {{ item.unit }}</span>
                  </div>

                  <!-- Return -->
                  <div v-if="item.returnedQty" class="flex justify-between items-center">
                    <span class="text-base-content/60">Return</span>
                    <span class="font-mono text-warning">{{ item.returnedQty }}</span>
                  </div>

                  <!-- HPP -->
                  <div class="flex justify-between items-center">
                    <span class="text-base-content/60">HPP</span>
                    <div class="flex items-center gap-1">
                      <span class="font-mono text-xs">{{ formatCurrency(item.cost || 0) }}</span>
                      <button
                        v-if="
                          user &&
                          ['ADMIN', 'OWNER'].includes(user.role) &&
                          project.status !== 'COMPLETED'
                        "
                        @click="openEditCostModal(item)"
                        class="btn btn-xs btn-ghost text-info"
                        title="Edit HPP"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Total HPP -->
                  <div class="flex justify-between items-center">
                    <span class="text-base-content/60">Total HPP</span>
                    <span class="font-mono text-warning font-semibold">
                      {{ formatCurrency(item.totalCost || 0) }}
                    </span>
                  </div>

                  <!-- Harga Jual -->
                  <div class="flex justify-between items-center">
                    <span class="text-base-content/60">Harga Jual</span>
                    <span class="font-mono text-xs text-success">
                      {{ formatCurrency(item.price) }}
                    </span>
                  </div>

                  <!-- Total Jual -->
                  <div class="flex justify-between items-center pt-2 border-t border-base-300">
                    <span class="text-base-content/60 font-semibold">Total Jual</span>
                    <span class="font-mono text-success font-bold">
                      {{ formatCurrency(item.totalPrice) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="!project.items?.length"
              class="col-span-full text-center py-8 text-base-content/60"
            >
              Belum ada item
            </div>
          </div>

          <!-- List View -->
          <div v-else class="overflow-x-auto">
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
                  <th v-if="user && ['ADMIN', 'OWNER'].includes(user.role)" class="text-center">
                    Edit HPP
                  </th>
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
                  <td v-if="user && ['ADMIN', 'OWNER'].includes(user.role)" class="text-center">
                    <button
                      v-if="project.status !== 'COMPLETED'"
                      @click="openEditCostModal(item)"
                      class="btn btn-xs btn-ghost text-info"
                      title="Edit Harga Pokok"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
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
                          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                        />
                      </svg>
                      <span class="hidden sm:inline">Return</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="!project.items?.length">
                  <td colspan="8" class="text-center py-4 text-base-content/60">Belum ada item</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="4" class="text-right">Total HPP (Modal)</th>
                  <th class="text-right font-mono text-warning">
                    {{ formatCurrency(calculatedItemCost) }}
                  </th>
                  <th class="text-right">Total Harga Jual</th>
                  <th class="text-right font-mono text-success">
                    {{ formatCurrency(calculatedItemPrice) }}
                  </th>
                  <th></th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <input type="radio" name="project_tabs" role="tab" class="tab" aria-label="Expenses" />
        <div role="tabpanel" class="tab-content p-4 sm:p-6">
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4"
          >
            <h2 class="text-base sm:text-lg font-bold">Pengeluaran (Expenses)</h2>
            <div class="flex gap-2 w-full sm:w-auto">
              <AppViewToggle v-model="expensesViewMode" class="flex-shrink-0" />
              <button
                v-if="['ONGOING', 'APPROVED'].includes(project.status)"
                @click="showAddExpense = true"
                class="btn btn-sm btn-outline flex-1 sm:flex-initial"
              >
                + Tambah Pengeluaran
              </button>
            </div>
          </div>

          <!-- Grid View -->
          <div
            v-if="expensesViewMode === 'GRID'"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div
              v-for="expense in project.expenses"
              :key="expense.id"
              class="card bg-base-200 hover:bg-base-300 transition-all"
            >
              <div class="card-body p-4">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex-1">
                    <h3 class="font-bold text-sm sm:text-base">{{ expense.description }}</h3>
                    <span class="badge badge-ghost badge-xs sm:badge-sm mt-1">
                      {{ expense.category }}
                    </span>
                  </div>
                  <button
                    v-if="['ONGOING', 'APPROVED'].includes(project.status)"
                    @click="deleteExpense(expense.id)"
                    class="btn btn-xs btn-ghost text-error flex-shrink-0"
                    :disabled="!!processing"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div class="space-y-2 text-sm">
                  <div class="flex justify-between items-center">
                    <span class="text-base-content/60">Tanggal</span>
                    <span class="font-mono text-xs">{{ formatDate(expense.date) }}</span>
                  </div>

                  <div class="flex justify-between items-center pt-2 border-t border-base-300">
                    <span class="text-base-content/60 font-semibold">Jumlah</span>
                    <span class="font-mono font-bold text-error">
                      {{ formatCurrency(expense.amount) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="!project.expenses?.length"
              class="col-span-full text-center py-8 text-base-content/60"
            >
              Belum ada pengeluaran
            </div>
          </div>

          <!-- List View -->
          <div v-else class="overflow-x-auto">
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
                  <th colspan="3" class="text-right">Total Pengeluaran</th>
                  <th colspan="2" class="text-right font-mono text-lg">
                    {{ formatCurrency(calculatedExpenseCost) }}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <input type="radio" name="project_tabs" role="tab" class="tab" aria-label="Teknisi" />
        <div role="tabpanel" class="tab-content p-4 sm:p-6">
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4"
          >
            <h2 class="text-base sm:text-lg font-bold">Teknisi</h2>
            <div class="flex gap-2 w-full sm:w-auto">
              <AppViewToggle v-model="techniciansViewMode" class="flex-shrink-0" />
              <button
                v-if="['ONGOING', 'APPROVED'].includes(project.status)"
                @click="showAssignTechnician = true"
                class="btn btn-sm btn-outline flex-1 sm:flex-initial"
              >
                + Assign Teknisi
              </button>
            </div>
          </div>

          <!-- Grid View -->
          <div
            v-if="techniciansViewMode === 'GRID'"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div
              v-for="tech in project.technicians"
              :key="tech.id"
              class="card bg-base-200 hover:bg-base-300 transition-all"
            >
              <div class="card-body p-4">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex-1">
                    <h3 class="font-bold text-sm sm:text-base">{{ tech.technician.name }}</h3>
                    <p class="text-xs text-base-content/60 mt-1">{{ tech.technician.phone }}</p>
                    <span
                      class="badge badge-xs sm:badge-sm mt-2"
                      :class="tech.technician.type === 'INTERNAL' ? 'badge-primary' : 'badge-ghost'"
                    >
                      {{ tech.technician.type }}
                    </span>
                  </div>
                  <button
                    v-if="['ONGOING', 'APPROVED'].includes(project.status)"
                    @click="removeTechnician(tech.technician.id)"
                    class="btn btn-xs btn-ghost text-error flex-shrink-0"
                    :disabled="!!processing"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div class="space-y-2 text-sm">
                  <div class="flex justify-between items-center">
                    <span class="text-base-content/60">Fee (Est)</span>
                    <div class="text-right">
                      <div class="font-mono font-semibold">
                        {{
                          tech.feeType === 'PERCENTAGE'
                            ? formatCurrency(calculatedTechnicianWage * (Number(tech.fee) / 100))
                            : formatCurrency(tech.fee)
                        }}
                      </div>
                      <div class="text-xs text-base-content/60">
                        {{ tech.feeType === 'PERCENTAGE' ? `${tech.fee}%` : 'Flat' }}
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-between items-center pt-2 border-t border-base-300">
                    <span class="text-base-content/60">Status Bayar</span>
                    <span
                      class="badge badge-xs sm:badge-sm"
                      :class="tech.isPaid ? 'badge-success' : 'badge-warning'"
                    >
                      {{ tech.isPaid ? 'Sudah Dibayar' : 'Belum' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="!project.technicians?.length"
              class="col-span-full text-center py-8 text-base-content/60"
            >
              Belum ada teknisi
            </div>
          </div>

          <!-- List View -->
          <div v-else class="overflow-x-auto">
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
                      :class="tech.technician.type === 'INTERNAL' ? 'badge-primary' : 'badge-ghost'"
                    >
                      {{ tech.technician.type }}
                    </span>
                  </td>
                  <td class="text-right font-mono">
                    {{
                      tech.feeType === 'PERCENTAGE'
                        ? formatCurrency(calculatedTechnicianWage * (Number(tech.fee) / 100))
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
                <select v-model="newItem.unit" class="select select-bordered w-full" required>
                  <option value="" disabled>Pilih satuan</option>
                  <option v-for="unit in units" :key="unit.id" :value="unit.name">
                    {{ unit.name }}
                  </option>
                </select>
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
                  {{ formatCurrency(calculatedTechnicianWage * (assignment.feeInput / 100)) }}
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
      <!-- Edit Dates Modal -->
      <dialog class="modal" :class="{ 'modal-open': showEditDates }">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Edit Tanggal Proyek</h3>
          <p class="text-sm text-base-content/60 mb-4">
            Gunakan fitur ini untuk input tanggal proyek yang sudah ada sebelum sistem ini.
          </p>
          <form @submit.prevent="saveDates" class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Tanggal Mulai</span></label>
              <input
                v-model="editDates.startDate"
                type="date"
                class="input input-bordered w-full"
              />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Tanggal Selesai</span></label>
              <input v-model="editDates.endDate" type="date" class="input input-bordered w-full" />
            </div>

            <div class="modal-action">
              <button
                type="button"
                class="btn"
                @click="showEditDates = false"
                :disabled="!!processing"
              >
                Batal
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!!processing">
                <span v-if="processing === 'saving_dates'" class="loading loading-spinner"></span>
                Simpan
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="showEditDates = false">close</button>
        </form>
      </dialog>

      <!-- Cancel Project Modal -->
      <dialog class="modal" :class="{ 'modal-open': showCancelModal }">
        <div class="modal-box">
          <h3 class="font-bold text-lg text-error mb-4">Batalkan Proyek</h3>
          <div class="alert alert-warning mb-4">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              Proyek yang dibatalkan tidak dapat dikembalikan. Stock yang sudah direservasi akan
              dilepaskan.
            </span>
          </div>
          <form @submit.prevent="cancelProject" class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Alasan Pembatalan
                  <span class="text-error">*</span>
                </span>
              </label>
              <textarea
                v-model="cancelReason"
                class="textarea textarea-bordered w-full"
                placeholder="Jelaskan alasan pembatalan proyek ini..."
                rows="3"
                required
              ></textarea>
            </div>

            <div class="modal-action">
              <button type="button" class="btn" @click="closeCancelModal" :disabled="!!processing">
                Tidak Jadi
              </button>
              <button
                type="submit"
                class="btn btn-error"
                :disabled="!!processing || !cancelReason.trim()"
              >
                <span v-if="processing === 'cancelling'" class="loading loading-spinner"></span>
                Ya, Batalkan Proyek
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="closeCancelModal">close</button>
        </form>
      </dialog>

      <!-- Edit Timestamps Modal (OWNER only) -->
      <dialog class="modal" :class="{ 'modal-open': showEditTimestamps }">
        <div class="modal-box overflow-visible">
          <h3 class="font-bold text-lg">Edit Tanggal Sistem</h3>
          <p class="text-sm text-base-content/60 mb-4">
            Hanya OWNER yang dapat mengubah tanggal ini
          </p>
          <form @submit.prevent="saveTimestamps">
            <div class="space-y-4">
              <!-- Created At -->
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-medium">Tanggal Dibuat</span>
                </label>
                <input
                  v-model="editTimestamps.createdAt"
                  type="datetime-local"
                  class="input input-bordered w-full"
                  required
                />
              </div>

              <!-- Updated At -->
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-medium">Tanggal Diupdate</span>
                </label>
                <input
                  v-model="editTimestamps.updatedAt"
                  type="datetime-local"
                  class="input input-bordered w-full"
                  required
                />
              </div>
            </div>

            <div class="modal-action">
              <button
                type="button"
                class="btn"
                @click="showEditTimestamps = false"
                :disabled="!!processing"
              >
                Batal
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!!processing">
                <span
                  v-if="processing === 'saving-timestamps'"
                  class="loading loading-spinner"
                ></span>
                Simpan
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="showEditTimestamps = false">close</button>
        </form>
      </dialog>

      <!-- Edit Item Cost Modal -->
      <dialog :class="{ 'modal modal-open': showEditCost }">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Edit Harga Pokok (HPP)</h3>
          <form @submit.prevent="saveItemCost">
            <div v-if="editCostItem" class="space-y-4">
              <!-- Item Info -->
              <div class="bg-base-200 p-3 rounded">
                <p class="font-semibold">{{ editCostItem.name }}</p>
                <div class="text-sm text-base-content/60 mt-1">
                  <p>Quantity: {{ editCostItem.quantity }} {{ editCostItem.unit }}</p>
                  <p>HPP Saat Ini: {{ formatCurrency(editCostItem.cost || 0) }}</p>
                  <p>Total HPP Saat Ini: {{ formatCurrency(editCostItem.totalCost || 0) }}</p>
                </div>
              </div>

              <!-- New Cost Input -->
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-medium">HPP Baru</span>
                </label>
                <input
                  v-model.number="editCostValue"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input input-bordered w-full"
                  placeholder="Masukkan HPP baru"
                  required
                />
              </div>

              <!-- Preview Total -->
              <div v-if="editCostValue > 0" class="bg-info/10 p-3 rounded">
                <p class="text-sm font-semibold text-info">Preview:</p>
                <p class="text-sm">
                  Total HPP Baru: {{ formatCurrency(editCostValue * editCostItem.quantity) }}
                </p>
                <p class="text-sm">
                  Selisih:
                  {{
                    formatCurrency(
                      (editCostValue - (editCostItem.cost || 0)) * editCostItem.quantity
                    )
                  }}
                </p>
              </div>

              <!-- Warning -->
              <div class="alert alert-warning text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="stroke-current shrink-0 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>
                  Perubahan ini akan mempengaruhi perhitungan margin proyek dan tercatat dalam
                  activity log.
                </span>
              </div>
            </div>

            <div class="modal-action">
              <button
                type="button"
                class="btn"
                @click="closeEditCostModal"
                :disabled="!!processing"
              >
                Batal
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!!processing">
                <span v-if="processing === 'saving-cost'" class="loading loading-spinner"></span>
                Simpan
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="closeEditCostModal">close</button>
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
const { isOwner, user } = useAuth()

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
const showEditDates = ref(false)
const showCancelModal = ref(false)
const showEditCost = ref(false)
const editCostItem = ref<any>(null)
const editCostValue = ref(0)
const returnItem = ref<any>(null)
const returnQty = ref(1)
const returnNotes = ref('')
const cancelReason = ref('')

// Edit dates state
const editDates = reactive({
  startDate: '',
  endDate: '',
})

// Edit timestamps state (createdAt/updatedAt - OWNER only)
const showEditTimestamps = ref(false)
const editTimestamps = reactive({
  createdAt: '',
  updatedAt: '',
})

// Open edit timestamps modal (OWNER only)
const openEditTimestamps = () => {
  if (!project.value || !isOwner()) return

  editTimestamps.createdAt = dayjs(project.value.createdAt).format('YYYY-MM-DDTHH:mm')
  editTimestamps.updatedAt = dayjs(project.value.updatedAt).format('YYYY-MM-DDTHH:mm')

  showEditTimestamps.value = true
}

// Save timestamps
const saveTimestamps = async () => {
  processing.value = 'saving-timestamps'
  try {
    const payload: any = {}

    if (editTimestamps.createdAt) {
      payload.createdAt = new Date(editTimestamps.createdAt).toISOString()
    }

    if (editTimestamps.updatedAt) {
      payload.updatedAt = new Date(editTimestamps.updatedAt).toISOString()
    }

    await $fetch(`/api/projects/${route.params.id}/dates`, {
      method: 'PUT',
      body: payload,
    })

    showAlert('Tanggal sistem berhasil diupdate', 'success')
    showEditTimestamps.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal update tanggal sistem', 'error')
  } finally {
    processing.value = null
  }
}

// View modes for tabs - Default to GRID on mobile, LIST on desktop
const itemsViewMode = ref<'LIST' | 'GRID'>(
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'GRID' : 'LIST'
)
const expensesViewMode = ref<'LIST' | 'GRID'>(
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'GRID' : 'LIST'
)
const techniciansViewMode = ref<'LIST' | 'GRID'>(
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'GRID' : 'LIST'
)

const { data: availableTechnicians } = await useFetch('/api/technicians')

// Fetch units from master data
const { data: unitsData } = await useFetch('/api/units')
const units = computed(() => (unitsData.value as any) || [])

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

// Business Cash Percentage (default 30% if not set)
const businessCashPercentage = computed(() => {
  return Number(project.value?.businessCashPercentage || 30)
})

// Business Cash Amount
const calculatedBusinessCash = computed(() => {
  return calculatedMargin.value * (businessCashPercentage.value / 100)
})

// Technician Wage = Margin - Business Cash
const calculatedTechnicianWage = computed(() => {
  return calculatedMargin.value - calculatedBusinessCash.value
})

// Budget vs Actual = (Actual - Budget) / Budget * 100
const budgetVariance = computed(() => {
  const budget = Number(project.value?.budget) || 0
  if (budget === 0) return 0
  const actual = calculatedItemPrice.value
  return ((actual - budget) / budget) * 100
})

const onProductSelect = (product: any) => {
  // Get unit from product master data and match with available units list
  const productUnit = product.unit?.toLowerCase() || ''
  const matchedUnit = units.value.find(
    (u: any) => u.name.toLowerCase() === productUnit || u.symbol?.toLowerCase() === productUnit
  )
  newItem.unit = matchedUnit?.name || product.unit || 'pcs'
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

// Open edit dates modal
const openEditDates = () => {
  editDates.startDate = project.value?.startDate
    ? dayjs(project.value.startDate).format('YYYY-MM-DD')
    : ''
  editDates.endDate = project.value?.endDate
    ? dayjs(project.value.endDate).format('YYYY-MM-DD')
    : ''
  showEditDates.value = true
}

// Save project dates
const saveDates = async () => {
  processing.value = 'saving_dates'
  try {
    await $fetch(`/api/projects/${route.params.id}/dates`, {
      method: 'PUT',
      body: {
        startDate: editDates.startDate || null,
        endDate: editDates.endDate || null,
      },
    })
    showAlert('Tanggal berhasil disimpan', 'success')
    showEditDates.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan tanggal', 'error')
  } finally {
    processing.value = null
  }
}

// Cancel project
const cancelProject = async () => {
  if (!cancelReason.value.trim()) {
    showAlert('Alasan pembatalan wajib diisi', 'error')
    return
  }

  processing.value = 'cancelling'
  try {
    await $fetch(`/api/projects/${route.params.id}/cancel`, {
      method: 'POST',
      body: {
        reason: cancelReason.value,
      },
    })
    showAlert('Proyek berhasil dibatalkan', 'success')
    showCancelModal.value = false
    cancelReason.value = ''
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal membatalkan proyek', 'error')
  } finally {
    processing.value = null
  }
}

// Close cancel modal
const closeCancelModal = () => {
  showCancelModal.value = false
  cancelReason.value = ''
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    QUOTATION: 'Penawaran',
    APPROVED: 'Disetujui',
    ONGOING: 'Dikerjakan',
    COMPLETED: 'Selesai',
    PAID: 'Lunas',
    CANCELLED: 'Dibatalkan',
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
    CANCELLED: 'badge-error',
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
  // Check for missing data
  const warnings: string[] = []
  if (!project.value?.expenses?.length) {
    warnings.push('Belum ada pengeluaran (expenses) yang diinput')
  }
  if (!project.value?.technicians?.length) {
    warnings.push('Belum ada teknisi yang di-assign')
  }

  let message =
    'Apakah Anda yakin ingin menyelesaikan proyek ini? Status akan berubah menjadi Selesai.'

  if (warnings.length > 0) {
    const warningList = warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')
    message = `Data berikut belum lengkap:\n\n${warningList}\n\nApakah Anda tetap ingin menyelesaikan proyek ini?`
  }

  const isConfirmed = await confirm({
    title: warnings.length > 0 ? 'Peringatan Data Belum Lengkap' : 'Selesaikan Proyek',
    message,
    confirmText: warnings.length > 0 ? 'Ya, Tetap Selesaikan' : 'Ya, Selesai',
    type: warnings.length > 0 ? 'warning' : 'success',
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

// Edit cost modal handlers
const openEditCostModal = (item: any) => {
  editCostItem.value = item
  editCostValue.value = Number(item.cost || 0)
  showEditCost.value = true
}

const closeEditCostModal = () => {
  showEditCost.value = false
  editCostItem.value = null
  editCostValue.value = 0
}

const saveItemCost = async () => {
  if (!editCostItem.value || editCostValue.value < 0) return

  const isConfirmed = await confirm({
    title: 'Konfirmasi Perubahan HPP',
    message: `Ubah HPP "${editCostItem.value.name}" dari ${formatCurrency(editCostItem.value.cost || 0)} menjadi ${formatCurrency(editCostValue.value)}?`,
    confirmText: 'Ya, Ubah',
    type: 'warning',
  })

  if (!isConfirmed) return

  processing.value = 'saving-cost'
  try {
    await $fetch(`/api/projects/${route.params.id}/items/${editCostItem.value.id}/cost`, {
      method: 'PATCH',
      body: {
        cost: editCostValue.value,
      },
    })
    showAlert('Harga pokok berhasil diupdate', 'success')
    closeEditCostModal()
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengubah harga pokok', 'error')
  } finally {
    processing.value = null
  }
}
</script>
