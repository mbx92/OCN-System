<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">Activity Logs</h1>
      <p class="text-base-content/60">Riwayat aktivitas pengguna di sistem</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4" v-if="stats">
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Total Aktivitas</div>
        <div class="stat-value text-primary text-2xl">{{ stats.total }}</div>
        <div class="stat-desc">{{ filterLabel }}</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Action Teratas</div>
        <div class="stat-value text-2xl">{{ stats.byAction[0]?.action || '-' }}</div>
        <div class="stat-desc">{{ stats.byAction[0]?.count || 0 }}x</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Entity Teratas</div>
        <div class="stat-value text-2xl">{{ stats.byEntity[0]?.entity || '-' }}</div>
        <div class="stat-desc">{{ stats.byEntity[0]?.count || 0 }}x</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">User Teraktif</div>
        <div class="stat-value text-2xl">{{ stats.topUsers[0]?.user?.name || '-' }}</div>
        <div class="stat-desc">{{ stats.topUsers[0]?.count || 0 }}x aktivitas</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="form-control">
              <input
                v-model="search"
                type="text"
                placeholder="Cari action atau entity..."
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-3 lg:flex-none lg:w-auto">
            <div class="form-control w-full sm:w-48">
              <select v-model="filterAction" class="select select-bordered w-full">
                <option value="">Semua Action</option>
                <option value="LOGIN">Login</option>
                <option value="CREATE_PROJECT">Create Project</option>
                <option value="APPROVE_PROJECT">Approve Project</option>
                <option value="COMPLETE_PROJECT">Complete Project</option>
                <option value="CREATE_PAYMENT">Create Payment</option>
                <option value="CREATE_PO">Create PO</option>
                <option value="RECEIVE_PO">Receive PO</option>
                <option value="CREATE_QUOTATION">Create Quotation</option>
                <option value="CREATE_ASSET">Create Asset</option>
                <option value="CREATE_EXPENSE">Create Expense</option>
              </select>
            </div>
            <div class="form-control w-full sm:w-48">
              <select v-model="filterEntity" class="select select-bordered w-full">
                <option value="">Semua Entity</option>
                <option value="Project">Project</option>
                <option value="Payment">Payment</option>
                <option value="PurchaseOrder">Purchase Order</option>
                <option value="Quotation">Quotation</option>
                <option value="Asset">Asset</option>
                <option value="Expense">Expense</option>
                <option value="Customer">Customer</option>
                <option value="Product">Product</option>
              </select>
            </div>
            <div class="form-control w-full sm:w-36">
              <input
                v-model="dateFrom"
                type="date"
                class="input input-bordered w-full"
                placeholder="Dari"
              />
            </div>
            <div class="form-control w-full sm:w-36">
              <input
                v-model="dateTo"
                type="date"
                class="input input-bordered w-full"
                placeholder="Sampai"
              />
            </div>
            <button @click="resetFilters" class="btn btn-ghost gap-1" title="Reset Filter">
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity List -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-lg">Riwayat Aktivitas</h2>

        <div v-if="pending" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!activities?.length" class="text-center py-8 text-base-content/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 mx-auto mb-2 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>Tidak ada aktivitas</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="activity in activities"
            :key="activity.id"
            class="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition-colors"
          >
            <div class="flex items-start gap-4">
              <!-- Icon -->
              <div class="shrink-0">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  :class="getActionColorClass(activity.action)"
                >
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
                      :d="getActionIcon(activity.action)"
                    />
                  </svg>
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <p class="font-semibold text-sm">
                      {{ activity.user.name }}
                      <span class="font-normal text-base-content/60">
                        {{ getActionLabel(activity.action) }}
                      </span>
                      <span v-if="activity.entity" class="font-medium">
                        {{ activity.entity }}
                      </span>
                    </p>
                    <div class="flex flex-wrap gap-2 mt-1">
                      <span class="badge badge-ghost badge-sm">
                        {{ formatDateTime(activity.createdAt) }}
                      </span>
                      <span v-if="activity.ipAddress" class="badge badge-ghost badge-sm font-mono">
                        {{ activity.ipAddress }}
                      </span>
                      <span v-if="activity.entityId" class="badge badge-ghost badge-sm">
                        ID: {{ activity.entityId.slice(0, 8) }}...
                      </span>
                    </div>
                  </div>

                  <!-- Metadata -->
                  <button
                    v-if="activity.metadata"
                    @click="toggleMetadata(activity.id)"
                    class="btn btn-ghost btn-xs"
                  >
                    {{ expandedMetadata[activity.id] ? 'Sembunyikan' : 'Detail' }}
                  </button>
                </div>

                <!-- Expanded Metadata -->
                <div
                  v-if="expandedMetadata[activity.id] && activity.metadata"
                  class="mt-3 p-3 bg-base-300 rounded text-xs font-mono overflow-x-auto"
                >
                  <pre>{{ JSON.stringify(activity.metadata, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="meta && meta.totalPages > 1" class="flex justify-center mt-6">
          <div class="join">
            <button class="join-item btn btn-sm" :disabled="page <= 1" @click="page--">«</button>
            <button class="join-item btn btn-sm">Halaman {{ page }} / {{ meta.totalPages }}</button>
            <button
              class="join-item btn btn-sm"
              :disabled="page >= meta.totalPages"
              @click="page++"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const search = ref('')
const filterAction = ref('')
const filterEntity = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const expandedMetadata = ref<Record<string, boolean>>({})

// Fetch activities
const {
  data: activitiesData,
  pending,
  refresh,
} = await useFetch('/api/activities', {
  query: {
    page,
    limit: 50,
    action: filterAction,
    entity: filterEntity,
    dateFrom,
    dateTo,
    search,
  },
  watch: [page, filterAction, filterEntity, dateFrom, dateTo, search],
})

const activities = computed(() => (activitiesData.value as any)?.data || [])
const meta = computed(() => (activitiesData.value as any)?.meta)

// Fetch stats
const { data: stats, refresh: refreshStats } = await useFetch('/api/activities/stats', {
  query: { dateFrom, dateTo },
  watch: [dateFrom, dateTo],
})

const filterLabel = computed(() => {
  if (dateFrom.value && dateTo.value) {
    return `${dateFrom.value} - ${dateTo.value}`
  }
  if (dateFrom.value) {
    return `Sejak ${dateFrom.value}`
  }
  if (dateTo.value) {
    return `Sampai ${dateTo.value}`
  }
  return 'Semua waktu'
})

const resetFilters = () => {
  search.value = ''
  filterAction.value = ''
  filterEntity.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  page.value = 1
}

const toggleMetadata = (id: string) => {
  expandedMetadata.value[id] = !expandedMetadata.value[id]
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    LOGIN: 'login ke sistem',
    LOGOUT: 'logout dari sistem',
    CREATE_PROJECT: 'membuat project',
    UPDATE_PROJECT: 'mengupdate project',
    APPROVE_PROJECT: 'menyetujui project',
    COMPLETE_PROJECT: 'menyelesaikan project',
    CREATE_PAYMENT: 'membuat pembayaran',
    CREATE_PO: 'membuat PO',
    SEND_PO: 'mengirim PO',
    RECEIVE_PO: 'menerima PO',
    CREATE_QUOTATION: 'membuat quotation',
    APPROVE_QUOTATION: 'menyetujui quotation',
    CREATE_ASSET: 'membuat asset',
    UPDATE_ASSET: 'mengupdate asset',
    DELETE_ASSET: 'menghapus asset',
    CREATE_EXPENSE: 'membuat expense',
    UPDATE_EXPENSE: 'mengupdate expense',
    DELETE_EXPENSE: 'menghapus expense',
  }
  return labels[action] || action.toLowerCase().replace('_', ' ')
}

const getActionColorClass = (action: string) => {
  if (action.includes('CREATE')) return 'bg-success/20 text-success'
  if (action.includes('UPDATE')) return 'bg-warning/20 text-warning'
  if (action.includes('DELETE')) return 'bg-error/20 text-error'
  if (action.includes('APPROVE')) return 'bg-info/20 text-info'
  if (action === 'LOGIN') return 'bg-primary/20 text-primary'
  return 'bg-base-300 text-base-content'
}

const getActionIcon = (action: string) => {
  if (action.includes('CREATE')) return 'M12 4v16m8-8H4'
  if (action.includes('UPDATE'))
    return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
  if (action.includes('DELETE'))
    return 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
  if (action.includes('APPROVE')) return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  if (action === 'LOGIN')
    return 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
  return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}
</script>
