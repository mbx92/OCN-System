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

    <!-- Tabs -->
    <div class="tabs tabs-boxed bg-base-100 p-1">
      <button
        class="tab"
        :class="{ 'tab-active': activeTab === 'warranties' }"
        @click="activeTab = 'warranties'"
      >
        Daftar Garansi
      </button>
      <button
        class="tab"
        :class="{ 'tab-active': activeTab === 'claims' }"
        @click="activeTab = 'claims'"
      >
        Klaim Masuk
        <span v-if="pendingClaimsCount > 0" class="badge badge-warning badge-sm ml-2">
          {{ pendingClaimsCount }}
        </span>
      </button>
    </div>

    <!-- Warranties Tab -->
    <template v-if="activeTab === 'warranties'">
      <!-- Search & Filter -->
      <div class="card bg-base-100 shadow">
        <div class="card-body py-4 flex-row items-center gap-4">
          <AppViewToggle v-model="viewMode" />
          <input
            v-model="search"
            type="text"
            placeholder="Cari garansi..."
            class="input input-bordered flex-1"
          />
          <select v-model="statusFilter" class="select select-bordered">
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="CLAIMED">Klaim</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      <!-- Info Box -->
      <div class="alert alert-info">
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Klaim garansi dapat diajukan berkali-kali selama masa garansi masih aktif.</span>
      </div>

      <!-- Warranties List -->
      <div v-if="pending" class="text-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="!warranties?.length" class="text-center py-12 text-base-content/60">
        <p class="text-lg">Belum ada garansi</p>
      </div>

      <!-- Grid View -->
      <div
        v-else-if="viewMode === 'GRID'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div v-for="w in warranties" :key="w.id" class="card bg-base-100 shadow">
          <div class="card-body p-4">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-mono text-sm font-bold">{{ w.warrantyNumber }}</h3>
                <NuxtLink :to="`/projects/${w.project?.id}`" class="link link-primary text-xs">
                  {{ w.project?.projectNumber }}
                </NuxtLink>
              </div>
              <span class="badge" :class="getStatusClass(w.status)">
                {{ getStatusLabel(w.status) }}
              </span>
            </div>
            <p class="text-sm text-base-content/60 mb-3">{{ w.project?.title }}</p>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/60">Pelanggan</span>
                <span>{{ w.project?.customer?.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Periode</span>
                <span>{{ formatDate(w.startDate) }} - {{ formatDate(w.endDate) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Sisa Waktu</span>
                <span :class="getTimeLeftClass(w.endDate)">{{ getTimeLeft(w.endDate) }}</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-base-300">
                <span class="text-base-content/60">Total Klaim</span>
                <span class="badge badge-ghost">{{ w._count?.claims || 0 }}</span>
              </div>
            </div>

            <div v-if="w.status === 'ACTIVE'" class="card-actions justify-end mt-3">
              <button @click="openClaimModal(w)" class="btn btn-warning btn-sm w-full">
                Ajukan Klaim
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="card bg-base-100 shadow">
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
                <tr v-for="w in warranties" :key="w.id" class="hover">
                  <td class="font-mono text-sm">{{ w.warrantyNumber }}</td>
                  <td>
                    <NuxtLink :to="`/projects/${w.project?.id}`" class="link link-primary">
                      {{ w.project?.projectNumber }}
                    </NuxtLink>
                    <p class="text-xs text-base-content/60">{{ w.project?.title }}</p>
                  </td>
                  <td>{{ w.project?.customer?.name }}</td>
                  <td>
                    <p class="text-sm">
                      {{ formatDate(w.startDate) }} - {{ formatDate(w.endDate) }}
                    </p>
                    <p class="text-xs" :class="getTimeLeftClass(w.endDate)">
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
    </template>

    <!-- Claims Tab -->
    <template v-else>
      <!-- Claims Filter -->
      <div class="card bg-base-100 shadow">
        <div class="card-body py-4 flex-row items-center gap-4">
          <input
            v-model="claimSearch"
            type="text"
            placeholder="Cari klaim..."
            class="input input-bordered flex-1"
          />
          <select v-model="claimStatusFilter" class="select select-bordered">
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">Diproses</option>
            <option value="RESOLVED">Selesai</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>
      </div>

      <!-- Claims List -->
      <div v-if="claimsPending" class="text-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="!claims?.length" class="text-center py-12 text-base-content/60">
        <p class="text-lg">Belum ada klaim</p>
      </div>

      <div v-else class="card bg-base-100 shadow">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>No. Klaim</th>
                  <th>Garansi</th>
                  <th>Pelanggan</th>
                  <th>Keluhan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="claim in claims" :key="claim.id" class="hover">
                  <td class="font-mono text-sm">{{ claim.claimNumber }}</td>
                  <td>
                    <span class="font-mono text-xs">{{ claim.warranty?.warrantyNumber }}</span>
                    <p class="text-xs text-base-content/60">
                      {{ claim.warranty?.project?.projectNumber }}
                    </p>
                  </td>
                  <td>{{ claim.warranty?.project?.customer?.name }}</td>
                  <td>
                    <p class="max-w-xs truncate">{{ claim.description }}</p>
                  </td>
                  <td>{{ formatDate(claim.reportedDate) }}</td>
                  <td>
                    <span class="badge" :class="getClaimStatusClass(claim.status)">
                      {{ getClaimStatusLabel(claim.status) }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="flex justify-end gap-1">
                      <button
                        v-if="claim.status === 'PENDING'"
                        @click="processClaimStatus(claim, 'IN_PROGRESS')"
                        class="btn btn-info btn-xs"
                      >
                        Proses
                      </button>
                      <button
                        v-if="claim.status === 'IN_PROGRESS'"
                        @click="openResolveModal(claim)"
                        class="btn btn-success btn-xs"
                      >
                        Selesaikan
                      </button>
                      <button
                        v-if="claim.status === 'PENDING' || claim.status === 'IN_PROGRESS'"
                        @click="openRejectModal(claim)"
                        class="btn btn-error btn-xs"
                      >
                        Tolak
                      </button>
                      <button @click="viewClaimDetail(claim)" class="btn btn-ghost btn-xs">
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

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

    <!-- Resolve Claim Modal -->
    <dialog class="modal" :class="{ 'modal-open': showResolveModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Selesaikan Klaim</h3>
        <p class="text-sm text-base-content/60 mb-4">{{ resolvingClaim?.claimNumber }}</p>
        <form @submit.prevent="resolveClaim">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Resolusi / Penyelesaian *</label>
              <textarea
                v-model="resolveForm.resolution"
                class="textarea textarea-bordered w-full"
                rows="4"
                required
                placeholder="Jelaskan pekerjaan yang sudah dilakukan..."
              ></textarea>
            </div>
          </div>
          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="showResolveModal = false"
              :disabled="savingResolve"
            >
              Batal
            </button>
            <button type="submit" class="btn btn-success" :disabled="savingResolve">
              <span v-if="savingResolve" class="loading loading-spinner"></span>
              Selesaikan
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showResolveModal = false">close</button>
      </form>
    </dialog>

    <!-- Reject Claim Modal -->
    <dialog class="modal" :class="{ 'modal-open': showRejectModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Tolak Klaim</h3>
        <p class="text-sm text-base-content/60 mb-4">{{ rejectingClaim?.claimNumber }}</p>
        <form @submit.prevent="rejectClaim">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Alasan Penolakan *</label>
              <textarea
                v-model="rejectForm.resolution"
                class="textarea textarea-bordered w-full"
                rows="4"
                required
                placeholder="Jelaskan alasan penolakan..."
              ></textarea>
            </div>
          </div>
          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="showRejectModal = false"
              :disabled="savingReject"
            >
              Batal
            </button>
            <button type="submit" class="btn btn-error" :disabled="savingReject">
              <span v-if="savingReject" class="loading loading-spinner"></span>
              Tolak
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showRejectModal = false">close</button>
      </form>
    </dialog>

    <!-- Claim Detail Modal -->
    <dialog class="modal" :class="{ 'modal-open': showDetailModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Detail Klaim</h3>
        <div v-if="detailClaim" class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-base-content/60">No. Klaim</span>
              <p class="font-mono">{{ detailClaim.claimNumber }}</p>
            </div>
            <div>
              <span class="text-base-content/60">Status</span>
              <p>
                <span class="badge" :class="getClaimStatusClass(detailClaim.status)">
                  {{ getClaimStatusLabel(detailClaim.status) }}
                </span>
              </p>
            </div>
            <div>
              <span class="text-base-content/60">Garansi</span>
              <p class="font-mono">{{ detailClaim.warranty?.warrantyNumber }}</p>
            </div>
            <div>
              <span class="text-base-content/60">Pelanggan</span>
              <p>{{ detailClaim.warranty?.project?.customer?.name }}</p>
            </div>
            <div class="col-span-2">
              <span class="text-base-content/60">Tanggal Lapor</span>
              <p>{{ formatDate(detailClaim.reportedDate) }}</p>
            </div>
            <div v-if="detailClaim.resolvedDate" class="col-span-2">
              <span class="text-base-content/60">Tanggal Selesai</span>
              <p>{{ formatDate(detailClaim.resolvedDate) }}</p>
            </div>
          </div>
          <div>
            <span class="text-sm text-base-content/60">Keluhan</span>
            <p class="bg-base-200 p-3 rounded-lg mt-1">{{ detailClaim.description }}</p>
          </div>
          <div v-if="detailClaim.resolution">
            <span class="text-sm text-base-content/60">Resolusi</span>
            <p class="bg-base-200 p-3 rounded-lg mt-1">{{ detailClaim.resolution }}</p>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn" @click="showDetailModal = false">Tutup</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showDetailModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const { formatDate } = useFormatter()
const { showAlert } = useAlert()

const activeTab = ref<'warranties' | 'claims'>('warranties')
const viewMode = ref<'LIST' | 'GRID'>('LIST')
const search = ref('')
const statusFilter = ref('')
const claimSearch = ref('')
const claimStatusFilter = ref('')

// Warranties
const {
  data: warrantiesData,
  pending,
  refresh,
} = await useFetch('/api/warranties', {
  query: { status: statusFilter },
  watch: [statusFilter],
})

const warranties = computed(() => {
  let items = (warrantiesData.value as any)?.data || []
  if (search.value) {
    const s = search.value.toLowerCase()
    items = items.filter(
      (w: any) =>
        w.warrantyNumber?.toLowerCase().includes(s) ||
        w.project?.projectNumber?.toLowerCase().includes(s) ||
        w.project?.customer?.name?.toLowerCase().includes(s)
    )
  }
  return items
})

// Claims
const {
  data: claimsData,
  pending: claimsPending,
  refresh: refreshClaims,
} = await useFetch('/api/warranties/claims', {
  query: { status: claimStatusFilter, search: claimSearch },
  watch: [claimStatusFilter, claimSearch],
})

const claims = computed(() => (claimsData.value as any)?.data || [])
const pendingClaimsCount = computed(
  () => claims.value.filter((c: any) => c.status === 'PENDING').length
)

// Projects for create warranty
const { data: projectsData } = await useFetch('/api/projects', {
  query: { status: 'COMPLETED', limit: 100 },
})
const completedProjects = computed(() => (projectsData.value as any)?.data || [])

// Create warranty
const showCreateModal = ref(false)
const savingCreate = ref(false)
const createForm = reactive({ projectId: '', warrantyMonths: 12, notes: '' })

const openCreateModal = () => {
  createForm.projectId = ''
  createForm.warrantyMonths = 12
  createForm.notes = ''
  showCreateModal.value = true
}

const createWarranty = async () => {
  savingCreate.value = true
  try {
    await $fetch('/api/warranties', { method: 'POST', body: createForm })
    showAlert('Garansi berhasil didaftarkan!', 'success')
    showCreateModal.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mendaftarkan garansi', 'error')
  } finally {
    savingCreate.value = false
  }
}

// Submit claim
const showClaimModal = ref(false)
const savingClaim = ref(false)
const claimingWarranty = ref<any>(null)
const claimForm = reactive({ description: '' })

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
    await refreshClaims()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengajukan klaim', 'error')
  } finally {
    savingClaim.value = false
  }
}

// Resolve claim
const showResolveModal = ref(false)
const savingResolve = ref(false)
const resolvingClaim = ref<any>(null)
const resolveForm = reactive({ resolution: '' })

const openResolveModal = (claim: any) => {
  resolvingClaim.value = claim
  resolveForm.resolution = ''
  showResolveModal.value = true
}

const resolveClaim = async () => {
  if (!resolvingClaim.value) return
  savingResolve.value = true
  try {
    await $fetch(`/api/warranties/claims/${resolvingClaim.value.id}`, {
      method: 'PATCH',
      body: { status: 'RESOLVED', resolution: resolveForm.resolution },
    })
    showAlert('Klaim berhasil diselesaikan!', 'success')
    showResolveModal.value = false
    await refreshClaims()
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyelesaikan klaim', 'error')
  } finally {
    savingResolve.value = false
  }
}

// Reject claim
const showRejectModal = ref(false)
const savingReject = ref(false)
const rejectingClaim = ref<any>(null)
const rejectForm = reactive({ resolution: '' })

const openRejectModal = (claim: any) => {
  rejectingClaim.value = claim
  rejectForm.resolution = ''
  showRejectModal.value = true
}

const rejectClaim = async () => {
  if (!rejectingClaim.value) return
  savingReject.value = true
  try {
    await $fetch(`/api/warranties/claims/${rejectingClaim.value.id}`, {
      method: 'PATCH',
      body: { status: 'REJECTED', resolution: rejectForm.resolution },
    })
    showAlert('Klaim ditolak', 'success')
    showRejectModal.value = false
    await refreshClaims()
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menolak klaim', 'error')
  } finally {
    savingReject.value = false
  }
}

// Process claim status
const processClaimStatus = async (claim: any, status: string) => {
  try {
    await $fetch(`/api/warranties/claims/${claim.id}`, { method: 'PATCH', body: { status } })
    showAlert('Status klaim diperbarui!', 'success')
    await refreshClaims()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal memperbarui status', 'error')
  }
}

// Claim detail
const showDetailModal = ref(false)
const detailClaim = ref<any>(null)

const viewClaimDetail = (claim: any) => {
  detailClaim.value = claim
  showDetailModal.value = true
}

// Helpers
const getStatusLabel = (s: string) =>
  ({ ACTIVE: 'Aktif', EXPIRED: 'Expired', CLAIMED: 'Klaim', VOIDED: 'Dibatalkan' })[s] || s
const getStatusClass = (s: string) =>
  ({
    ACTIVE: 'badge-success',
    EXPIRED: 'badge-ghost',
    CLAIMED: 'badge-warning',
    VOIDED: 'badge-error',
  })[s] || 'badge-ghost'
const getClaimStatusLabel = (s: string) =>
  ({ PENDING: 'Pending', IN_PROGRESS: 'Diproses', RESOLVED: 'Selesai', REJECTED: 'Ditolak' })[s] ||
  s
const getClaimStatusClass = (s: string) =>
  ({
    PENDING: 'badge-warning',
    IN_PROGRESS: 'badge-info',
    RESOLVED: 'badge-success',
    REJECTED: 'badge-error',
  })[s] || 'badge-ghost'

const getTimeLeft = (endDate: string) => {
  const end = dayjs(endDate)
  const now = dayjs()
  if (end.isBefore(now)) return 'Expired'
  const months = end.diff(now, 'month')
  if (months > 0) return `${months} bulan lagi`
  return `${end.diff(now, 'day')} hari lagi`
}

const getTimeLeftClass = (endDate: string) => {
  const end = dayjs(endDate)
  const now = dayjs()
  if (end.isBefore(now)) return 'text-error'
  if (end.diff(now, 'month') <= 1) return 'text-warning'
  return 'text-success'
}
</script>
