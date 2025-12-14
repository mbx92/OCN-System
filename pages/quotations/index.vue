<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Penawaran</h1>
        <p class="text-base-content/60">Kelola penawaran harga</p>
      </div>
      <NuxtLink to="/quotations/create" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Buat Penawaran
      </NuxtLink>
    </div>

    <!-- Status Tabs -->
    <div class="tabs tabs-boxed bg-base-100 p-1 w-fit">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="tab"
        :class="{ 'tab-active': status === tab.value }"
        @click="status = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Quotation List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="pending" class="col-span-full text-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="!quotations?.length" class="col-span-full text-center py-12 text-base-content/60">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-lg">Belum ada penawaran</p>
        <NuxtLink to="/quotations/create" class="btn btn-primary mt-4">Buat Penawaran Pertama</NuxtLink>
      </div>

      <div
        v-for="quotation in quotations"
        :key="quotation.id"
        class="card bg-base-100 shadow card-hover cursor-pointer"
        @click="navigateTo(`/quotations/${quotation.id}`)"
      >
        <div class="card-body">
          <div class="flex justify-between items-start">
            <div>
              <span class="font-mono text-sm text-base-content/60">{{ quotation.quotationNo }}</span>
              <h3 class="font-semibold">{{ quotation.customer?.name }}</h3>
            </div>
            <span class="badge" :class="getStatusClass(quotation.status)">
              {{ getStatusLabel(quotation.status) }}
            </span>
          </div>

          <p v-if="quotation.title" class="text-sm text-base-content/60 line-clamp-2">{{ quotation.title }}</p>

          <div class="divider my-2"></div>

          <div class="flex justify-between text-sm">
            <span class="text-base-content/60">Total</span>
            <span class="font-bold">{{ formatCurrency(quotation.totalAmount) }}</span>
          </div>

          <div class="flex justify-between text-sm">
            <span class="text-base-content/60">Berlaku s/d</span>
            <span :class="{ 'text-error': isExpired(quotation.validUntil) }">
              {{ formatDate(quotation.validUntil) }}
            </span>
          </div>

          <div v-if="quotation.project" class="mt-2">
            <NuxtLink
              :to="`/projects/${quotation.project.id}`"
              class="link link-primary text-sm"
              @click.stop
            >
              → {{ quotation.project.projectNumber }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const { formatCurrency, formatDate } = useFormatter()

const status = ref('')

const statusTabs = [
  { label: 'Semua', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Terkirim', value: 'SENT' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' },
]

const { data: quotations, pending } = await useFetch('/api/quotations', {
  query: { status },
  watch: [status],
})

const getStatusClass = (s: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'badge-ghost',
    SENT: 'badge-info',
    APPROVED: 'badge-success',
    REJECTED: 'badge-error',
  }
  return classes[s] || 'badge-ghost'
}

const getStatusLabel = (s: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SENT: 'Terkirim',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  }
  return labels[s] || s
}

const isExpired = (date: string) => {
  return dayjs(date).isBefore(dayjs(), 'day')
}
</script>
