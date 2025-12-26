<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold">Dashboard Teknisi</h1>
      <ClientOnly>
        <p class="text-base-content/60">Selamat datang, {{ user?.name }}</p>
        <template #fallback>
          <p class="text-base-content/60">Selamat datang</p>
        </template>
      </ClientOnly>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-figure text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
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
          </div>
          <div class="stat-title">Proyek Aktif</div>
          <div class="stat-value text-primary">{{ stats.activeProjects }}</div>
        </div>
      </div>

      <div class="stats shadow">
        <div class="stat">
          <div class="stat-figure text-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
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
          </div>
          <div class="stat-title">Selesai Bulan Ini</div>
          <div class="stat-value text-success">{{ stats.completedThisMonth }}</div>
        </div>
      </div>

      <div class="stats shadow">
        <div class="stat">
          <div class="stat-figure text-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
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
          </div>
          <div class="stat-title">Pending</div>
          <div class="stat-value text-warning">{{ stats.pendingTasks }}</div>
        </div>
      </div>

      <div class="stats shadow">
        <div class="stat">
          <div class="stat-figure text-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="stat-title">Penghasilan Bulan Ini</div>
          <div class="stat-value text-info text-lg">{{ formatCurrency(stats.earnings) }}</div>
        </div>
      </div>
    </div>

    <!-- My Projects -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-4 sm:p-6">
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4"
        >
          <h2 class="text-lg font-bold">Proyek Saya</h2>
          <AppViewToggle v-model="viewMode" />
        </div>

        <div v-if="loading" class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!myProjects?.length" class="text-center py-12 text-base-content/60">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p class="text-lg">Belum ada proyek yang ditugaskan</p>
        </div>

        <!-- Grid View -->
        <div
          v-else-if="viewMode === 'GRID'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="project in myProjects"
            :key="project.id"
            @click="navigateTo(`/projects/${project.id}`)"
            class="card bg-base-200 hover:bg-base-300 transition-all cursor-pointer"
          >
            <div class="card-body p-4">
              <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                  <h3 class="font-mono text-sm font-bold">{{ project.projectNumber }}</h3>
                  <p class="text-sm font-medium mt-1 line-clamp-2">{{ project.title }}</p>
                </div>
                <span
                  class="badge badge-xs sm:badge-sm flex-shrink-0 ml-2"
                  :class="getStatusClass(project.status)"
                >
                  {{ getStatusLabel(project.status) }}
                </span>
              </div>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between items-center">
                  <span class="text-base-content/60">Pelanggan</span>
                  <span class="text-xs font-medium">{{ project.customer?.name }}</span>
                </div>

                <div class="flex justify-between items-center pt-2 border-t border-base-300">
                  <span class="text-base-content/60">Deadline</span>
                  <span class="text-xs">{{ formatDate(project.endDate) }}</span>
                </div>
              </div>

              <div class="card-actions justify-end mt-3">
                <button class="btn btn-ghost btn-xs sm:btn-sm w-full">Lihat Detail</button>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-else class="overflow-x-auto">
          <table class="table table-sm sm:table-md">
            <thead>
              <tr>
                <th>No. Proyek</th>
                <th>Judul</th>
                <th>Pelanggan</th>
                <th>Status</th>
                <th>Deadline</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="project in myProjects" :key="project.id" class="hover">
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
                <td>{{ formatDate(project.endDate) }}</td>
                <td class="text-right">
                  <NuxtLink :to="`/projects/${project.id}`" class="btn btn-ghost btn-sm">
                    Detail
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Recent Activities -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Aktivitas Terbaru</h2>

        <div class="text-center py-12 text-base-content/60">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>Belum ada aktivitas</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { formatCurrency, formatDate } = useFormatter()

const loading = ref(false)
// Default to GRID on mobile, LIST on desktop
const viewMode = ref<'LIST' | 'GRID'>(
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'GRID' : 'LIST'
)

const stats = ref({
  activeProjects: 0,
  completedThisMonth: 0,
  pendingTasks: 0,
  earnings: 0,
})

const myProjects = ref<any[]>([])

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    QUOTATION: 'Penawaran',
    APPROVED: 'Disetujui',
    ONGOING: 'Dikerjakan',
    COMPLETED: 'Selesai',
    PAID: 'Lunas',
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    QUOTATION: 'badge-info',
    APPROVED: 'badge-success',
    ONGOING: 'badge-warning',
    COMPLETED: 'badge-primary',
    PAID: 'badge-accent',
  }
  return classes[status] || 'badge-ghost'
}

onMounted(async () => {
  loading.value = true
  try {
    // TODO: Replace with actual API calls
    // const { data: statsData } = await useFetch('/api/technician/stats')
    // const { data: projectsData } = await useFetch('/api/technician/projects')
    // stats.value = statsData.value
    // myProjects.value = projectsData.value
  } catch (error) {
    console.error('Failed to load technician data:', error)
  } finally {
    loading.value = false
  }
})
</script>
