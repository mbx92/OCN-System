<template>
  <div class="space-y-6">
    <!-- Back Button -->
    <button @click="navigateTo('/purchase-orders')" class="btn btn-ghost btn-sm gap-2">
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
      <span>{{ error.message || 'Terjadi kesalahan' }}</span>
    </div>

    <template v-else-if="po">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold">{{ po.poNumber }}</h1>
            <span class="badge" :class="getStatusClass(po.status)">
              {{ getStatusLabel(po.status) }}
            </span>
          </div>
          <p class="text-base-content/60">{{ po.supplier?.name }}</p>
        </div>
        <div class="flex gap-2">
          <!-- Send to Supplier Button (DRAFT only) -->
          <button
            v-if="po.status === 'DRAFT'"
            @click="sendPo"
            class="btn btn-info text-white"
            :disabled="!!processing"
          >
            <span v-if="processing === 'sending'" class="loading loading-spinner"></span>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            Kirim ke Supplier
          </button>

          <!-- Cancel Button (DRAFT only) -->
          <button
            v-if="po.status === 'DRAFT'"
            @click="cancelPo"
            class="btn btn-error text-white"
            :disabled="!!processing"
          >
            <span v-if="processing === 'cancelling'" class="loading loading-spinner"></span>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-1"
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
            Batalkan PO
          </button>

          <!-- Receive Button (PROGRESS only) -->
          <button
            v-if="po.status === 'PROGRESS'"
            @click="receivePo"
            class="btn btn-success text-white"
            :disabled="!!processing"
          >
            <span v-if="processing === 'receiving'" class="loading loading-spinner"></span>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Terima Barang
          </button>

          <button @click="printPo" class="btn btn-outline">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Cetak
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Info -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Informasi PO</h2>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-base-content/60">Supplier</p>
                  <p class="font-bold">{{ po.supplier?.name }}</p>
                  <p v-if="po.supplier?.phone">{{ po.supplier.phone }}</p>
                </div>
                <div>
                  <p class="text-base-content/60">Proyek Terkait</p>
                  <NuxtLink
                    v-if="po.project"
                    :to="`/projects/${po.project.id}`"
                    class="link link-primary font-bold"
                  >
                    {{ po.project.projectNumber }}
                  </NuxtLink>
                  <p v-else class="text-base-content/40">-</p>
                  <p v-if="po.project?.title" class="text-sm">{{ po.project.title }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Item PO</h2>
              <div class="overflow-x-auto">
                <table class="table">
                  <thead class="bg-base-200">
                    <tr>
                      <th>Produk</th>
                      <th class="text-center">Qty</th>
                      <th class="text-right">Harga</th>
                      <th class="text-right">Total</th>
                      <th class="text-center">Diterima</th>
                      <th v-if="po.status === 'DRAFT'"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in po.items" :key="item.id">
                      <td>
                        <div class="font-bold">{{ item.name }}</div>
                        <div v-if="item.product?.sku" class="text-xs text-base-content/60">
                          {{ item.product.sku }}
                        </div>
                        <!-- Show grouped projects if multiple -->
                        <div
                          v-if="item.groupedProjectItems && item.groupedProjectItems.length > 1"
                          class="mt-2"
                        >
                          <div class="collapse collapse-arrow bg-info/10">
                            <input type="checkbox" />
                            <div class="collapse-title text-xs text-info py-2 min-h-0">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-3 w-3 inline-block mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              Gabungan dari {{ item.groupedProjectItems.length }} proyek
                            </div>
                            <div class="collapse-content">
                              <ul class="text-xs space-y-1">
                                <li
                                  v-for="projectItem in item.groupedProjectItems"
                                  :key="projectItem.id"
                                  class="flex items-center gap-2"
                                >
                                  <span class="badge badge-xs badge-ghost">
                                    {{ projectItem.quantity }}
                                  </span>
                                  <span class="text-base-content/60">
                                    {{ projectItem.project?.projectNumber }} -
                                    {{ projectItem.project?.title }}
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="text-center">
                        <input
                          v-if="po.status === 'DRAFT' && editingItemId === item.id"
                          v-model.number="editQty"
                          type="number"
                          min="1"
                          class="input input-sm input-bordered w-20 text-center"
                          @keyup.enter="saveItem(item)"
                          @keyup.esc="cancelEdit"
                        />
                        <span
                          v-else
                          @click="po.status === 'DRAFT' && startEdit(item)"
                          :class="
                            po.status === 'DRAFT'
                              ? 'cursor-pointer hover:bg-base-200 px-2 py-1 rounded'
                              : ''
                          "
                        >
                          {{ item.quantity }}
                        </span>
                      </td>
                      <td class="text-right font-mono">
                        <input
                          v-if="po.status === 'DRAFT' && editingItemId === item.id"
                          v-model.number="editPrice"
                          type="number"
                          min="0"
                          step="1000"
                          class="input input-sm input-bordered w-32 text-right"
                          @keyup.enter="saveItem(item)"
                          @keyup.esc="cancelEdit"
                        />
                        <span
                          v-else
                          @click="po.status === 'DRAFT' && startEdit(item)"
                          :class="
                            po.status === 'DRAFT'
                              ? 'cursor-pointer hover:bg-base-200 px-2 py-1 rounded'
                              : ''
                          "
                        >
                          {{ formatCurrency(item.price) }}
                        </span>
                      </td>
                      <td class="text-right font-mono font-bold">
                        {{
                          formatCurrency(
                            editingItemId === item.id ? editQty * editPrice : item.total
                          )
                        }}
                      </td>
                      <td class="text-center">
                        <span v-if="item.receivedQty > 0" class="badge badge-success">
                          {{ item.receivedQty }}
                        </span>
                        <span v-else class="text-base-content/40">-</span>
                      </td>
                      <td v-if="po.status === 'DRAFT'" class="text-center">
                        <div v-if="editingItemId === item.id" class="flex gap-1 justify-center">
                          <button
                            @click="saveItem(item)"
                            class="btn btn-success btn-xs"
                            :disabled="!!processing"
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            @click="cancelEdit"
                            class="btn btn-ghost btn-xs"
                            :disabled="!!processing"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <div v-else class="flex gap-1 justify-center">
                          <button
                            @click="startEdit(item)"
                            class="btn btn-ghost btn-xs"
                            title="Edit Qty & Harga"
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
                          <!-- Delete item if more than 1 item -->
                          <button
                            v-if="po.items.length > 1"
                            @click="deleteItem(item)"
                            class="btn btn-ghost btn-xs text-error"
                            title="Hapus Item"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                          <!-- Cancel PO if only 1 item -->
                          <button
                            v-else
                            @click="cancelPo"
                            class="btn btn-ghost btn-xs text-error"
                            title="Batalkan PO"
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
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="text-right font-bold">Total</td>
                      <td class="text-right font-mono font-bold text-primary text-lg">
                        {{ formatCurrency(po.totalAmount) }}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="po.notes" class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Catatan</h2>
              <p class="whitespace-pre-wrap">{{ po.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Ringkasan</h2>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Jumlah Item</span>
                  <span>{{ po.items?.length || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Status</span>
                  <span class="badge" :class="getStatusClass(po.status)">
                    {{ getStatusLabel(po.status) }}
                  </span>
                </div>

                <div class="divider my-1"></div>

                <!-- Subtotal Items -->
                <div class="flex justify-between">
                  <span class="text-base-content/60">Subtotal</span>
                  <span>{{ formatCurrency(po.subtotal || 0) }}</span>
                </div>

                <!-- Shipping Cost - Editable for DRAFT & PROGRESS -->
                <div class="flex justify-between items-center gap-2">
                  <span class="text-base-content/60">Ongkos Kirim</span>
                  <div class="flex items-center gap-1">
                    <input
                      v-if="(po.status === 'DRAFT' || po.status === 'PROGRESS') && editingCosts"
                      v-model.number="editShippingCost"
                      type="number"
                      min="0"
                      step="1000"
                      class="input input-sm input-bordered w-32 text-right"
                      @keyup.enter="saveCosts"
                      @keyup.esc="cancelEditCosts"
                    />
                    <span v-else>
                      {{ formatCurrency(po.shippingCost || 0) }}
                    </span>
                    <button
                      v-if="(po.status === 'DRAFT' || po.status === 'PROGRESS') && !editingCosts"
                      @click="startEditCosts()"
                      class="btn btn-ghost btn-xs"
                      title="Edit Biaya"
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

                <!-- Other Costs - Editable for DRAFT & PROGRESS -->
                <div class="flex justify-between items-center gap-2">
                  <span class="text-base-content/60">Biaya Lain</span>
                  <div class="flex items-center gap-1">
                    <input
                      v-if="(po.status === 'DRAFT' || po.status === 'PROGRESS') && editingCosts"
                      v-model.number="editOtherCosts"
                      type="number"
                      min="0"
                      step="1000"
                      class="input input-sm input-bordered w-32 text-right"
                      @keyup.enter="saveCosts"
                      @keyup.esc="cancelEditCosts"
                    />
                    <span v-else>
                      {{ formatCurrency(po.otherCosts || 0) }}
                    </span>
                  </div>
                </div>

                <!-- Save/Cancel buttons when editing costs -->
                <div
                  v-if="(po.status === 'DRAFT' || po.status === 'PROGRESS') && editingCosts"
                  class="flex gap-2 justify-end"
                >
                  <button
                    @click="saveCosts"
                    class="btn btn-success btn-xs"
                    :disabled="!!processing"
                  >
                    Simpan
                  </button>
                  <button
                    @click="cancelEditCosts"
                    class="btn btn-ghost btn-xs"
                    :disabled="!!processing"
                  >
                    Batal
                  </button>
                </div>

                <div class="divider my-1"></div>

                <div class="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span class="text-primary">{{ formatCurrency(po.totalAmount) }}</span>
                </div>
              </div>

              <div class="divider"></div>

              <h3 class="font-semibold">Timeline</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Dibuat</span>
                  <span>{{ formatDate(po.createdAt) }}</span>
                </div>
                <div v-if="po.receivedDate" class="flex justify-between">
                  <span class="text-base-content/60">Diterima</span>
                  <span class="text-success">{{ formatDate(po.receivedDate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// Type definition for Purchase Order
interface PurchaseOrderItem {
  id: number
  name: string
  quantity: number
  price: number
  total: number
  receivedQty: number
  product?: {
    sku: string
  }
}

interface PurchaseOrder {
  id: number
  poNumber: string
  status: 'DRAFT' | 'PROGRESS' | 'RECEIVED' | 'CANCELLED'
  subtotal: number
  shippingCost: number
  otherCosts: number
  totalAmount: number
  notes?: string
  createdAt: string
  receivedDate?: string
  supplier?: {
    name: string
    phone?: string
  }
  project?: {
    id: number
    projectNumber: string
    title: string
  }
  items: PurchaseOrderItem[]
}

const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()
const { confirm } = useConfirm()

const {
  data: po,
  pending,
  error,
  refresh,
} = await useFetch<PurchaseOrder>(`/api/purchase-orders/${route.params.id}`)

const processing = ref<string | null>(null)
const editingItemId = ref<number | null>(null)
const editQty = ref(0)
const editPrice = ref(0)

// For editing costs
const editingCosts = ref(false)
const editShippingCost = ref(0)
const editOtherCosts = ref(0)

const startEdit = (item: PurchaseOrderItem) => {
  editingItemId.value = item.id
  editQty.value = item.quantity
  editPrice.value = Number(item.price)
}

const cancelEdit = () => {
  editingItemId.value = null
  editQty.value = 0
  editPrice.value = 0
}

const startEditCosts = () => {
  editingCosts.value = true
  editShippingCost.value = Number(po.value?.shippingCost || 0)
  editOtherCosts.value = Number(po.value?.otherCosts || 0)
}

const cancelEditCosts = () => {
  editingCosts.value = false
  editShippingCost.value = 0
  editOtherCosts.value = 0
}

const saveCosts = async () => {
  if (editShippingCost.value < 0 || editOtherCosts.value < 0) {
    showAlert('Biaya tidak boleh negatif', 'error')
    return
  }

  processing.value = 'editing-costs'
  try {
    await $fetch(`/api/purchase-orders/${route.params.id}/costs`, {
      method: 'PATCH',
      body: {
        shippingCost: editShippingCost.value,
        otherCosts: editOtherCosts.value,
      },
    })
    showAlert('Biaya berhasil diupdate!', 'success')
    cancelEditCosts()
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal update biaya', 'error')
  } finally {
    processing.value = null
  }
}

const saveItem = async (item: PurchaseOrderItem) => {
  if (editQty.value < 1) {
    showAlert('Quantity minimal 1', 'error')
    return
  }

  if (editPrice.value < 0) {
    showAlert('Harga tidak boleh negatif', 'error')
    return
  }

  processing.value = `editing-${item.id}`
  try {
    await $fetch(`/api/purchase-orders/${route.params.id}/items/${item.id}`, {
      method: 'PATCH',
      body: {
        quantity: editQty.value,
        price: editPrice.value,
      },
    })
    showAlert('Item berhasil diupdate!', 'success')
    cancelEdit()
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal update quantity', 'error')
  } finally {
    processing.value = null
  }
}

const deleteItem = async (item: PurchaseOrderItem) => {
  const isConfirmed = await confirm({
    title: 'Hapus Item',
    message: `Hapus ${item.name} dari PO?`,
    confirmText: 'Hapus',
    type: 'error',
  })
  if (!isConfirmed) return

  processing.value = `deleting-${item.id}`
  try {
    await $fetch(`/api/purchase-orders/${route.params.id}/items/${item.id}`, {
      method: 'DELETE',
    })
    showAlert('Item berhasil dihapus', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menghapus item', 'error')
  } finally {
    processing.value = null
  }
}

const cancelPo = async () => {
  const isConfirmed = await confirm({
    title: 'Batalkan PO',
    message: 'Apakah Anda yakin ingin membatalkan PO ini?',
    confirmText: 'Batalkan',
    type: 'error',
  })
  if (!isConfirmed) return

  processing.value = 'cancelling'
  try {
    await $fetch(`/api/purchase-orders/${route.params.id}`, {
      method: 'DELETE',
    })
    showAlert('PO berhasil dibatalkan', 'success')
    navigateTo('/purchase-orders')
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal membatalkan PO', 'error')
  } finally {
    processing.value = null
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PROGRESS: 'Progress',
    RECEIVED: 'Diterima',
    CANCELLED: 'Dibatalkan',
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'badge-ghost',
    PROGRESS: 'badge-warning',
    RECEIVED: 'badge-success',
    CANCELLED: 'badge-error',
  }
  return classes[status] || 'badge-ghost'
}

const sendPo = async () => {
  processing.value = 'sending'
  try {
    await $fetch(`/api/purchase-orders/${route.params.id}/send`, { method: 'POST' })
    showAlert('PO berhasil dikirim ke supplier!', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengirim PO', 'error')
  } finally {
    processing.value = null
  }
}

const receivePo = async () => {
  const isConfirmed = await confirm({
    title: 'Terima Barang',
    message:
      'Apakah Anda yakin semua barang sudah diterima? Stok akan ditambahkan secara otomatis.',
    confirmText: 'Ya, Terima',
    type: 'success',
  })
  if (!isConfirmed) return

  processing.value = 'receiving'
  try {
    await $fetch(`/api/purchase-orders/${route.params.id}/receive`, { method: 'POST' })
    showAlert('Barang berhasil diterima! Stok telah ditambahkan.', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menerima barang', 'error')
  } finally {
    processing.value = null
  }
}

const printPo = () => {
  window.print()
}
</script>
