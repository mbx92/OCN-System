<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Kelola Invoice</h1>
        <p class="text-gray-600 mt-1">Buat invoice untuk penagihan customer</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-row items-center gap-4">
        <!-- Status Filter -->
        <div class="flex-1">
          <select
            v-model="filters.status"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            @change="fetchInvoices"
          >
            <option value="">Semua Status</option>
            <option value="UNPAID">Belum Dibayar</option>
            <option value="PARTIAL">Dibayar Sebagian</option>
            <option value="PAID">Lunas</option>
            <option value="OVERDUE">Jatuh Tempo</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>

        <!-- Mode Filter -->
        <div class="flex-1">
          <select
            v-model="filters.mode"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            @change="fetchInvoices"
          >
            <option value="">Semua Mode</option>
            <option value="PROJECT">Project</option>
            <option value="POS">POS</option>
          </select>
        </div>

        <!-- Refresh & New -->
        <div class="flex gap-2">
          <button
            @click="fetchInvoices"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            title="Refresh"
          >
            <Icon name="mdi:refresh" class="w-5 h-5" />
          </button>
          <button
            @click="showCreateDialog = true"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2"
          >
            <Icon name="mdi:plus" class="w-5 h-5" />
            Buat Invoice
          </button>
        </div>
      </div>

      <!-- Invoice Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div v-if="loading" class="p-8 text-center text-gray-500">
          <Icon name="mdi:loading" class="w-8 h-8 animate-spin mx-auto mb-2" />
          Memuat data...
        </div>

        <div v-else-if="invoices.length === 0" class="p-8 text-center text-gray-500">
          <Icon name="mdi:file-document-outline" class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Belum ada invoice</p>
        </div>

        <table v-else class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                No. Invoice
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Project / Customer
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tanggal
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Jumlah
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Jatuh Tempo
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="invoice in invoices" :key="invoice.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-medium text-gray-900">{{ invoice.paymentNumber }}</div>
                <div class="text-xs text-gray-500">{{ invoice.method }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900">
                  {{ invoice.project?.projectNumber || '-' }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ invoice.project?.customer?.name || '-' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(invoice.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                {{ formatCurrency(invoice.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getStatusBadge(invoice.status)"
                >
                  {{ getStatusLabel(invoice.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div
                  v-if="invoice.dueDate"
                  :class="{
                    'text-red-600 font-medium': isOverdue(invoice.dueDate, invoice.status),
                  }"
                >
                  {{ formatDate(invoice.dueDate) }}
                  <span v-if="isOverdue(invoice.dueDate, invoice.status)" class="block text-xs">
                    Jatuh Tempo
                  </span>
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <div class="flex justify-center gap-2">
                  <button
                    @click="viewInvoice(invoice)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Lihat Invoice"
                  >
                    <Icon name="mdi:file-eye" class="w-5 h-5" />
                  </button>
                  <button
                    v-if="invoice.status !== 'PAID' && invoice.status !== 'CANCELLED'"
                    @click="openPaymentDialog(invoice)"
                    class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                    title="Catat Pembayaran"
                  >
                    <Icon name="mdi:cash-check" class="w-5 h-5" />
                  </button>
                  <button
                    v-if="invoice.status !== 'CANCELLED'"
                    @click="cancelInvoice(invoice)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Batalkan Invoice"
                  >
                    <Icon name="mdi:cancel" class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.totalPages > 1" class="mt-6">
        <AppPagination
          :total="meta.total"
          :per-page="meta.limit"
          :current-page="meta.page"
          @update:currentPage="changePage"
        />
      </div>
    </div>

    <!-- Create Invoice Dialog -->
    <Teleport to="body">
      <div
        v-if="showCreateDialog"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div class="bg-white rounded-lg max-w-md w-full p-6">
          <h3 class="text-lg font-bold mb-4">Buat Invoice Baru</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <AppProjectSelect v-model="newInvoice.projectId" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
              <input
                v-model.number="newInvoice.amount"
                type="number"
                step="0.01"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Diskon (Opsional)</label>
              <input
                v-model.number="newInvoice.discount"
                type="number"
                step="0.01"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div v-if="newInvoice.discount && newInvoice.discount > 0">
              <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan Diskon</label>
              <input
                v-model="newInvoice.discountNote"
                type="text"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Contoh: Diskon loyalitas 10%"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
              <input
                v-model="newInvoice.dueDate"
                type="date"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
              <select
                v-model="newInvoice.method"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="CASH">Cash</option>
                <option value="TRANSFER">Transfer</option>
                <option value="GIRO">Giro</option>
                <option value="EDC">EDC</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
              <textarea
                v-model="newInvoice.notes"
                rows="3"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Catatan tambahan..."
              ></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              @click="showCreateDialog = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              @click="createInvoice"
              :disabled="creating"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {{ creating ? 'Membuat...' : 'Buat Invoice' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Payment Dialog -->
    <Teleport to="body">
      <div
        v-if="showPaymentDialog"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div class="bg-white rounded-lg max-w-md w-full p-6">
          <h3 class="text-lg font-bold mb-4">Catat Pembayaran</h3>

          <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex justify-between mb-2">
              <span class="text-gray-600">Invoice:</span>
              <span class="font-medium">{{ selectedInvoice?.paymentNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Total:</span>
              <span class="font-bold text-lg">
                {{ formatCurrency(selectedInvoice?.amount || 0) }}
              </span>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                v-model="paymentUpdate.status"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="PARTIAL">Dibayar Sebagian</option>
                <option value="PAID">Lunas</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Bayar</label>
              <input
                v-model="paymentUpdate.paidDate"
                type="date"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                v-model="paymentUpdate.notes"
                rows="3"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Catatan pembayaran..."
              ></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              @click="showPaymentDialog = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              @click="recordPayment"
              :disabled="updating"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {{ updating ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()

const loading = ref(false)
const creating = ref(false)
const updating = ref(false)

const filters = ref({
  status: '',
  mode: 'PROJECT',
})

const invoices = ref<any[]>([])
const meta = ref({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
})

const showCreateDialog = ref(false)
const showPaymentDialog = ref(false)
const selectedInvoice = ref<any>(null)

const newInvoice = ref({
  projectId: '',
  amount: 0,
  discount: 0,
  discountNote: '',
  dueDate: '',
  method: 'TRANSFER',
  notes: '',
})

const paymentUpdate = ref({
  status: 'PAID',
  paidDate: new Date().toISOString().split('T')[0],
  notes: '',
})

const fetchInvoices = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(meta.value.page),
      limit: String(meta.value.limit),
      mode: filters.value.mode,
    })

    if (filters.value.status) {
      params.append('status', filters.value.status)
    }

    const response = await $fetch<any>(`/api/payments?${params}`)
    invoices.value = response.data
    meta.value = response.meta
  } catch (error: any) {
    showAlert(error.data?.statusMessage || 'Gagal memuat data invoice', 'error')
  } finally {
    loading.value = false
  }
}

const createInvoice = async () => {
  if (!newInvoice.value.projectId) {
    showAlert('Project harus dipilih', 'error')
    return
  }
  if (newInvoice.value.amount <= 0) {
    showAlert('Jumlah harus lebih dari 0', 'error')
    return
  }

  creating.value = true
  try {
    await $fetch('/api/payments', {
      method: 'POST',
      body: {
        projectId: newInvoice.value.projectId,
        mode: 'PROJECT',
        type: 'FULL',
        amount: newInvoice.value.amount,
        discount: newInvoice.value.discount || 0,
        discountNote: newInvoice.value.discountNote || null,
        method: newInvoice.value.method,
        notes: newInvoice.value.notes || null,
        status: 'UNPAID',
        dueDate: newInvoice.value.dueDate ? new Date(newInvoice.value.dueDate).toISOString() : null,
      },
    })

    showAlert('Invoice berhasil dibuat', 'success')
    showCreateDialog.value = false

    // Reset form
    newInvoice.value = {
      projectId: '',
      amount: 0,
      discount: 0,
      discountNote: '',
      dueDate: '',
      method: 'TRANSFER',
      notes: '',
    }

    fetchInvoices()
  } catch (error: any) {
    showAlert(error.data?.statusMessage || 'Gagal membuat invoice', 'error')
  } finally {
    creating.value = false
  }
}

const openPaymentDialog = (invoice: any) => {
  selectedInvoice.value = invoice
  paymentUpdate.value = {
    status: 'PAID',
    paidDate: new Date().toISOString().split('T')[0],
    notes: '',
  }
  showPaymentDialog.value = true
}

const recordPayment = async () => {
  if (!selectedInvoice.value) return

  updating.value = true
  try {
    await $fetch(`/api/payments/${selectedInvoice.value.id}/status`, {
      method: 'PATCH' as any,
      body: {
        status: paymentUpdate.value.status,
        paidDate: new Date(paymentUpdate.value.paidDate).toISOString(),
        notes: paymentUpdate.value.notes || null,
      },
    })

    showAlert('Pembayaran berhasil dicatat', 'success')
    showPaymentDialog.value = false
    fetchInvoices()
  } catch (error: any) {
    showAlert(error.data?.statusMessage || 'Gagal mencatat pembayaran', 'error')
  } finally {
    updating.value = false
  }
}

const viewInvoice = (invoice: any) => {
  // Open invoice in new tab
  window.open(`/api/payments/${invoice.id}/invoice`, '_blank')
}

const cancelInvoice = async (invoice: any) => {
  const { confirm } = useConfirm()
  const confirmed = await confirm({
    title: 'Batalkan Invoice',
    message: `Apakah Anda yakin ingin membatalkan invoice ${invoice.paymentNumber}?`,
  })

  if (!confirmed) return

  try {
    await $fetch(`/api/payments/${invoice.id}/status`, {
      method: 'PATCH' as any,
      body: {
        status: 'CANCELLED',
        notes: 'Invoice dibatalkan',
      },
    })

    showAlert('Invoice berhasil dibatalkan', 'success')
    fetchInvoices()
  } catch (error: any) {
    showAlert(error.data?.statusMessage || 'Gagal membatalkan invoice', 'error')
  }
}

const changePage = (page: number) => {
  meta.value.page = page
  fetchInvoices()
}

const getStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    UNPAID: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }
  return badges[status] || 'bg-gray-100 text-gray-800'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    UNPAID: 'Belum Dibayar',
    PARTIAL: 'Dibayar Sebagian',
    PAID: 'Lunas',
    OVERDUE: 'Jatuh Tempo',
    CANCELLED: 'Dibatalkan',
  }
  return labels[status] || status
}

const isOverdue = (dueDate: string, status: string) => {
  if (status === 'PAID' || status === 'CANCELLED') return false
  return new Date(dueDate) < new Date()
}

onMounted(() => {
  fetchInvoices()
})
</script>
