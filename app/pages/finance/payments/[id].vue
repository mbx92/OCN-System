<template>
  <div class="space-y-6">
    <!-- Back Button -->
    <button @click="navigateTo('/finance/payments')" class="btn btn-ghost btn-sm gap-2">
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

    <template v-else-if="payment">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold">Pembayaran #{{ payment.paymentNumber }}</h1>
            <span
              class="badge"
              :class="payment.mode === 'PROJECT' ? 'badge-primary' : 'badge-success'"
            >
              {{ payment.mode }}
            </span>
          </div>
          <p class="text-base-content/60">{{ formatDate(payment.paymentDate) }}</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <!-- Pay Button for UNPAID/PARTIAL -->
          <button
            v-if="payment.status === 'UNPAID' || payment.status === 'PARTIAL'"
            @click="showPaymentRecordDialog = true"
            class="btn btn-success gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Bayar / Lunasi
          </button>
          <button @click="showInvoice = true" class="btn btn-outline btn-info">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Invoice Detail
          </button>
          <button @click="showReceipt = true" class="btn btn-outline btn-success">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            Kwitansi
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Payment Info -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Detail Pembayaran</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-base-content/60">No. Pembayaran</span>
                <span class="font-mono">{{ payment.paymentNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Mode</span>
                <span
                  class="badge"
                  :class="payment.mode === 'PROJECT' ? 'badge-primary' : 'badge-success'"
                >
                  {{ payment.mode }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Tipe</span>
                <span class="badge badge-ghost">{{ getTypeLabel(payment.type) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Status</span>
                <span class="badge" :class="getStatusBadgeClass(payment.status)">
                  {{ getStatusLabel(payment.status) }}
                </span>
              </div>
              <div class="divider my-1"></div>
              <div class="flex justify-between text-lg font-bold">
                <span>Jumlah</span>
                <span class="text-success">{{ formatCurrency(payment.amount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Metode</span>
                <span>{{ payment.method }}</span>
              </div>
              <div v-if="payment.reference" class="flex justify-between">
                <span class="text-base-content/60">Referensi</span>
                <span class="font-mono text-sm">{{ payment.reference }}</span>
              </div>
              <div v-if="payment.notes" class="pt-2">
                <span class="text-base-content/60 block mb-1">Catatan:</span>
                <p class="text-sm">{{ payment.notes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Project Info (if PROJECT mode) -->
        <div v-if="payment.project" class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Proyek Terkait</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-base-content/60">No. Proyek</span>
                <NuxtLink
                  :to="`/projects/${payment.project.id}`"
                  class="link link-primary font-mono"
                >
                  {{ payment.project.projectNumber }}
                </NuxtLink>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Judul</span>
                <span>{{ payment.project.title }}</span>
              </div>
              <div class="divider my-1"></div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Pelanggan</span>
                <span class="font-medium">{{ payment.project.customer?.name }}</span>
              </div>
              <div v-if="payment.project.customer?.phone" class="flex justify-between">
                <span class="text-base-content/60">Telepon</span>
                <span class="font-mono">{{ payment.project.customer.phone }}</span>
              </div>
              <div v-if="payment.project.customer?.address" class="pt-2">
                <span class="text-base-content/60 block mb-1">Alamat:</span>
                <p class="text-sm">{{ payment.project.customer.address }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Items (if PROJECT mode) -->
      <div v-if="payment.project?.items?.length" class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Item Proyek</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Kode</th>
                  <th>Nama Item</th>
                  <th class="text-center">Qty</th>
                  <th>Satuan</th>
                  <th class="text-right">Harga</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in payment.project.items" :key="item.id">
                  <td>{{ idx + 1 }}</td>
                  <td class="font-mono text-sm">{{ item.product?.sku || '-' }}</td>
                  <td>{{ item.name }}</td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td>{{ item.unit }}</td>
                  <td class="text-right font-mono">{{ formatCurrency(item.price) }}</td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(item.totalPrice) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="6" class="text-right font-bold">Sub Total</td>
                  <td class="text-right font-mono font-bold">{{ formatCurrency(projectTotal) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Invoice Preview Modal -->
    <dialog class="modal" :class="{ 'modal-open': showInvoice }">
      <div class="modal-box w-11/12 max-w-4xl p-0">
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="font-bold text-lg">Preview Invoice Detail</h3>
          <button @click="showInvoice = false" class="btn btn-ghost btn-sm btn-circle">✕</button>
        </div>
        <div id="invoice-print" class="p-6 bg-white text-black overflow-auto">
          <PaymentInvoice v-if="payment" :payment="payment" :company="company" />
        </div>
        <div class="modal-action p-4 border-t">
          <button class="btn" @click="showInvoice = false">Tutup</button>
          <button class="btn btn-outline btn-info" @click="printDocument('invoice')">
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
          <button class="btn btn-primary" @click="downloadInvoicePdf" :disabled="generatingPdf">
            <span v-if="generatingPdf" class="loading loading-spinner loading-sm"></span>
            <svg
              v-else
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showInvoice = false">close</button>
      </form>
    </dialog>

    <!-- Receipt/Kwitansi Preview Modal -->
    <dialog class="modal" :class="{ 'modal-open': showReceipt }">
      <div class="modal-box w-11/12 max-w-4xl p-0">
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="font-bold text-lg">Preview Kwitansi</h3>
          <button @click="showReceipt = false" class="btn btn-ghost btn-sm btn-circle">✕</button>
        </div>
        <div id="receipt-print" class="p-6 bg-white text-black overflow-auto">
          <PaymentReceipt v-if="payment" :payment="payment" :company="company" />
        </div>
        <div class="modal-action p-4 border-t">
          <button class="btn" @click="showReceipt = false">Tutup</button>
          <button class="btn btn-outline btn-info" @click="printDocument('receipt')">
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
          <button class="btn btn-primary" @click="downloadReceiptPdf" :disabled="generatingPdf">
            <span v-if="generatingPdf" class="loading loading-spinner loading-sm"></span>
            <svg
              v-else
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showReceipt = false">close</button>
      </form>
    </dialog>

    <!-- Record Payment Dialog -->
    <dialog class="modal" :class="{ 'modal-open': showPaymentRecordDialog }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Catat Pembayaran</h3>

        <!-- Invoice Info -->
        <div v-if="payment" class="bg-base-200 rounded-lg p-4 mb-4">
          <div class="flex justify-between mb-2">
            <span class="text-base-content/60">No. Invoice:</span>
            <span class="font-mono font-bold">{{ payment.paymentNumber }}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-base-content/60">Total Tagihan:</span>
            <span class="font-mono font-bold text-success">
              {{ formatCurrency(payment.amount) }}
            </span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-base-content/60">Status Saat Ini:</span>
            <span class="badge" :class="getStatusBadgeClass(payment.status)">
              {{ getStatusLabel(payment.status) }}
            </span>
          </div>
          <div v-if="payment.project" class="flex justify-between">
            <span class="text-base-content/60">Proyek:</span>
            <span>{{ payment.project.projectNumber }}</span>
          </div>
        </div>

        <form @submit.prevent="recordPayment">
          <div class="space-y-4">
            <!-- Status -->
            <div class="form-control">
              <label class="label"><span class="label-text">Status Pembayaran *</span></label>
              <select
                v-model="paymentRecordForm.status"
                class="select select-bordered w-full"
                required
              >
                <option value="PAID">Lunas</option>
                <option value="PARTIAL">Dibayar Sebagian</option>
              </select>
            </div>

            <!-- Paid Date -->
            <div class="form-control">
              <label class="label"><span class="label-text">Tanggal Pembayaran *</span></label>
              <input
                v-model="paymentRecordForm.paidDate"
                type="date"
                class="input input-bordered w-full"
                required
              />
            </div>

            <!-- Notes -->
            <div class="form-control">
              <label class="label"><span class="label-text">Catatan (opsional)</span></label>
              <textarea
                v-model="paymentRecordForm.notes"
                class="textarea textarea-bordered w-full"
                rows="2"
                placeholder="Catatan pembayaran..."
              ></textarea>
            </div>
          </div>

          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="showPaymentRecordDialog = false"
              :disabled="recordingPayment"
            >
              Batal
            </button>
            <button type="submit" class="btn btn-success" :disabled="recordingPayment">
              <span v-if="recordingPayment" class="loading loading-spinner loading-sm"></span>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {{ recordingPayment ? 'Menyimpan...' : 'Simpan Pembayaran' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showPaymentRecordDialog = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()
const {
  generating: generatingPdf,
  downloadInvoicePdf: generateInvoicePdf,
  downloadReceiptPdf: generateReceiptPdf,
} = usePdfGenerator()

const showInvoice = ref(false)
const showReceipt = ref(false)

const { data: payment, pending, error } = await useFetch(`/api/payments/${route.params.id}`)
const { data: company } = await useFetch('/api/company')

const projectTotal = computed(() => {
  if (!payment.value?.project?.items) return 0
  return (payment.value as any).project.items.reduce(
    (sum: number, item: any) => sum + parseFloat(item.totalPrice || 0),
    0
  )
})

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    FULL: 'Lunas',
    DP: 'Down Payment',
    INSTALLMENT: 'Cicilan',
    SETTLEMENT: 'Pelunasan',
  }
  return labels[type] || type
}

const printDocument = (type: 'invoice' | 'receipt') => {
  if (type === 'invoice') {
    showInvoice.value = true
    showReceipt.value = false
  } else {
    showReceipt.value = true
    showInvoice.value = false
  }
  setTimeout(() => {
    window.print()
  }, 100)
}

const downloadInvoicePdf = async () => {
  try {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const paymentNum = (payment.value as any)?.paymentNumber?.split('-').pop() || '0001'
    const filename = `INV-${dateStr}-${paymentNum.slice(-4).padStart(4, '0')}`
    await generateInvoicePdf(payment.value, filename)
    showAlert('Invoice berhasil diunduh!', 'success')
  } catch (err) {
    console.error('Error downloading invoice:', err)
    showAlert('Gagal mengunduh invoice', 'error')
  }
}

const downloadReceiptPdf = async () => {
  try {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const paymentNum = (payment.value as any)?.paymentNumber?.split('-').pop() || '0001'
    const filename = `KWI-${dateStr}-${paymentNum.slice(-4).padStart(4, '0')}`
    await generateReceiptPdf(payment.value, filename)
    showAlert('Kwitansi berhasil diunduh!', 'success')
  } catch (err) {
    console.error('Error downloading receipt:', err)
    showAlert('Gagal mengunduh kwitansi', 'error')
  }
}

// === Payment Recording ===
const showPaymentRecordDialog = ref(false)
const recordingPayment = ref(false)

const paymentRecordForm = reactive({
  status: 'PAID' as 'PARTIAL' | 'PAID',
  paidDate: new Date().toISOString().split('T')[0],
  notes: '',
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    UNPAID: 'Belum Dibayar',
    PARTIAL: 'Sebagian',
    PAID: 'Lunas',
    OVERDUE: 'Jatuh Tempo',
    CANCELLED: 'Dibatalkan',
  }
  return labels[status] || status
}

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'badge-ghost',
    UNPAID: 'badge-warning',
    PARTIAL: 'badge-info',
    PAID: 'badge-success',
    OVERDUE: 'badge-error',
    CANCELLED: 'badge-ghost',
  }
  return classes[status] || 'badge-ghost'
}

const recordPayment = async () => {
  recordingPayment.value = true
  try {
    await $fetch(`/api/payments/${route.params.id}/status`, {
      method: 'PATCH',
      body: {
        status: paymentRecordForm.status,
        paidDate: new Date(paymentRecordForm.paidDate).toISOString(),
        notes: paymentRecordForm.notes || null,
      },
    })

    const statusLabel = paymentRecordForm.status === 'PAID' ? 'Lunas' : 'Sebagian'
    showAlert(`Pembayaran berhasil dicatat sebagai ${statusLabel}!`, 'success')
    showPaymentRecordDialog.value = false

    // Refresh the page to show updated status
    await refreshNuxtData()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mencatat pembayaran', 'error')
  } finally {
    recordingPayment.value = false
  }
}
</script>

<style>
@media print {
  /* Hide everything except print areas */
  body * {
    visibility: hidden;
  }

  #invoice-print,
  #invoice-print *,
  #receipt-print,
  #receipt-print * {
    visibility: visible;
  }

  #invoice-print,
  #receipt-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white !important;
    padding: 20mm !important;
    margin: 0 !important;
    box-sizing: border-box;
  }

  /* A4 page setup */
  @page {
    size: A4;
    margin: 10mm;
  }

  /* Ensure background colors print */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* Force table borders to show */
  table {
    border-collapse: collapse !important;
  }

  table th,
  table td {
    border: 1px solid #ddd !important;
    padding: 8px !important;
  }

  /* Hide modal backdrop and buttons during print */
  .modal-backdrop,
  .modal-action,
  .btn {
    display: none !important;
  }

  /* Ensure proper font sizing */
  body {
    font-size: 12pt !important;
    line-height: 1.4 !important;
  }
}
</style>
