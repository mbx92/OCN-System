<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Proyek Saya</h1>
      <p class="text-base-content/60">Daftar semua proyek yang ditugaskan kepada Anda</p>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow mb-4">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Status Filter -->
          <select v-model="statusFilter" class="select select-bordered flex-1">
            <option value="">Semua Status</option>
            <option value="APPROVED">Disetujui</option>
            <option value="PROCUREMENT">Pengadaan</option>
            <option value="ONGOING">Berlangsung</option>
            <option value="COMPLETED">Selesai</option>
          </select>

          <!-- Payment Status Filter -->
          <select v-model="paymentFilter" class="select select-bordered flex-1">
            <option value="">Semua Pembayaran</option>
            <option value="PAID">Sudah Dibayar</option>
            <option value="UNPAID">Belum Dibayar</option>
          </select>

          <!-- Search -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari proyek atau pelanggan..."
            class="input input-bordered flex-1"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Projects List -->
    <div v-else-if="filteredProjects.length > 0" class="grid gap-4">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateTo(`/technician/projects/${project.projectId}`)"
      >
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="card-title">{{ project.projectName }}</h3>
                <div class="badge" :class="getStatusClass(project.status)">
                  {{ getStatusLabel(project.status) }}
                </div>
              </div>
              <p class="text-sm text-base-content/60 mb-2">{{ project.projectCode }}</p>
              <p class="text-sm mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {{ project.customer }}
              </p>
              <p v-if="project.description" class="text-sm text-base-content/70 line-clamp-2">
                {{ project.description }}
              </p>
            </div>

            <div class="text-right">
              <div class="text-lg font-bold text-primary">
                {{ formatCurrency(project.fee) }}
              </div>
              <div v-if="project.isPaid" class="badge badge-success gap-1 mt-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Dibayar
              </div>
              <div v-else class="badge badge-warning gap-1 mt-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Belum Dibayar
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 text-xs text-base-content/60 mt-4 pt-4 border-t">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 inline"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {{ formatDate(project.createdAt) }}
            </div>
            <div v-if="project.updatedAt">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 inline"
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
              {{ formatDate(project.updatedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body items-center text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-16 h-16 text-base-content/30 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h3 class="text-xl font-semibold mb-2">Tidak ada proyek</h3>
        <p class="text-base-content/60">Belum ada proyek yang ditugaskan kepada Anda</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { formatCurrency, formatDate } = useFormatter()

// Filters
const statusFilter = ref('')
const paymentFilter = ref('')
const searchQuery = ref('')

// Fetch projects
const {
  data: projects,
  pending,
  refresh,
} = await useFetch('/api/technician/my-projects', {
  query: { limit: 100 },
})

// Filtered projects
const filteredProjects = computed(() => {
  if (!projects.value) return []

  return projects.value.filter((project: any) => {
    // Status filter
    if (statusFilter.value && project.status !== statusFilter.value) {
      return false
    }

    // Payment filter
    if (paymentFilter.value === 'PAID' && !project.isPaid) {
      return false
    }
    if (paymentFilter.value === 'UNPAID' && project.isPaid) {
      return false
    }

    // Search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      return (
        project.projectName.toLowerCase().includes(query) ||
        project.projectCode.toLowerCase().includes(query) ||
        project.customer.toLowerCase().includes(query)
      )
    }

    return true
  })
})

// Status helpers
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    APPROVED: 'Disetujui',
    PROCUREMENT: 'Pengadaan',
    ONGOING: 'Berlangsung',
    COMPLETED: 'Selesai',
    PAID: 'Dibayar',
    CLOSED: 'Ditutup',
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    APPROVED: 'badge-info',
    PROCUREMENT: 'badge-warning',
    ONGOING: 'badge-primary',
    COMPLETED: 'badge-success',
    PAID: 'badge-success',
    CLOSED: 'badge-ghost',
  }
  return classes[status] || 'badge-ghost'
}
</script>
