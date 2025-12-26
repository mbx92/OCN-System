<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Penawaran</h1>
        <p class="text-base-content/60">Kelola penawaran harga</p>
      </div>
      <NuxtLink to="/quotations/create" class="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
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
        Buat Penawaran
      </NuxtLink>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-4">
        <div class="flex flex-col gap-4">
          <!-- Top row: View Toggle and Search on mobile -->
          <div class="flex flex-row gap-4 items-center">
            <!-- View Toggle - Left on all screens -->
            <div class="flex-none">
              <AppViewToggle v-model="viewMode" />
            </div>

            <!-- Search -->
            <div class="flex-1">
              <div class="relative">
                <input
                  v-model="search"
                  type="text"
                  placeholder="Cari penawaran..."
                  class="input input-bordered w-full pl-10"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Status Filter -->
          <div class="w-full sm:w-auto">
            <select v-model="status" class="select select-bordered w-full sm:w-auto">
              <option v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
                {{ tab.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Quotation List -->
    <div v-if="pending" class="col-span-full text-center py-8">
      <span class="loading loading-spinner"></span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!quotations?.length"
      class="col-span-full text-center py-12 text-base-content/60"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-16 w-16 mx-auto mb-4 opacity-50"
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
      <p class="text-lg">Belum ada penawaran</p>
      <NuxtLink to="/quotations/create" class="btn btn-primary mt-4">
        Buat Penawaran Pertama
      </NuxtLink>
    </div>

    <!-- Grid Layout -->
    <div
      v-else-if="viewMode === 'GRID'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="quotation in quotations"
        :key="quotation.id"
        class="card bg-base-100 shadow card-hover cursor-pointer h-full"
        @click="navigateTo(`/quotations/${quotation.id}`)"
      >
        <div class="card-body">
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-mono text-sm text-base-content/60">
                  {{ quotation.quotationNo }}
                </span>
                <h3 class="font-semibold">{{ quotation.customer?.name }}</h3>
              </div>
              <span class="badge" :class="getStatusClass(quotation.status)">
                {{ getStatusLabel(quotation.status) }}
              </span>
            </div>

            <p v-if="quotation.title" class="text-sm text-base-content/60 line-clamp-2">
              {{ quotation.title }}
            </p>
          </div>

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

          <div class="mt-2 min-h-[1.25rem] flex items-center justify-between">
            <NuxtLink
              v-if="quotation.project"
              :to="`/projects/${quotation.project.id}`"
              class="link link-primary text-sm"
              @click.stop
            >
              → {{ quotation.project.projectNumber }}
            </NuxtLink>
            <span v-else></span>
            <NuxtLink
              v-if="quotation.status === 'DRAFT'"
              :to="`/quotations/${quotation.id}/edit`"
              class="btn btn-ghost btn-xs"
              @click.stop
            >
              Edit
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- List Layout -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-lg shadow border border-base-200">
      <table class="table">
        <thead>
          <tr>
            <th>Status</th>
            <th>No. Penawaran</th>
            <th>Pelanggan</th>
            <th>Total</th>
            <th>Berlaku Sampai</th>
            <th>Proyek</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="quotation in quotations" :key="quotation.id" class="hover">
            <td>
              <span class="badge badge-sm" :class="getStatusClass(quotation.status)">
                {{ getStatusLabel(quotation.status) }}
              </span>
            </td>
            <td class="font-mono text-xs">{{ quotation.quotationNo }}</td>
            <td class="font-bold">{{ quotation.customer?.name }}</td>
            <td class="font-mono">{{ formatCurrency(quotation.totalAmount) }}</td>
            <td>
              <span :class="{ 'text-error': isExpired(quotation.validUntil) }">
                {{ formatDate(quotation.validUntil) }}
              </span>
            </td>
            <td>
              <NuxtLink
                v-if="quotation.project"
                :to="`/projects/${quotation.project.id}`"
                class="link link-primary text-xs"
              >
                {{ quotation.project.projectNumber }}
              </NuxtLink>
              <span v-else class="text-xs text-base-content/40">-</span>
            </td>
            <td>
              <div class="flex gap-1">
                <NuxtLink
                  v-if="quotation.status === 'DRAFT'"
                  :to="`/quotations/${quotation.id}/edit`"
                  class="btn btn-ghost btn-xs"
                  @click.stop
                >
                  Edit
                </NuxtLink>
                <button
                  class="btn btn-ghost btn-xs"
                  @click="navigateTo(`/quotations/${quotation.id}`)"
                >
                  Detail
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="quotationsData?.meta?.total" class="p-4 border-t border-base-200">
      <AppPagination
        :total="quotationsData.meta.total"
        :per-page="10"
        v-model:current-page="page"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const { formatCurrency, formatDate } = useFormatter()

const status = ref('')
const search = ref('')
const page = ref(1)

const statusTabs = [
  { label: 'Semua', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Terkirim', value: 'SENT' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' },
]

const { data: quotationsData, pending } = await useFetch('/api/quotations', {
  query: { status, search, page, limit: 10 },
  watch: [status, search, page],
})

const quotations = computed(() => quotationsData.value?.data || [])

const viewMode = ref<'GRID' | 'LIST'>('GRID')

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
