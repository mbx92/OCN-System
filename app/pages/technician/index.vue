<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Dashboard Teknisi</h1>
        <p class="text-base-content/60">Selamat datang, {{ technician?.name }}</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="stat bg-base-100 shadow rounded-box">
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
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div class="stat-title">Project Aktif</div>
        <div class="stat-value text-primary">{{ stats?.activeProjects || 0 }}</div>
        <div class="stat-desc">Sedang dikerjakan</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-box">
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
        <div class="stat-title">Project Selesai</div>
        <div class="stat-value text-success">{{ stats?.completedProjects || 0 }}</div>
        <div class="stat-desc">Bulan ini</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-box">
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
        <div class="stat-title">Total Fee</div>
        <div class="stat-value text-info text-2xl">
          {{ formatCurrency(stats?.totalEarnings || 0) }}
        </div>
        <div class="stat-desc">Bulan ini</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-box">
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
        <div class="stat-title">Pending Payment</div>
        <div class="stat-value text-warning text-2xl">
          {{ formatCurrency(stats?.pendingPayment || 0) }}
        </div>
        <div class="stat-desc">Belum dibayar</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- My Projects -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <div class="flex justify-between items-center mb-4">
              <h2 class="card-title">Project Saya</h2>
              <NuxtLink to="/technician/projects" class="btn btn-ghost btn-sm">
                Lihat Semua
              </NuxtLink>
            </div>

            <div v-if="projects?.length" class="space-y-3">
              <div
                v-for="project in projects"
                :key="project.id"
                class="p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                @click="navigateTo(`/technician/projects/${project.projectId}`)"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-mono text-sm text-base-content/60">
                        {{ project.projectCode }}
                      </span>
                      <span class="badge badge-sm" :class="getStatusClass(project.status)">
                        {{ getStatusLabel(project.status) }}
                      </span>
                    </div>
                    <p class="font-medium">{{ project.projectName }}</p>
                    <p class="text-sm text-base-content/60">{{ project.customer }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-success">
                      Fee: {{ formatCurrency(project.fee || 0) }}
                    </p>
                    <p class="text-xs text-base-content/60">
                      {{ formatDate(project.createdAt) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-base-content/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-12 h-12 mx-auto mb-2 opacity-50"
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
              <p>Belum ada project</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Info -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title mb-4">Menu</h2>
            <div class="space-y-2">
              <NuxtLink to="/technician/projects" class="btn btn-outline btn-block justify-start">
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
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Project Saya
              </NuxtLink>
              <NuxtLink to="/technician/earnings" class="btn btn-outline btn-block justify-start">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Pendapatan
              </NuxtLink>
              <NuxtLink to="/profile" class="btn btn-outline btn-block justify-start">
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Profil & Password
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Info Teknisi</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/60">Tipe</span>
                <span class="badge badge-primary">{{ technician?.type }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Kontak</span>
                <span>{{ technician?.phone || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Total Proyek</span>
                <span class="font-semibold">{{ (stats?.activeProjects || 0) + (stats?.completedProjects || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Min Fee</span>
                <span>{{ formatCurrency(technician?.minFee || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { user } = useAuth()
const { formatCurrency, formatDate } = useFormatter()

// Redirect if not technician
if (user.value?.role !== 'TECHNICIAN') {
  navigateTo('/dashboard')
}

// Fetch technician data
const { data: technician } = await useFetch('/api/technician/profile')

// Fetch dashboard stats
const { data: stats } = await useFetch('/api/technician/dashboard-stats')

// Fetch recent projects
const { data: projects } = await useFetch('/api/technician/my-projects', {
  query: { limit: 5 },
})

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    QUOTATION: 'badge-ghost',
    APPROVED: 'badge-info',
    PROCUREMENT: 'badge-warning',
    ONGOING: 'badge-primary',
    COMPLETED: 'badge-success',
    PAID: 'badge-success',
    CLOSED: 'badge-neutral',
  }
  return classes[status] || 'badge-ghost'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    QUOTATION: 'Penawaran',
    APPROVED: 'Disetujui',
    PROCUREMENT: 'Pengadaan',
    ONGOING: 'Dikerjakan',
    COMPLETED: 'Selesai',
    PAID: 'Lunas',
    CLOSED: 'Ditutup',
  }
  return labels[status] || status
}
</script>
