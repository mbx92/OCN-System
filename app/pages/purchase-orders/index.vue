<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Purchase Orders (PO)</h1>
        <p class="text-base-content/60">Kelola pembelian barang ke supplier</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button @click="openCreateModal" class="btn btn-primary gap-2 btn-sm sm:btn-md">
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
          PO dari Pending
        </button>
        <button @click="openDirectModal" class="btn btn-outline btn-primary gap-2 btn-sm sm:btn-md">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          PO Manual
        </button>
      </div>
    </div>

    <!-- Pending PO Items List -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-col gap-4 mb-4">
          <h2 class="card-title">Item yang Perlu di-PO</h2>

          <!-- Search & View Toggle -->
          <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-none">
              <AppViewToggle v-model="pendingViewMode" />
            </div>
            <div class="flex-1">
              <div class="form-control">
                <input
                  v-model="pendingSearch"
                  type="text"
                  placeholder="Cari item, produk, atau proyek..."
                  class="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="pendingItemsQuery.pending.value" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div
          v-else-if="!filteredPendingItems?.length"
          class="text-center py-8 text-base-content/60"
        >
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>
            {{
              pendingSearch
                ? 'Tidak ditemukan item yang cocok'
                : 'Tidak ada item yang perlu di-PO saat ini'
            }}
          </p>
        </div>

        <div v-else>
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
              {{ filteredPendingItems.length }} item terdeteksi memiliki stok kurang saat approval
              proyek
            </span>
          </div>

          <!-- Grid View -->
          <div
            v-if="pendingViewMode === 'GRID'"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div
              v-for="item in filteredPendingItems"
              :key="item.id"
              class="card bg-base-100 shadow hover:shadow-md transition-shadow"
            >
              <div class="card-body p-4">
                <div class="mb-3">
                  <h3 class="font-bold">{{ item.name }}</h3>
                  <p v-if="item.product" class="text-xs text-base-content/60 font-mono">
                    {{ item.product.sku }}
                  </p>
                </div>

                <div class="space-y-2 text-sm">
                  <!-- Project -->
                  <div class="flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"
                      />
                    </svg>
                    <div class="flex-1">
                      <div class="font-medium">{{ item.project?.projectNumber }}</div>
                      <div class="text-xs text-base-content/60">{{ item.project?.title }}</div>
                    </div>
                  </div>

                  <!-- Quantity Needed -->
                  <div class="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
                      />
                    </svg>
                    <span class="flex-1">Qty Butuh</span>
                    <span class="font-mono font-bold">{{ item.quantity }}</span>
                  </div>

                  <!-- Current Stock -->
                  <div class="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <span class="flex-1">Stok Saat Ini</span>
                    <span
                      class="font-mono"
                      :class="(item.product?.stock?.available || 0) < 0 ? 'text-error' : ''"
                    >
                      {{ item.product?.stock?.available || 0 }}
                    </span>
                  </div>

                  <!-- Shortage -->
                  <div class="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span class="flex-1">Perlu PO</span>
                    <span class="font-mono font-bold text-warning">
                      {{ item.quantity }}
                    </span>
                  </div>

                  <!-- Supplier -->
                  <div class="flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2zm9-13.5V9"
                      />
                    </svg>
                    <span class="flex-1">
                      {{ item.product?.suppliers?.[0]?.supplier?.name || '-' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- List View -->
          <div v-else class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Item / Produk</th>
                  <th>Project</th>
                  <th>Qty Butuh</th>
                  <th>Stok Saat Ini</th>
                  <th>Perlu PO</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredPendingItems" :key="item.id">
                  <td>
                    <div class="font-bold">{{ item.name }}</div>
                    <span v-if="item.product" class="text-xs text-base-content/60">
                      {{ item.product.sku }}
                    </span>
                  </td>
                  <td>
                    <div class="font-medium">{{ item.project?.projectNumber }}</div>
                    <div class="text-xs text-base-content/60">{{ item.project?.title }}</div>
                  </td>
                  <td class="text-right font-mono">{{ item.quantity }}</td>
                  <td class="text-right font-mono">
                    <span :class="(item.product?.stock?.available || 0) < 0 ? 'text-error' : ''">
                      {{ item.product?.stock?.available || 0 }}
                    </span>
                  </td>
                  <td class="text-right font-mono text-warning font-bold">
                    {{ item.quantity }}
                  </td>
                  <td>
                    <span v-if="item.product?.suppliers?.[0]?.supplier?.name">
                      {{ item.product.suppliers[0].supplier.name }}
                    </span>
                    <span v-else class="text-base-content/40">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- PO List -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-col gap-4 mb-4">
          <h2 class="card-title">Daftar Purchase Order</h2>

          <!-- Search & View Toggle -->
          <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-none">
              <AppViewToggle v-model="viewMode" />
            </div>
            <div class="flex-1">
              <div class="form-control">
                <input
                  v-model="search"
                  type="text"
                  placeholder="Cari No. PO, Supplier, atau Proyek..."
                  class="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="poListQuery.pending.value" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!filteredPOList?.length" class="text-center py-8 text-base-content/60">
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
          <p>{{ search ? 'Tidak ditemukan PO yang cocok' : 'Belum ada Purchase Order' }}</p>
        </div>

        <!-- Grid View -->
        <div
          v-else-if="viewMode === 'GRID'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="po in filteredPOList"
            :key="po.id"
            class="card bg-base-100 shadow hover:shadow-md cursor-pointer transition-shadow"
            @click="navigateTo(`/purchase-orders/${po.id}`)"
          >
            <div class="card-body p-4">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h3 class="font-bold font-mono text-lg">{{ po.poNumber }}</h3>
                  <p class="text-xs text-base-content/60">{{ formatDate(po.createdAt) }}</p>
                </div>
                <span class="badge" :class="getPoStatusClass(po.status)">
                  {{ getPoStatusLabel(po.status) }}
                </span>
              </div>

              <div class="space-y-2 text-sm">
                <!-- Supplier -->
                <div class="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2zm9-13.5V9"
                    />
                  </svg>
                  <span class="flex-1">{{ po.supplier?.name || '-' }}</span>
                </div>

                <!-- Project -->
                <div class="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"
                    />
                  </svg>
                  <span class="flex-1">
                    {{ po.project ? po.project.projectNumber : '-' }}
                  </span>
                </div>

                <!-- Items Count -->
                <div class="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4"
                    />
                  </svg>
                  <span class="flex-1">{{ po.items?.length || 0 }} item</span>
                </div>

                <!-- Total -->
                <div class="flex items-start gap-2 font-bold">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                    />
                  </svg>
                  <span class="flex-1 font-mono">{{ formatCurrency(po.totalAmount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-else class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-base-200">
              <tr>
                <th>No. PO</th>
                <th>Supplier</th>
                <th>Proyek</th>
                <th class="text-center">Items</th>
                <th class="text-right">Total</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="po in filteredPOList"
                :key="po.id"
                class="hover cursor-pointer"
                @click="navigateTo(`/purchase-orders/${po.id}`)"
              >
                <td class="font-mono font-bold">{{ po.poNumber }}</td>
                <td>{{ po.supplier?.name || '-' }}</td>
                <td>
                  <NuxtLink
                    v-if="po.project"
                    :to="`/projects/${po.project.id}`"
                    class="link link-primary text-sm"
                  >
                    {{ po.project.projectNumber }}
                  </NuxtLink>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td class="text-center">
                  <span class="badge badge-ghost">{{ po.items?.length || 0 }}</span>
                </td>
                <td class="text-right font-mono">{{ formatCurrency(po.totalAmount) }}</td>
                <td>
                  <span class="badge" :class="getPoStatusClass(po.status)">
                    {{ getPoStatusLabel(po.status) }}
                  </span>
                </td>
                <td class="text-sm text-base-content/60">{{ formatDate(po.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create PO Modal (Pending Items) -->
    <dialog class="modal" :class="{ 'modal-open': showCreateModal }">
      <div class="modal-box w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4 sm:mb-6">
          <h3 class="font-bold text-lg sm:text-xl">Buat Purchase Order Baru</h3>
          <button @click="showCreateModal = false" class="btn btn-sm btn-circle btn-ghost">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div v-if="pendingItemsQuery.pending.value" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!pendingItems?.length" class="alert alert-info">
          <span>Tidak ada item yang membutuhkan PO saat ini.</span>
        </div>

        <div v-else class="space-y-6">
          <div class="alert alert-warning text-sm">
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
            <span>Item berikut dideteksi memiliki stok kurang saat aproval proyek.</span>
          </div>

          <!-- Supplier Selection & Notes -->
          <div
            class="bg-base-200 p-4 sm:p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
          >
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Pilih Supplier</span>
              </label>
              <select
                v-model="selectedSupplierId"
                class="select select-bordered w-full bg-base-100"
              >
                <option value="">-- Otomatis dari item --</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <label class="label" v-if="defaultSupplierId && !selectedSupplierId">
                <span class="label-text-alt text-info">
                  Default: {{ selectedItems[0]?.product?.suppliers?.[0]?.supplier?.name || '-' }}
                </span>
              </label>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Catatan (opsional)</span>
              </label>
              <input
                v-model="poNotes"
                type="text"
                class="input input-bordered w-full bg-base-100"
                placeholder="Catatan untuk PO"
              />
            </div>
          </div>

          <!-- Mobile: Grid View, Desktop: Table -->
          <!-- Grid View for Mobile -->
          <div class="md:hidden space-y-3">
            <div
              v-for="item in pendingItems"
              :key="item.id"
              class="card bg-base-200 hover:bg-base-300 transition-all"
            >
              <div class="card-body p-4">
                <div class="flex items-start gap-3 mb-3">
                  <label class="cursor-pointer">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      v-model="selectedItems"
                      :value="item"
                    />
                  </label>
                  <div class="flex-1">
                    <h3 class="font-bold text-sm">{{ item.name }}</h3>
                    <p class="text-xs text-base-content/60 font-mono mt-1">
                      {{ item.product?.sku }}
                    </p>
                  </div>
                </div>

                <div class="space-y-2 text-sm">
                  <div class="flex justify-between items-center">
                    <span class="text-base-content/60">Project</span>
                    <div class="text-right">
                      <div class="font-medium text-xs">{{ item.project?.title }}</div>
                      <div class="text-xs text-base-content/60">
                        {{ item.project?.projectNumber }}
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-between items-center">
                    <span class="text-base-content/60">Qty Butuh</span>
                    <span class="font-bold text-error">
                      {{ item.quantity }}
                      <span class="text-xs ml-1">{{ item.unit }}</span>
                    </span>
                  </div>

                  <div class="flex justify-between items-center">
                    <span class="text-base-content/60">Stok</span>
                    <div class="text-right text-xs">
                      <div>Total: {{ item.product?.stock?.quantity || 0 }}</div>
                      <div class="text-base-content/60">
                        Reserved: {{ item.product?.stock?.reserved || 0 }}
                      </div>
                      <div
                        class="font-bold"
                        :class="
                          (item.product?.stock?.available || 0) < 0 ? 'text-error' : 'text-success'
                        "
                      >
                        Avail: {{ item.product?.stock?.available || 0 }}
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-between items-center pt-2 border-t border-base-300">
                    <span class="text-base-content/60">Supplier</span>
                    <span v-if="item.product?.suppliers?.[0]" class="badge badge-outline badge-xs">
                      {{ item.product.suppliers[0].supplier.name }}
                    </span>
                    <span v-else class="text-xs text-error italic">No Supplier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Table View for Desktop -->
          <div class="hidden md:block overflow-x-auto rounded-lg border border-base-200">
            <table class="table w-full table-sm sm:table-md">
              <thead class="bg-base-200">
                <tr>
                  <th class="w-8 sm:w-12">
                    <label>
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        :checked="isAllSelected"
                        @change="toggleSelectAll"
                      />
                    </label>
                  </th>
                  <th>Item / Produk</th>
                  <th>Project</th>
                  <th class="text-right">Qty Butuh</th>
                  <th class="text-right">Stok Gudang</th>
                  <th>Supplier (Utama)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in pendingItems" :key="item.id" class="hover:bg-base-100">
                  <th>
                    <label>
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        v-model="selectedItems"
                        :value="item"
                      />
                    </label>
                  </th>
                  <td>
                    <div class="font-bold text-sm sm:text-base">{{ item.name }}</div>
                    <div class="text-xs text-base-content/60 font-mono mt-1">
                      {{ item.product?.sku }}
                    </div>
                  </td>
                  <td>
                    <div class="font-medium text-xs sm:text-sm">{{ item.project?.title }}</div>
                    <div class="text-xs text-base-content/60">
                      {{ item.project?.projectNumber }}
                    </div>
                  </td>
                  <td class="text-right">
                    <span class="font-bold text-error">{{ item.quantity }}</span>
                    <span class="text-xs ml-1">{{ item.unit }}</span>
                  </td>
                  <td class="text-right text-sm">
                    <div class="flex flex-col items-end">
                      <span>Total: {{ item.product?.stock?.quantity || 0 }}</span>
                      <span class="text-xs text-base-content/60">
                        Reserved: {{ item.product?.stock?.reserved || 0 }}
                      </span>
                      <span
                        class="text-xs font-bold"
                        :class="
                          (item.product?.stock?.available || 0) < 0 ? 'text-error' : 'text-success'
                        "
                      >
                        Avail: {{ item.product?.stock?.available || 0 }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span v-if="item.product?.suppliers?.[0]" class="badge badge-outline">
                      {{ item.product.suppliers[0].supplier.name }}
                    </span>
                    <span v-else class="text-xs text-error italic">No Supplier</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-action mt-6 sm:mt-8 flex-col sm:flex-row gap-2">
          <button
            class="btn w-full sm:w-auto"
            @click="showCreateModal = false"
            :disabled="processing"
          >
            Batal
          </button>
          <button
            class="btn btn-primary w-full sm:w-auto"
            :disabled="selectedItems.length === 0 || processing"
            @click="createPoFromSelection"
          >
            <span v-if="processing" class="loading loading-spinner text-primary-content"></span>
            Buat PO ({{ selectedItems.length }} Item)
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreateModal = false">close</button>
      </form>
    </dialog>

    <!-- Direct PO Modal -->
    <dialog class="modal" :class="{ 'modal-open': showDirectModal }">
      <div class="modal-box w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4 sm:mb-6">
          <h3 class="font-bold text-lg sm:text-xl">Buat PO Manual</h3>
          <button @click="showDirectModal = false" class="btn btn-sm btn-circle btn-ghost">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Supplier Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Supplier</label>
          <select
            v-model="directForm.supplierId"
            class="select select-bordered w-full select-sm sm:select-md"
          >
            <option value="">Pilih Supplier</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- Items -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <label class="label-text font-medium text-sm sm:text-base">Item</label>
            <button @click="addDirectItem" class="btn btn-xs sm:btn-sm btn-ghost">+ Tambah</button>
          </div>

          <div class="overflow-x-auto -mx-4 sm:mx-0">
            <table class="table table-xs sm:table-sm">
              <thead class="bg-base-200">
                <tr>
                  <th>Produk</th>
                  <th class="w-24">Qty</th>
                  <th class="w-32">Harga</th>
                  <th class="w-32 text-right">Subtotal</th>
                  <th class="w-12"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in directForm.items" :key="idx">
                  <td>
                    <select
                      v-model="item.productId"
                      class="select select-sm select-bordered w-full"
                      @change="onProductSelect(idx)"
                    >
                      <option value="">Pilih Produk</option>
                      <option v-for="p in products" :key="p.id" :value="p.id">
                        {{ p.name }} ({{ p.sku }})
                      </option>
                    </select>
                  </td>
                  <td>
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      class="input input-sm input-bordered w-full"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="item.price"
                      type="number"
                      min="0"
                      class="input input-sm input-bordered w-full"
                    />
                  </td>
                  <td class="text-right font-mono">
                    {{ formatCurrency(item.quantity * item.price) }}
                  </td>
                  <td>
                    <button @click="removeDirectItem(idx)" class="btn btn-ghost btn-xs text-error">
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
                  </td>
                </tr>
                <tr v-if="directForm.items.length === 0">
                  <td colspan="5" class="text-center text-base-content/60 py-4">Belum ada item</td>
                </tr>
              </tbody>
              <tfoot v-if="directForm.items.length > 0">
                <tr>
                  <td colspan="3" class="text-right font-bold">Total</td>
                  <td class="text-right font-mono font-bold text-primary">
                    {{ formatCurrency(directTotal) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-control mb-4">
          <label class="label"><span class="label-text">Catatan (opsional)</span></label>
          <textarea
            v-model="directForm.notes"
            class="textarea textarea-bordered w-full"
            rows="2"
          ></textarea>
        </div>

        <div class="modal-action flex-col sm:flex-row gap-2">
          <button
            class="btn w-full sm:w-auto"
            @click="showDirectModal = false"
            :disabled="processingDirect"
          >
            Batal
          </button>
          <button
            class="btn btn-primary w-full sm:w-auto"
            :disabled="!canCreateDirect || processingDirect"
            @click="createDirectPo"
          >
            <span v-if="processingDirect" class="loading loading-spinner"></span>
            Buat PO
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showDirectModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { showAlert } = useAlert()
const { formatCurrency, formatDate } = useFormatter()

const showCreateModal = ref(false)
const selectedItems = ref<any[]>([])
const selectedSupplierId = ref('')
const processing = ref(false)
const poNotes = ref('')

// View mode & search for both sections - Default to GRID on mobile, LIST on desktop
const viewMode = ref<'LIST' | 'GRID'>(
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'GRID' : 'LIST'
)
const search = ref('')
const pendingViewMode = ref<'LIST' | 'GRID'>(
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'GRID' : 'LIST'
)
const pendingSearch = ref('')

const pendingItemsQuery = await useFetch('/api/purchase-orders/pending-items')
const pendingItems = computed(() => pendingItemsQuery.data.value || [])

// Filtered pending items
const filteredPendingItems = computed(() => {
  if (!pendingSearch.value) return pendingItems.value
  const term = pendingSearch.value.toLowerCase()
  return pendingItems.value.filter(
    (item: any) =>
      item.name.toLowerCase().includes(term) ||
      item.product?.sku.toLowerCase().includes(term) ||
      item.project?.projectNumber.toLowerCase().includes(term) ||
      item.project?.title.toLowerCase().includes(term)
  )
})

const poListQuery = await useFetch('/api/purchase-orders')
const poList = computed(() => poListQuery.data.value || [])

// Filtered PO list
const filteredPOList = computed(() => {
  if (!search.value) return poList.value
  const term = search.value.toLowerCase()
  return poList.value.filter(
    (po: any) =>
      po.poNumber.toLowerCase().includes(term) ||
      po.supplier?.name.toLowerCase().includes(term) ||
      po.project?.projectNumber.toLowerCase().includes(term)
  )
})

const { data: suppliers } = await useFetch('/api/suppliers')
const { data: productsData } = await useFetch('/api/products', { query: { limit: 1000 } })
const products = computed(() => (productsData.value as any)?.data || [])

// Direct PO Modal state
const showDirectModal = ref(false)
const processingDirect = ref(false)

interface DirectItem {
  productId: string
  name: string
  quantity: number
  price: number
}

const directForm = reactive({
  supplierId: '',
  notes: '',
  items: [] as DirectItem[],
})

const directTotal = computed(() => {
  return directForm.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
})

const canCreateDirect = computed(() => {
  return (
    directForm.supplierId &&
    directForm.items.length > 0 &&
    directForm.items.every(i => i.productId && i.quantity > 0)
  )
})

const openDirectModal = () => {
  directForm.supplierId = ''
  directForm.notes = ''
  directForm.items = []
  showDirectModal.value = true
}

const addDirectItem = () => {
  directForm.items.push({ productId: '', name: '', quantity: 1, price: 0 })
}

const removeDirectItem = (idx: number) => {
  directForm.items.splice(idx, 1)
}

const onProductSelect = (idx: number) => {
  const item = directForm.items[idx]
  const product = products.value.find((p: any) => p.id === item.productId)
  if (product) {
    item.name = product.name
    item.price = parseFloat(product.purchasePrice) || 0
  }
}

const createDirectPo = async () => {
  if (!canCreateDirect.value) return

  processingDirect.value = true
  try {
    const po = await $fetch('/api/purchase-orders/create-direct', {
      method: 'POST',
      body: directForm,
    })
    showAlert(`PO ${(po as any).poNumber} berhasil dibuat!`, 'success')
    showDirectModal.value = false
    poListQuery.refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal membuat PO', 'error')
  } finally {
    processingDirect.value = false
  }
}

const getPoStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PROGRESS: 'Progress',
    RECEIVED: 'Diterima',
    CANCELLED: 'Dibatalkan',
  }
  return labels[status] || status
}

const getPoStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'badge-ghost',
    PROGRESS: 'badge-warning',
    RECEIVED: 'badge-success',
    CANCELLED: 'badge-error',
  }
  return classes[status] || 'badge-ghost'
}

const isAllSelected = computed(() => {
  return pendingItems.value.length > 0 && selectedItems.value.length === pendingItems.value.length
})

// Group items by their primary supplier for convenience
const defaultSupplierId = computed(() => {
  if (selectedItems.value.length === 0) return ''
  const firstSupplier = selectedItems.value[0]?.product?.suppliers?.[0]?.supplier?.id
  return firstSupplier || ''
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = [...pendingItems.value]
  }
}

const openCreateModal = () => {
  pendingItemsQuery.refresh()
  selectedItems.value = []
  selectedSupplierId.value = ''
  poNotes.value = ''
  showCreateModal.value = true
}

const createPoFromSelection = async () => {
  if (selectedItems.value.length === 0) {
    showAlert('Pilih minimal 1 item', 'error')
    return
  }

  // Use selected supplier or default from first item
  const supplierId = selectedSupplierId.value || defaultSupplierId.value
  if (!supplierId) {
    showAlert('Pilih supplier terlebih dahulu', 'error')
    return
  }

  processing.value = true
  try {
    const projectItemIds = selectedItems.value.map(item => item.id)

    const po = await $fetch('/api/purchase-orders/create', {
      method: 'POST',
      body: {
        supplierId,
        projectItemIds,
        notes: poNotes.value,
      },
    })

    showAlert(`PO ${(po as any).poNumber} berhasil dibuat!`, 'success')
    showCreateModal.value = false
    selectedItems.value = []
    pendingItemsQuery.refresh()
    poListQuery.refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal membuat PO', 'error')
  } finally {
    processing.value = false
  }
}
</script>
