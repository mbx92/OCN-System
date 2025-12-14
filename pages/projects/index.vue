<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Proyek</h1>
        <p class="text-base-content/60">Kelola semua proyek</p>
      </div>
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

    <!-- Project List -->
    <div class="card bg-base-100 shadow">
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
                <td class="text-right text-sm text-base-content/60">{{ formatDate(project.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="projects?.meta?.totalPages > 1" class="flex justify-center p-4 border-t border-base-200">
          <div class="join">
            <button class="join-item btn btn-sm" :disabled="page <= 1" @click="page--">«</button>
            <button class="join-item btn btn-sm">Halaman {{ page }} dari {{ projects?.meta?.totalPages }}</button>
            <button class="join-item btn btn-sm" :disabled="page >= projects?.meta?.totalPages" @click="page++">»</button>
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

const statusTabs = [
  { label: 'Semua', value: 'all' },
  { label: 'Penawaran', value: 'QUOTATION' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Dikerjakan', value: 'ONGOING' },
  { label: 'Selesai', value: 'COMPLETED' },
  { label: 'Lunas', value: 'PAID' },
]

const { data: projects, pending } = await useFetch('/api/projects', {
  query: { status, page, limit: 10 },
  watch: [status, page],
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
