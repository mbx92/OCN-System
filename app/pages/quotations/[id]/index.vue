<template>
  <div class="space-y-6">
    <!-- Back Button -->
    <button @click="navigateTo('/quotations')" class="btn btn-ghost btn-sm gap-2">
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

    <template v-else-if="quotation">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div class="flex-1">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <h1 class="text-xl sm:text-2xl font-bold">Penawaran #{{ quotation.quotationNo }}</h1>
            <span class="badge w-fit" :class="getStatusClass(quotation.status)">
              {{ getStatusLabel(quotation.status) }}
            </span>
          </div>
          <p class="text-sm sm:text-base text-base-content/60">{{ quotation.customer?.name }}</p>
        </div>

        <!-- Desktop Actions -->
        <div class="hidden sm:flex gap-2 flex-shrink-0">
          <!-- Edit Button (DRAFT only) -->
          <NuxtLink
            v-if="quotation.status === 'DRAFT'"
            :to="`/quotations/${quotation.id}/edit`"
            class="btn btn-outline btn-sm"
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
            Edit
          </NuxtLink>

          <!-- Send Button (DRAFT only) -->
          <button
            v-if="quotation.status === 'DRAFT'"
            @click="sendQuotation"
            class="btn btn-info btn-sm text-white"
            :disabled="!!processing"
          >
            <span v-if="processing === 'sending'" class="loading loading-spinner"></span>
            Kirim
          </button>

          <!-- Reject Button (DRAFT or SENT) -->
          <button
            v-if="['DRAFT', 'SENT'].includes(quotation.status)"
            @click="rejectQuotation"
            class="btn btn-error btn-sm text-white"
            :disabled="!!processing"
          >
            <span v-if="processing === 'rejecting'" class="loading loading-spinner"></span>
            Tolak
          </button>

          <!-- Approve Button (SENT or DRAFT) -->
          <button
            v-if="['DRAFT', 'SENT'].includes(quotation.status)"
            @click="approveQuotation"
            class="btn btn-success btn-sm text-white"
            :disabled="!!processing"
          >
            <span v-if="processing === 'approving'" class="loading loading-spinner"></span>
            Setujui
          </button>

          <!-- Download PDF Button -->
          <button @click="printQuotation" class="btn btn-outline btn-sm" :disabled="generatingPdf">
            <span v-if="generatingPdf" class="loading loading-spinner loading-xs"></span>
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
            PDF
          </button>
        </div>

        <!-- Mobile Actions -->
        <div class="sm:hidden grid grid-cols-4 gap-2 w-full">
          <!-- Edit Button (DRAFT only) -->
          <NuxtLink
            v-if="quotation.status === 'DRAFT'"
            :to="`/quotations/${quotation.id}/edit`"
            class="btn btn-outline btn-sm"
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
            Edit
          </NuxtLink>

          <!-- Send Button (DRAFT only) -->
          <button
            v-if="quotation.status === 'DRAFT'"
            @click="sendQuotation"
            class="btn btn-info btn-sm text-white"
            :disabled="!!processing"
          >
            <span v-if="processing === 'sending'" class="loading loading-spinner loading-xs"></span>
            <span v-else>Kirim</span>
          </button>

          <!-- Reject Button (DRAFT or SENT) -->
          <button
            v-if="['DRAFT', 'SENT'].includes(quotation.status)"
            @click="rejectQuotation"
            class="btn btn-error btn-sm text-white"
            :disabled="!!processing"
          >
            <span
              v-if="processing === 'rejecting'"
              class="loading loading-spinner loading-xs"
            ></span>
            <span v-else>Tolak</span>
          </button>

          <!-- Approve Button (SENT or DRAFT) -->
          <button
            v-if="['DRAFT', 'SENT'].includes(quotation.status)"
            @click="approveQuotation"
            class="btn btn-success btn-sm text-white"
            :disabled="!!processing"
          >
            <span
              v-if="processing === 'approving'"
              class="loading loading-spinner loading-xs"
            ></span>
            <span v-else>Setujui</span>
          </button>

          <!-- Download PDF Button -->
          <button @click="printQuotation" class="btn btn-outline btn-sm" :disabled="generatingPdf">
            <span v-if="generatingPdf" class="loading loading-spinner loading-xs"></span>
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Info -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title text-base sm:text-lg">Informasi Penawaran</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-base-content/60 text-xs sm:text-sm">Pelanggan</p>
                  <p class="font-bold">{{ quotation.customer?.name }}</p>
                  <p v-if="quotation.customer?.email" class="text-info text-xs sm:text-sm">
                    {{ quotation.customer.email }}
                  </p>
                  <p v-if="quotation.customer?.phone" class="text-xs sm:text-sm">
                    {{ quotation.customer.phone }}
                  </p>
                </div>
                <div>
                  <p class="text-base-content/60 text-xs sm:text-sm">Berlaku Hingga</p>
                  <p class="font-bold" :class="{ 'text-error': isExpired }">
                    {{ formatDate(quotation.validUntil) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title text-base sm:text-lg">Item Penawaran</h2>

              <!-- Desktop Table -->
              <div class="hidden sm:block overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>ITEM</th>
                      <th class="text-center">QTY</th>
                      <th class="text-right">HARGA SATUAN</th>
                      <th class="text-right">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in quotation.items" :key="item.id">
                      <td>
                        <div class="font-bold">{{ item.name }}</div>
                        <div v-if="item.product" class="text-xs text-base-content/60">
                          {{ item.product.sku }}
                        </div>
                      </td>
                      <td class="text-center">{{ item.quantity }} {{ item.unit }}</td>
                      <td class="text-right font-mono">{{ formatCurrency(item.price) }}</td>
                      <td class="text-right font-mono font-bold">
                        {{
                          formatCurrency(
                            item.total || item.totalPrice || item.quantity * item.price
                          )
                        }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="text-right font-bold">Total</td>
                      <td class="text-right font-mono font-bold text-primary text-lg">
                        {{ formatCurrency(quotation.totalAmount) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Mobile List -->
              <div class="sm:hidden space-y-3">
                <div
                  v-for="item in quotation.items"
                  :key="item.id"
                  class="bg-base-200 p-3 rounded-lg"
                >
                  <div class="font-bold text-sm mb-1">{{ item.name }}</div>
                  <div v-if="item.product" class="text-xs text-base-content/60 mb-2">
                    {{ item.product.sku }}
                  </div>
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-base-content/60">
                      {{ item.quantity }} {{ item.unit }} × {{ formatCurrency(item.price) }}
                    </span>
                    <span class="font-mono font-bold text-primary">
                      {{
                        formatCurrency(item.total || item.totalPrice || item.quantity * item.price)
                      }}
                    </span>
                  </div>
                </div>
                <div class="bg-primary/10 p-3 rounded-lg">
                  <div class="flex justify-between items-center">
                    <span class="font-bold">Total</span>
                    <span class="font-mono font-bold text-primary text-lg">
                      {{ formatCurrency(quotation.totalAmount) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="quotation.notes" class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Catatan</h2>
              <p class="whitespace-pre-wrap">{{ quotation.notes }}</p>
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
                  <span class="text-base-content/60">Total Item</span>
                  <span>{{ quotation.items?.length || 0 }}</span>
                </div>
                <div class="divider my-1"></div>
                <div class="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span class="text-primary">{{ formatCurrency(quotation.totalAmount) }}</span>
                </div>
              </div>

              <div class="divider"></div>

              <h3 class="font-semibold">Timeline</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Dibuat</span>
                  <span>{{ formatDate(quotation.createdAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Diupdate</span>
                  <span>{{ formatDate(quotation.updatedAt) }}</span>
                </div>
              </div>

              <!-- Link to Project if approved -->
              <div v-if="quotation.project" class="mt-4">
                <NuxtLink
                  :to="`/projects/${quotation.project.id}`"
                  class="btn btn-primary btn-block"
                >
                  Lihat Proyek →
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Approve Modal with Date Selection -->
    <dialog class="modal" :class="{ 'modal-open': showApproveModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Setujui Penawaran</h3>
        <p class="text-base-content/60 mb-4">Proyek baru akan dibuat dari penawaran ini.</p>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Tanggal Proyek</span>
          </label>
          <input v-model="approveProjectDate" type="date" class="input input-bordered w-full" />
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="showApproveModal = false" :disabled="!!processing">
            Batal
          </button>
          <button class="btn btn-success" @click="confirmApprove" :disabled="!!processing">
            <span
              v-if="processing === 'approving'"
              class="loading loading-spinner loading-sm"
            ></span>
            Ya, Setujui
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showApproveModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()
const { confirm } = useConfirm()

const {
  data: quotation,
  pending,
  error,
  refresh,
} = await useFetch(`/api/quotations/${route.params.id}`)

const processing = ref<string | null>(null)
const showApproveModal = ref(false)
const approveProjectDate = ref(new Date().toISOString().split('T')[0])

const isExpired = computed(() => {
  if (!quotation.value) return false
  return dayjs((quotation.value as any).validUntil).isBefore(dayjs())
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SENT: 'Terkirim',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'badge-ghost',
    SENT: 'badge-info',
    APPROVED: 'badge-success',
    REJECTED: 'badge-error',
  }
  return classes[status] || 'badge-ghost'
}

const sendQuotation = async () => {
  processing.value = 'sending'
  try {
    await $fetch(`/api/quotations/${route.params.id}/send`, { method: 'POST' })
    showAlert('Penawaran berhasil dikirim', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengirim penawaran', 'error')
  } finally {
    processing.value = null
  }
}

const rejectQuotation = async () => {
  const isConfirmed = await confirm({
    title: 'Tolak Penawaran',
    message: 'Apakah Anda yakin ingin menolak penawaran ini?',
    confirmText: 'Ya, Tolak',
    type: 'error',
  })
  if (!isConfirmed) return

  processing.value = 'rejecting'
  try {
    await $fetch(`/api/quotations/${route.params.id}/reject`, { method: 'POST' })
    showAlert('Penawaran berhasil ditolak', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menolak penawaran', 'error')
  } finally {
    processing.value = null
  }
}

const approveQuotation = () => {
  // Reset date to today when opening modal
  approveProjectDate.value = new Date().toISOString().split('T')[0]
  showApproveModal.value = true
}

const confirmApprove = async () => {
  processing.value = 'approving'
  try {
    const result = await $fetch(`/api/quotations/${route.params.id}/approve`, {
      method: 'POST',
      body: {
        projectDate: approveProjectDate.value,
      },
    })
    showAlert('Penawaran berhasil disetujui', 'success')
    showApproveModal.value = false
    await navigateTo(`/projects/${(result as any).id}`)
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyetujui penawaran', 'error')
  } finally {
    processing.value = null
  }
}

// PDF Generator
const { downloadQuotationPdf, generating: generatingPdf } = usePdfGenerator()

const printQuotation = async () => {
  if (!quotation.value) return
  await downloadQuotationPdf(quotation.value, `Quotation-${(quotation.value as any).quotationNo}`)
}
</script>
