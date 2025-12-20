<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Garansi</h1>
        <p class="text-base-content/60">Kelola garansi proyek yang sudah selesai</p>
      </div>
      <button @click="openCreateModal" class="btn btn-primary">
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
        Daftarkan Garansi
      </button>
    </div>

    <!-- Status Filter -->
    <div class="tabs tabs-boxed w-fit">
      <button class="tab" :class="{ 'tab-active': !statusFilter }" @click="statusFilter = ''">
        Semua
      </button>
      <button
        class="tab"
        :class="{ 'tab-active': statusFilter === 'ACTIVE' }"
        @click="statusFilter = 'ACTIVE'"
      >
        Aktif
      </button>
      <button
        class="tab"
        :class="{ 'tab-active': statusFilter === 'CLAIMED' }"
        @click="statusFilter = 'CLAIMED'"
      >
        Klaim
      </button>
      <button
        class="tab"
        :class="{ 'tab-active': statusFilter === 'EXPIRED' }"
        @click="statusFilter = 'EXPIRED'"
      >
        Expired
      </button>
    </div>

    <!-- Warranties List -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>No. Garansi</th>
                <th>Proyek</th>
                <th>Pelanggan</th>
                <th>Periode</th>
                <th>Status</th>
                <th>Klaim</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pending" class="text-center">
                <td colspan="7" class="py-8">
                  <span class="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
              <tr v-else-if="!warranties?.length" class="text-center">
                <td colspan="7" class="py-8 text-base-content/60">
                  <p class="text-lg">Belum ada garansi</p>
                </td>
              </tr>
              <tr v-for="w in warranties" :key="w.id" class="hover">
                <td class="font-mono text-sm">{{ w.warrantyNumber }}</td>
                <td>
                  <NuxtLink :to="`/projects/${w.project?.id}`" class="link link-primary">
                    {{ w.project?.projectNumber }}
                  </NuxtLink>
                  <p class="text-xs text-base-content/60">{{ w.project?.title }}</p>
                </td>
                <td>
                  <p class="font-medium">{{ w.project?.customer?.name }}</p>
                  <p class="text-xs text-base-content/60">{{ w.project?.customer?.phone }}</p>
                </td>
                <td>
                  <p class="text-sm">{{ formatDate(w.startDate) }}</p>
                  <p class="text-sm">s/d {{ formatDate(w.endDate) }}</p>
                  <p class="text-xs font-medium" :class="getTimeLeftClass(w.endDate)">
                    {{ getTimeLeft(w.endDate) }}
                  </p>
                </td>
                <td>
                  <span class="badge" :class="getStatusClass(w.status)">
                    {{ getStatusLabel(w.status) }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-ghost">{{ w._count?.claims || 0 }}</span>
                </td>
                <td class="text-right">
                  <button
                    v-if="w.status === 'ACTIVE'"
                    @click="openClaimModal(w)"
                    class="btn btn-warning btn-sm"
                  >
                    Ajukan Klaim
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="warrantiesData?.meta?.total" class="card bg-base-100 shadow p-4">
      <AppPagination
        :total="warrantiesData.meta.total"
        :per-page="20"
        v-model:current-page="page"
      />
    </div>

    <!-- Create Warranty Modal -->
    <dialog class="modal" :class="{ 'modal-open': showCreateModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Daftarkan Garansi</h3>
        <form @submit.prevent="createWarranty">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Proyek *</label>
              <select v-model="createForm.projectId" class="select select-bordered w-full" required>
                <option value="">Pilih Proyek</option>
                <option v-for="p in completedProjects" :key="p.id" :value="p.id">
                  {{ p.projectNumber }} - {{ p.title }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Periode Garansi (bulan)</label>
              <input
                v-model.number="createForm.warrantyMonths"
                type="number"
                min="1"
                max="60"
                class="input input-bordered w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Catatan</label>
              <textarea
                v-model="createForm.notes"
                class="textarea textarea-bordered w-full"
                rows="2"
              ></textarea>
            </div>
          </div>
          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="showCreateModal = false"
              :disabled="savingCreate"
            >
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="savingCreate">
              <span v-if="savingCreate" class="loading loading-spinner"></span>
              Simpan
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreateModal = false">close</button>
      </form>
    </dialog>

    <!-- Claim Modal -->
    <dialog class="modal" :class="{ 'modal-open': showClaimModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Ajukan Klaim Garansi</h3>
        <p class="text-sm text-base-content/60 mb-4">{{ claimingWarranty?.warrantyNumber }}</p>
        <form @submit.prevent="submitClaim">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Deskripsi Keluhan *</label>
              <textarea
                v-model="claimForm.description"
                class="textarea textarea-bordered w-full"
                rows="4"
                required
                placeholder="Jelaskan masalah yang dialami..."
              ></textarea>
            </div>
          </div>
          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="showClaimModal = false"
              :disabled="savingClaim"
            >
              Batal
            </button>
            <button type="submit" class="btn btn-warning" :disabled="savingClaim">
              <span v-if="savingClaim" class="loading loading-spinner"></span>
              Ajukan Klaim
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showClaimModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const { formatDate } = useFormatter()
const { showAlert } = useAlert()

const statusFilter = ref('')
const page = ref(1)

// Create warranty modal
const showCreateModal = ref(false)
const savingCreate = ref(false)
const createForm = reactive({
  projectId: '',
  warrantyMonths: 12,
  notes: '',
})

// Claim modal
const showClaimModal = ref(false)
const savingClaim = ref(false)
const claimingWarranty = ref<any>(null)
const claimForm = reactive({
  description: '',
})

const {
  data: warrantiesData,
  pending,
  refresh,
} = await useFetch('/api/warranties', {
  query: { status: statusFilter, page, limit: 20 },
  watch: [statusFilter, page],
})

const warranties = computed(() => (warrantiesData.value as any)?.data || [])

// Fetch completed projects for dropdown
const { data: projectsData } = await useFetch('/api/projects', {
  query: { status: 'COMPLETED', limit: 100 },
})
const completedProjects = computed(() => (projectsData.value as any)?.data || [])

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ACTIVE: 'Aktif',
    EXPIRED: 'Expired',
    CLAIMED: 'Klaim',
    VOIDED: 'Dibatalkan',
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    ACTIVE: 'badge-success',
    EXPIRED: 'badge-ghost',
    CLAIMED: 'badge-warning',
    VOIDED: 'badge-error',
  }
  return classes[status] || 'badge-ghost'
}

