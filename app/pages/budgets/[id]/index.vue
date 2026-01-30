<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else-if="budget">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div class="flex items-center gap-4">
          <NuxtLink to="/budgets" class="btn btn-ghost btn-sm">
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </NuxtLink>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold">{{ budget.budgetNumber }}</h1>
              <span class="badge" :class="getStatusClass(budget.status)">
                {{ getStatusLabel(budget.status) }}
              </span>
            </div>
            <p class="text-base-content/60">{{ budget.title }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2">
          <!-- Download PDF -->
          <a :href="`/api/budgets/${budget.id}/pdf`" target="_blank" class="btn btn-outline btn-sm">
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </a>

          <!-- Edit (DRAFT/REJECTED only) -->
          <NuxtLink
            v-if="['DRAFT', 'REJECTED'].includes(budget.status)"
            :to="`/budgets/${budget.id}/edit`"
            class="btn btn-outline btn-sm"
          >
            Edit
          </NuxtLink>

          <!-- Submit for Approval (DRAFT only) -->
          <button
            v-if="budget.status === 'DRAFT'"
            @click="submitForApproval"
            class="btn btn-warning btn-sm"
            :disabled="actionLoading"
          >
            <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
            Submit untuk Approval
          </button>

          <!-- Approve (PENDING, ADMIN/OWNER only) -->
          <button
            v-if="budget.status === 'PENDING' && canApprove"
            @click="approveBudget"
            class="btn btn-success btn-sm"
            :disabled="actionLoading"
          >
            <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
            Approve
          </button>

          <!-- Reject (PENDING, ADMIN/OWNER only) -->
          <button
            v-if="budget.status === 'PENDING' && canApprove"
            @click="showRejectDialog = true"
            class="btn btn-error btn-sm"
            :disabled="actionLoading"
          >
            Reject
          </button>

          <!-- Convert to Quotation (APPROVED only) -->
          <button
            v-if="budget.status === 'APPROVED'"
            @click="convertToQuotation"
            class="btn btn-primary btn-sm"
            :disabled="actionLoading || !budget.customerId"
          >
            <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
            Convert ke Penawaran
          </button>

          <!-- Delete (DRAFT/REJECTED only) -->
          <button
            v-if="['DRAFT', 'REJECTED'].includes(budget.status)"
            @click="deleteBudget"
            class="btn btn-ghost btn-sm text-error"
            :disabled="actionLoading"
          >
            Hapus
          </button>
        </div>
      </div>

      <!-- Rejection Note -->
      <div v-if="budget.status === 'REJECTED' && budget.rejectionNote" class="alert alert-error">
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
        <div>
          <p class="font-bold">Alasan Penolakan:</p>
          <p>{{ budget.rejectionNote }}</p>
        </div>
      </div>

      <!-- Warning: No Customer -->
      <div v-if="budget.status === 'APPROVED' && !budget.customerId" class="alert alert-warning">
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
          Budget harus memiliki pelanggan untuk diconvert ke penawaran. Silakan edit budget.
        </span>
      </div>

      <!-- Converted Quotation Link -->
      <div v-if="budget.quotation" class="alert alert-info">
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Budget ini sudah diconvert ke penawaran
          <NuxtLink :to="`/quotations/${budget.quotation.id}`" class="link font-bold">
            {{ budget.quotation.quotationNo }}
          </NuxtLink>
        </span>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Info -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Informasi</h2>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-base-content/60">Pelanggan</p>
                  <p class="font-medium">
                    {{ budget.customer?.name || '-' }}
                    <span v-if="budget.customer?.companyName" class="text-base-content/60">
                      ({{ budget.customer.companyName }})
                    </span>
                  </p>
                </div>
                <div>
                  <p class="text-sm text-base-content/60">Tanggal Dibuat</p>
                  <p class="font-medium">{{ formatDate(budget.createdAt) }}</p>
                </div>
                <div v-if="budget.description" class="sm:col-span-2">
                  <p class="text-sm text-base-content/60">Deskripsi</p>
                  <p class="font-medium">{{ budget.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Item Budget</h2>

              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th class="text-center">Qty</th>
                      <th class="text-right">Modal</th>
                      <th class="text-right">Jual</th>
                      <th class="text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in budget.items" :key="item.id">
                      <td>
                        <div class="font-medium">{{ item.name }}</div>
                        <div v-if="item.description" class="text-xs text-base-content/60">
                          {{ item.description }}
                        </div>
                      </td>
                      <td class="text-center">{{ item.quantity }} {{ item.unit }}</td>
                      <td class="text-right font-mono text-base-content/70">
                        {{ formatCurrency(item.totalCost) }}
                      </td>
                      <td class="text-right font-mono font-bold text-primary">
                        {{ formatCurrency(item.totalPrice) }}
                      </td>
                      <td class="text-right">
                        <span
                          class="font-mono text-sm"
                          :class="Number(item.margin) >= 0 ? 'text-success' : 'text-error'"
                        >
                          {{ formatCurrency(item.margin) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-base-200">
                    <tr>
                      <th colspan="2">Total</th>
                      <th class="text-right font-mono">{{ formatCurrency(budget.totalCost) }}</th>
                      <th class="text-right font-mono text-primary">
                        {{ formatCurrency(budget.totalPrice) }}
                      </th>
                      <th class="text-right font-mono text-success">
                        {{ formatCurrency(budget.marginAmount) }}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="budget.notes" class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Catatan</h2>
              <p class="whitespace-pre-wrap">{{ budget.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow sticky top-20">
            <div class="card-body">
              <h2 class="card-title">Ringkasan</h2>

              <div class="space-y-3 mt-4">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Total Modal</span>
                  <span class="font-mono">{{ formatCurrency(budget.totalCost) }}</span>
                </div>

                <div class="flex justify-between">
                  <span class="text-base-content/60">Total Harga Jual</span>
                  <span class="font-mono font-bold text-primary text-lg">
                    {{ formatCurrency(budget.totalPrice) }}
                  </span>
                </div>

                <div class="divider my-2"></div>

                <div class="flex justify-between">
                  <span class="text-base-content/60">Margin (Rp)</span>
                  <span
                    class="font-mono font-bold"
                    :class="Number(budget.marginAmount) >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(budget.marginAmount) }}
                  </span>
                </div>

                <div class="flex justify-between items-center">
                  <span class="text-base-content/60">Margin (%)</span>
                  <span
                    class="badge badge-lg"
                    :class="Number(budget.marginPercent) >= 20 ? 'badge-success' : 'badge-warning'"
                  >
                    {{ Number(budget.marginPercent).toFixed(1) }}%
                  </span>
                </div>

                <div class="divider my-2"></div>

                <div class="text-xs text-base-content/50">
                  <div>Jumlah Item: {{ budget.items?.length || 0 }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Reject Dialog -->
    <dialog ref="rejectDialog" class="modal" :class="{ 'modal-open': showRejectDialog }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Tolak Budget</h3>
        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">Alasan Penolakan *</span>
          </label>
          <textarea
            v-model="rejectReason"
            placeholder="Masukkan alasan penolakan..."
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>
        <div class="modal-action">
          <button @click="showRejectDialog = false" class="btn btn-ghost">Batal</button>
          <button
            @click="rejectBudget"
            class="btn btn-error"
            :disabled="!rejectReason || actionLoading"
          >
            <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
            Tolak
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showRejectDialog = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Confirm Dialog -->
    <AppConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()
const { success, error: showError } = useAlert()
const { user } = useAuth()

const budgetId = route.params.id as string
const actionLoading = ref(false)
const showRejectDialog = ref(false)
const rejectReason = ref('')
const confirmDialog = ref()

// Fetch budget
const { data: budget, pending, refresh } = await useFetch(`/api/budgets/${budgetId}`)

// Check if user can approve
const canApprove = computed(() => {
  return user.value?.role === 'ADMIN' || user.value?.role === 'OWNER'
})

// Status helpers
const getStatusClass = (s: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'badge-ghost',
    PENDING: 'badge-warning',
    APPROVED: 'badge-success',
    REJECTED: 'badge-error',
    CONVERTED: 'badge-info',
  }
  return classes[s] || 'badge-ghost'
}

const getStatusLabel = (s: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING: 'Menunggu Approval',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    CONVERTED: 'Sudah Diconvert',
  }
  return labels[s] || s
}

// Actions
const submitForApproval = async () => {
  actionLoading.value = true
  try {
    await $fetch(`/api/budgets/${budgetId}/submit`, { method: 'POST' })
    success('Budget berhasil disubmit untuk approval')
    await refresh()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal submit budget')
  } finally {
    actionLoading.value = false
  }
}

const approveBudget = async () => {
  actionLoading.value = true
  try {
    await $fetch(`/api/budgets/${budgetId}/approve`, { method: 'POST' })
    success('Budget berhasil diapprove')
    await refresh()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal approve budget')
  } finally {
    actionLoading.value = false
  }
}

const rejectBudget = async () => {
  if (!rejectReason.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/budgets/${budgetId}/reject`, {
      method: 'POST',
      body: { reason: rejectReason.value },
    })
    success('Budget berhasil ditolak')
    showRejectDialog.value = false
    rejectReason.value = ''
    await refresh()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal reject budget')
  } finally {
    actionLoading.value = false
  }
}

const convertToQuotation = async () => {
  const confirmed = await confirmDialog.value?.show({
    title: 'Convert ke Penawaran',
    message: 'Apakah Anda yakin ingin mengconvert budget ini ke penawaran?',
    confirmText: 'Convert',
    confirmClass: 'btn-primary',
  })

  if (!confirmed) return

  actionLoading.value = true
  try {
    const result = await $fetch(`/api/budgets/${budgetId}/convert`, { method: 'POST' })
    success('Budget berhasil diconvert ke penawaran')
    await navigateTo(`/quotations/${(result as any).quotation.id}`)
  } catch (err: any) {
    showError(err.data?.message || 'Gagal convert budget')
  } finally {
    actionLoading.value = false
  }
}

const deleteBudget = async () => {
  const confirmed = await confirmDialog.value?.show({
    title: 'Hapus Budget',
    message: 'Apakah Anda yakin ingin menghapus budget ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Hapus',
    confirmClass: 'btn-error',
  })

  if (!confirmed) return

  actionLoading.value = true
  try {
    await $fetch(`/api/budgets/${budgetId}`, { method: 'DELETE' })
    success('Budget berhasil dihapus')
    await navigateTo('/budgets')
  } catch (err: any) {
    showError(err.data?.message || 'Gagal hapus budget')
  } finally {
    actionLoading.value = false
  }
}
</script>
