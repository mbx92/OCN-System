<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ error.message || 'Gagal memuat data proyek' }}</span>
    </div>

    <!-- Project Detail -->
    <div v-else-if="project">
      <!-- Header -->
      <div class="mb-6">
        <button class="btn btn-ghost btn-sm mb-4" @click="navigateTo('/technician/projects')">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali
        </button>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold mb-2">{{ project.name }}</h1>
            <p class="text-base-content/60">{{ project.projectCode }}</p>
          </div>
          <div class="badge badge-lg" :class="getStatusClass(project.status)">
            {{ getStatusLabel(project.status) }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Project Info -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Informasi Proyek</h2>
              <div class="space-y-3">
                <div>
                  <label class="text-sm text-base-content/60">Pelanggan</label>
                  <p class="font-semibold">{{ project.customer?.name || '-' }}</p>
                </div>
                <div v-if="project.description">
                  <label class="text-sm text-base-content/60">Deskripsi</label>
                  <p class="whitespace-pre-wrap">{{ project.description }}</p>
                </div>
                <div v-if="project.location">
                  <label class="text-sm text-base-content/60">Lokasi</label>
                  <p>{{ project.location }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-sm text-base-content/60">Tanggal Dibuat</label>
                    <p>{{ formatDate(project.createdAt) }}</p>
                  </div>
                  <div v-if="project.completedAt">
                    <label class="text-sm text-base-content/60">Tanggal Selesai</label>
                    <p>{{ formatDate(project.completedAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Project Items -->
          <div v-if="project.items && project.items.length > 0" class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Item Proyek</h2>
              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Harga</th>
                      <th class="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in project.items" :key="item.id">
                      <td>
                        <div class="font-semibold">{{ item.product?.name || '-' }}</div>
                        <div v-if="item.description" class="text-xs text-base-content/60">
                          {{ item.description }}
                        </div>
                      </td>
                      <td class="text-right">{{ item.quantity }} {{ item.product?.unit || '' }}</td>
                      <td class="text-right">{{ formatCurrency(item.unitPrice) }}</td>
                      <td class="text-right font-semibold">{{ formatCurrency(item.totalPrice) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="font-bold">
                      <td colspan="3" class="text-right">Total:</td>
                      <td class="text-right text-lg">{{ formatCurrency(project.totalAmount) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- My Assignment -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title text-lg">Tugas Saya</h2>
              <div class="space-y-3">
                <div>
                  <label class="text-sm text-base-content/60">Fee</label>
                  <p class="text-2xl font-bold text-primary">{{ formatCurrency(assignment?.fee || 0) }}</p>
                </div>
                <div>
                  <label class="text-sm text-base-content/60">Status Pembayaran</label>
                  <div v-if="assignment?.isPaid" class="badge badge-success gap-1 mt-1">
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
                    Sudah Dibayar
                  </div>
                  <div v-else class="badge badge-warning gap-1 mt-1">
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
            </div>
          </div>

          <!-- Other Technicians -->
          <div v-if="project.technicians && project.technicians.length > 1" class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title text-lg">Tim Teknisi</h2>
              <div class="space-y-2">
                <div
                  v-for="tech in project.technicians"
                  :key="tech.id"
                  class="flex items-center justify-between p-2 rounded-lg bg-base-200"
                >
                  <div class="flex items-center gap-2">
                    <div class="avatar placeholder">
                      <div class="bg-primary text-primary-content rounded-full w-8">
                        <span class="text-xs">{{ tech.technician?.name?.charAt(0) || 'T' }}</span>
                      </div>
                    </div>
                    <span class="text-sm font-semibold">{{ tech.technician?.name || '-' }}</span>
                  </div>
                  <div class="text-xs text-base-content/60">
                    {{ formatCurrency(tech.fee) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Info -->
          <div v-if="project.customer" class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title text-lg">Kontak Pelanggan</h2>
              <div class="space-y-2">
                <div v-if="project.customer.phone" class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <a :href="`tel:${project.customer.phone}`" class="link">
                    {{ project.customer.phone }}
                  </a>
                </div>
                <div v-if="project.customer.email" class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <a :href="`mailto:${project.customer.email}`" class="link">
                    {{ project.customer.email }}
                  </a>
                </div>
                <div v-if="project.customer.address" class="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-primary flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p class="text-sm">{{ project.customer.address }}</p>
                </div>
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

const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()

// Fetch project detail
const {
  data: project,
  pending,
  error,
} = await useFetch(`/api/technician/projects/${route.params.id}`)

// Get my assignment
const assignment = computed(() => {
  if (!project.value?.technicians) return null
  return project.value.technicians.find((t: any) => t.isCurrentUser)
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
