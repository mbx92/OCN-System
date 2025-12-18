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
            :disabled="processing"
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

          <!-- Receive Button (PROGRESS only) -->
          <button
            v-if="po.status === 'PROGRESS'"
            @click="receivePo"
            class="btn btn-success text-white"
            :disabled="processing"
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
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in po.items" :key="item.id">
                      <td>
                        <div class="font-bold">{{ item.name }}</div>
                        <div v-if="item.product?.sku" class="text-xs text-base-content/60">
                          {{ item.product.sku }}
                        </div>
                      </td>
                      <td class="text-center">{{ item.quantity }}</td>
                      <td class="text-right font-mono">{{ formatCurrency(item.price) }}</td>
                      <td class="text-right font-mono font-bold">
                        {{ formatCurrency(item.total) }}
                      </td>
                      <td class="text-center">
                        <span v-if="item.receivedQty > 0" class="badge badge-success">
                          {{ item.receivedQty }}
                        </span>
                        <span v-else class="text-base-content/40">-</span>
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
const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()
const { confirm } = useConfirm()

const {
  data: po,
  pending,
  error,
  refresh,
} = await useFetch(`/api/purchase-orders/${route.params.id}`)

const processing = ref<string | null>(null)

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
