<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Proyek</h1>
        <p class="text-base-content/60">Kelola semua proyek</p>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- View Toggle -->
          <div class="flex-none">
            <AppViewToggle v-model="viewMode" />
          </div>

          <!-- Search -->
          <div class="flex-1">
            <div class="form-control">
              <input
                v-model="search"
                type="text"
                placeholder="Cari proyek..."
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-3 lg:flex-none lg:w-auto">
            <div class="form-control w-full sm:w-48">
              <select v-model="status" class="select select-bordered w-full">
                <option v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
                  {{ tab.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Grid -->
    <div v-if="viewMode === 'GRID'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="pending" class="col-span-full text-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div
        v-else-if="!projects?.data?.length"
        class="col-span-full text-center py-12 text-base-content/60"
      >
        <p>Belum ada proyek</p>
      </div>

      <div
        v-for="project in projects?.data"
        :key="project.id"
        class="card bg-base-100 shadow hover:shadow-md transition-shadow cursor-pointer"
        @click="navigateTo(`/projects/${project.id}`)"
      >
        <div class="card-body p-5">
          <div class="flex justify-between items-start mb-2">
            <span class="badge" :class="getStatusClass(project.status)">
              {{ getStatusLabel(project.status) }}
            </span>
            <span class="text-xs font-mono text-base-content/60">{{ project.projectNumber }}</span>
          </div>

          <h2 class="font-bold text-lg mb-1">{{ project.title }}</h2>
          <p class="text-sm text-base-content/70 line-clamp-2 mb-4">
            {{ project.description || 'Tidak ada deskripsi' }}
          </p>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-base-content/60">Pelanggan</span>
              <span class="font-medium">{{ project.customer?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/60">Total Nilai</span>
              <span class="font-medium font-mono">{{ formatCurrency(project.totalAmount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/60">Dibuat</span>
              <span>{{ formatDate(project.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination for Grid View -->
    <div v-if="viewMode === 'GRID' && projects?.meta?.totalPages > 1" class="flex justify-center">
      <div class="join">
        <button class="join-item btn btn-sm" :disabled="page <= 1" @click="page--">«</button>
        <button class="join-item btn btn-sm">
          Halaman {{ page }} dari {{ projects?.meta?.totalPages }}
        </button>
        <button
          class="join-item btn btn-sm"
          :disabled="page >= projects?.meta?.totalPages"
          @click="page++"
        >
          »
        </button>
      </div>
    </div>

    <!-- Project List -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>No. Proyek</th>
                <th>Judul</th>
                <th>Pelanggan</th>
                <th>Status</th>
                <th class="text-right">Budget</th>
                <th class="text-right">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pending" class="text-center">
                <td colspan="6" class="py-8">
                  <span class="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
              <tr v-else-if="!projects?.data?.length" class="text-center">
                <td colspan="6" class="py-8 text-base-content/60">
                  <p>Belum ada proyek</p>
                </td>
              </tr>
              <tr
                v-for="project in projects?.data"
                :key="project.id"
                class="hover cursor-pointer"
                @click="navigateTo(`/projects/${project.id}`)"
              >
                <td class="font-mono text-sm">{{ project.projectNumber }}</td>
                <td>
                  <p class="font-medium max-w-xs truncate">{{ project.title }}</p>
                </td>
                <td>{{ project.customer?.name }}</td>
                <td>
                  <span class="badge" :class="getStatusClass(project.status)">
                    {{ getStatusLabel(project.status) }}
                  </span>
                </td>
                <td class="text-right font-mono">{{ formatCurrency(project.totalAmount) }}</td>
                <td class="text-right text-sm text-base-content/60">
                  {{ formatDate(project.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="projects?.meta?.totalPages > 1"
          class="flex justify-center p-4 border-t border-base-200"
        >
          <div class="join">
            <button class="join-item btn btn-sm" :disabled="page <= 1" @click="page--">«</button>
            <button class="join-item btn btn-sm">
              Halaman {{ page }} dari {{ projects?.meta?.totalPages }}
            </button>
            <button
              class="join-item btn btn-sm"
              :disabled="page >= projects?.meta?.totalPages"
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
const { formatCurrency, formatDate } = useFormatter()

const status = ref('all')
const page = ref(1)
const search = ref('')
const viewMode = ref<'GRID' | 'LIST'>('GRID')

const statusTabs = [
  { label: 'Semua', value: 'all' },
  { label: 'Penawaran', value: 'QUOTATION' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Dikerjakan', value: 'ONGOING' },
  { label: 'Selesai', value: 'COMPLETED' },
  { label: 'Lunas', value: 'PAID' },
  { label: 'Dibatalkan', value: 'CANCELLED' },
]

const { data: projects, pending } = await useFetch('/api/projects', {
  query: { status, page, limit: 10, search },
  watch: [status, page, search], // basic watching, can separate for debounce if needed but native input lazy or useDebounceFn is better for perf.
  // Using direct watch on search for now as it's simple enough for this user.
})

const getStatusClass = (s: string) => {
  const classes: Record<string, string> = {
    QUOTATION: 'badge-ghost',
    APPROVED: 'badge-info',
    PROCUREMENT: 'badge-warning',
    ONGOING: 'badge-primary',
    COMPLETED: 'badge-success',
    PAID: 'badge-success',
    CLOSED: 'badge-neutral',
    CANCELLED: 'badge-error',
  }
  return classes[s] || 'badge-ghost'
}

const getStatusLabel = (s: string) => {
  const labels: Record<string, string> = {
    QUOTATION: 'Penawaran',
    APPROVED: 'Disetujui',
    PROCUREMENT: 'Pengadaan',
    ONGOING: 'Dikerjakan',
    COMPLETED: 'Selesai',
    PAID: 'Lunas',
    CLOSED: 'Ditutup',
    CANCELLED: 'Dibatalkan',
  }
  return labels[s] || s
}
</script>
