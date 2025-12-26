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
        <div class="flex gap-2">
          <button @click="showInvoice = true" class="btn btn-outline">
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview Invoice
          </button>
          <button @click="printInvoice" class="btn btn-primary">
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
          <h3 class="font-bold text-lg">Preview Invoice</h3>
          <button @click="showInvoice = false" class="btn btn-ghost btn-sm btn-circle">
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
        <div id="invoice-print" class="p-6 bg-white text-black">
          <PaymentInvoice v-if="payment" :payment="payment" />
        </div>
        <div class="modal-action p-4 border-t">
          <button class="btn" @click="showInvoice = false">Tutup</button>
          <button class="btn btn-primary" @click="printInvoice">Cetak</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showInvoice = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()

const showInvoice = ref(false)

const { data: payment, pending, error } = await useFetch(`/api/payments/${route.params.id}`)

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

const printInvoice = () => {
  showInvoice.value = true
  setTimeout(() => {
    window.print()
  }, 100)
}
</script>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #invoice-print,
  #invoice-print * {
    visibility: visible;
  }
  #invoice-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
