<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
    >
      <div>
        <h1 class="text-xl sm:text-2xl font-bold">Budgeting</h1>
        <p class="text-sm sm:text-base text-base-content/60">
          Perencanaan anggaran sebelum membuat penawaran
        </p>
      </div>
      <NuxtLink to="/budgets/create" class="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 sm:h-5 sm:w-5"
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
        <span class="sm:hidden">Buat</span>
        <span class="hidden sm:inline">Buat Budget</span>
      </NuxtLink>
    </div>

    <!-- Search & Filter Card -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-3 sm:p-6">
        <div class="flex flex-col gap-3 sm:gap-4">
          <!-- Search -->
          <div class="form-control">
            <input
              v-model="search"
              type="text"
              placeholder="Cari budget..."
              class="input input-bordered input-sm sm:input-md w-full"
            />
          </div>

          <!-- Status Filter -->
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="form-control w-full sm:w-48">
              <select v-model="status" class="select select-bordered select-sm sm:select-md w-full">
                <option v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
                  {{ tab.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Budget List -->
    <div v-else class="grid gap-3 sm:gap-4">
      <div
        v-for="budget in budgets"
        :key="budget.id"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateTo(`/budgets/${budget.id}`)"
      >
        <div class="card-body p-3 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <!-- Left: Info -->
            <div class="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-bold text-base sm:text-lg">{{ budget.budgetNumber }}</h3>
                <span class="badge badge-sm sm:badge-md" :class="getStatusClass(budget.status)">
                  {{ getStatusLabel(budget.status) }}
                </span>
              </div>
              <p class="text-sm sm:text-base text-base-content/80 truncate">{{ budget.title }}</p>
              <p v-if="budget.customer" class="text-xs sm:text-sm text-base-content/60 truncate">
                {{ budget.customer.name }}
                <span
                  v-if="
                    budget.customer.companyName &&
                    budget.customer.companyName !== budget.customer.name
                  "
                >
                  - {{ budget.customer.companyName }}
                </span>
              </p>
              <p class="text-xs text-base-content/50">
                {{ formatDate(budget.createdAt) }}
              </p>
            </div>

            <!-- Right: Values -->
            <div
              class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-base-200"
            >
              <div class="flex flex-col sm:items-end">
                <div class="text-xs sm:text-sm text-base-content/60">
                  Modal:
                  <span class="font-mono">{{ formatCurrency(budget.totalCost) }}</span>
                </div>
                <div class="text-base sm:text-lg font-bold text-primary">
                  {{ formatCurrency(budget.totalPrice) }}
                </div>
              </div>
              <div
                class="badge badge-sm sm:badge-md"
                :class="Number(budget.marginPercent) >= 20 ? 'badge-success' : 'badge-warning'"
              >
                Margin {{ Number(budget.marginPercent).toFixed(1) }}%
              </div>

              <!-- Converted Quotation Link -->
              <NuxtLink
                v-if="budget.quotation"
                :to="`/quotations/${budget.quotation.id}`"
                class="text-xs link link-primary mt-1"
                @click.stop
              >
                → {{ budget.quotation.quotationNo }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="budgets.length === 0" class="card bg-base-100 shadow">
        <div class="card-body items-center text-center py-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 text-base-content/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <h3 class="text-lg font-bold mt-4">Belum ada budget</h3>
          <p class="text-base-content/60">Buat budget pertama untuk memulai perencanaan</p>
          <NuxtLink to="/budgets/create" class="btn btn-primary mt-4">Buat Budget Baru</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="budgetsData?.meta?.totalPages > 1" class="flex justify-center">
      <AppPagination :total="budgetsData.meta.total" :per-page="10" v-model:current-page="page" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()

const status = ref('')
const search = ref('')
const debouncedSearch = refDebounced(search, 500)
const page = ref(1)

const statusTabs = [
  { label: 'Semua', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Converted', value: 'CONVERTED' },
]

// Fetch budgets
const {
  data: budgetsData,
  pending,
  refresh,
} = await useFetch('/api/budgets', {
  query: {
    status,
    search: debouncedSearch,
    page,
    limit: 10,
  },
  watch: [status, debouncedSearch, page],
})

const budgets = computed(() => budgetsData.value?.data || [])

// Reset page when filters change
watch([status, debouncedSearch], () => {
  page.value = 1
})

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
</script>