const getTimeLeft = (endDate: string) => {
  const end = dayjs(endDate)
  const now = dayjs()
  if (end.isBefore(now)) return 'Expired'
  const months = end.diff(now, 'month')
  if (months > 0) return `${months} bulan lagi`
  const days = end.diff(now, 'day')
  return `${days} hari lagi`
}

const getTimeLeftClass = (endDate: string) => {
  const end = dayjs(endDate)
  const now = dayjs()
  if (end.isBefore(now)) return 'text-error'
  const months = end.diff(now, 'month')
  if (months <= 1) return 'text-warning'
  return 'text-success'
}

const openCreateModal = () => {
  createForm.projectId = ''
  createForm.warrantyMonths = 12
  createForm.notes = ''
  showCreateModal.value = true
}

const createWarranty = async () => {
  savingCreate.value = true
  try {
    await $fetch('/api/warranties', {
      method: 'POST',
      body: createForm,
    })
    showAlert('Garansi berhasil didaftarkan!', 'success')
    showCreateModal.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mendaftarkan garansi', 'error')
  } finally {
    savingCreate.value = false
  }
}

const openClaimModal = (warranty: any) => {
  claimingWarranty.value = warranty
  claimForm.description = ''
  showClaimModal.value = true
}

const submitClaim = async () => {
  if (!claimingWarranty.value) return
  savingClaim.value = true
  try {
    await $fetch(`/api/warranties/${claimingWarranty.value.id}/claim`, {
      method: 'POST',
      body: claimForm,
    })
    showAlert('Klaim garansi berhasil diajukan!', 'success')
    showClaimModal.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengajukan klaim', 'error')
  } finally {
    savingClaim.value = false
  }
}
</script>
