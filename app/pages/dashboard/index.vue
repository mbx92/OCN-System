<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <ClientOnly>
          <p class="text-base-content/60">Selamat datang, {{ user?.name }}</p>
          <template #fallback>
            <p class="text-base-content/60">Selamat datang</p>
          </template>
        </ClientOnly>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/quotations/create" class="btn btn-primary">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div class="stat-title">Proyek Aktif</div>
        <div class="stat-value text-primary">{{ stats?.activeProjects || 0 }}</div>
        <div class="stat-desc">{{ stats?.ongoingProjects || 0 }} sedang dikerjakan</div>
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="stat-title">Pendapatan Bulan Ini</div>
        <div class="stat-value text-success text-2xl">
          {{ formatCurrency(stats?.monthlyRevenue || 0) }}
        </div>
        <div class="stat-desc">{{ stats?.paidProjects || 0 }} proyek selesai bayar</div>
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
        <div class="stat-title">Pembayaran Tertunda</div>
        <div class="stat-value text-warning text-2xl">
          {{ formatCurrency(stats?.pendingPayments || 0) }}
        </div>
        <div class="stat-desc">{{ stats?.overdueCount || 0 }} jatuh tempo</div>
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div class="stat-title">Total Pelanggan</div>
        <div class="stat-value text-info">{{ stats?.totalCustomers || 0 }}</div>
        <div class="stat-desc" v-if="stats?.newCustomers">
          <span class="text-success">+{{ stats.newCustomers }}</span> pelanggan baru (2 hari terakhir)
        </div>
        <div class="stat-desc" v-else>Tidak ada pelanggan baru</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Projects -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <div class="flex justify-between items-center mb-4">
              <h2 class="card-title">Proyek Terbaru</h2>
              <NuxtLink to="/projects" class="btn btn-ghost btn-sm">Lihat Semua</NuxtLink>
            </div>

            <div v-if="recentProjects?.length" class="space-y-3">
              <div
                v-for="project in recentProjects"
                :key="project.id"
                class="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                @click="navigateTo(`/projects/${project.id}`)"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm text-base-content/60">
                      {{ project.projectNumber }}
                    </span>
                    <span class="badge badge-sm" :class="getStatusClass(project.status)">
                      {{ getStatusLabel(project.status) }}
                    </span>
                  </div>
                  <p class="font-medium truncate">{{ project.title }}</p>
                  <p class="text-sm text-base-content/60">{{ project.customer?.name }}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{{ formatCurrency(project.totalAmount) }}</p>
                  <p class="text-xs text-base-content/60">{{ formatDate(project.createdAt) }}</p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-base-content/60">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>Belum ada proyek</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts & Quick Actions -->
      <div class="space-y-6">
        <!-- Alerts -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title text-warning">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Perhatian
            </h2>

            <div v-if="alerts?.length" class="space-y-2">
              <div
                v-for="alert in alerts"
                :key="alert.id"
                class="flex items-start gap-2 p-2 rounded"
                :class="getAlertClass(alert.type)"
              >
                <span class="text-sm">{{ alert.message }}</span>
              </div>
            </div>

            <div v-else class="text-center py-4 text-base-content/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 mx-auto mb-1 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p class="text-sm">Tidak ada notifikasi</p>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Aksi Cepat</h2>
            <div class="grid grid-cols-2 gap-2">
              <NuxtLink to="/quotations/create" class="btn btn-outline btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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
                Penawaran
              </NuxtLink>
              <NuxtLink to="/customers/create" class="btn btn-outline btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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
                Pelanggan
              </NuxtLink>
              <NuxtLink to="/inventory/products" class="btn btn-outline btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Stok
              </NuxtLink>
              <NuxtLink to="/finance/reports" class="btn btn-outline btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Laporan
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { formatCurrency, formatDate } = useFormatter()

// Fetch dashboard data - disable cache untuk selalu dapat data terbaru
const { data: stats, refresh: refreshStats } = await useFetch('/api/dashboard/summary', {
  server: false,
  lazy: false,
})

const { data: recentProjects } = await useFetch('/api/projects', {
  query: { limit: 5, sort: 'createdAt', order: 'desc' },
  transform: (res: any) => res.data,
})
const { data: alerts } = await useFetch('/api/dashboard/alerts')

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

const getAlertClass = (type: string) => {
  const classes: Record<string, string> = {
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
  }
  return classes[type] || 'bg-base-200'
}
</script>
