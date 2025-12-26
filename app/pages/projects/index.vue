<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Proyek</h1>
        <p class="text-base-content/60">Kelola semua proyek</p>
      </div>
    </div>

    <!-- Search & Filters -->
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
                  placeholder="Cari proyek..."
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
        class="card bg-base-100 shadow card-hover cursor-pointer border border-base-200"
        @click="navigateTo(`/projects/${project.id}`)"
      >
        <div class="card-body p-5">
          <div class="flex justify-between items-start mb-2">
            <span class="badge" :class="getStatusClass(project.status)">
              {{ getStatusLabel(project.status) }}
            </span>
            <span class="text-xs font-mono text-base-content/60">{{ project.projectNumber }}</span>
          </div>

          <h2 class="card-title text-lg mb-1">{{ project.title }}</h2>
          <p class="text-sm text-base-content/70 line-clamp-2 mb-4">
            {{ project.description || 'Tidak ada deskripsi' }}
          </p>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-base-content/60">Pelanggan</span>
              <span class="font-medium">{{ project.customer?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/60">Budget</span>
              <span class="font-medium">{{ formatCurrency(project.budget) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/60">Dibuat</span>
              <span>{{ formatDate(project.createdAt) }}</span>
            </div>
          </div>
        </div>
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
                <td class="text-right font-mono">{{ formatCurrency(project.budget) }}</td>
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
  }
  return labels[s] || s
}
</script>
