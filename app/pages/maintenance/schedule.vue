<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Jadwal Maintenance</h1>
        <p class="text-base-content/60">Kelola jadwal maintenance proyek</p>
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
        Buat Jadwal
      </button>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-4 flex-row items-center gap-4">
        <AppViewToggle v-model="viewMode" />
        <input
          v-model="search"
          type="text"
          placeholder="Cari jadwal..."
          class="input input-bordered flex-1"
        />
        <select v-model="statusFilter" class="select select-bordered">
          <option value="">Semua Status</option>
          <option value="SCHEDULED">Terjadwal</option>
          <option value="IN_PROGRESS">Berlangsung</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
        <select v-model="projectFilter" class="select select-bordered">
          <option value="">Semua Proyek</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">
            {{ p.projectNumber }} - {{ p.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Empty State -->
    <div v-else-if="!schedules.length" class="text-center py-12 text-base-content/60">
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
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p class="text-lg">Belum ada jadwal maintenance</p>
      <button @click="openCreateModal" class="btn btn-primary mt-4">Buat Jadwal Pertama</button>
    </div>

    <!-- Grid View -->
    <div
      v-else-if="viewMode === 'GRID'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div v-for="schedule in schedules" :key="schedule.id" class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold">{{ schedule.title }}</h3>
            <span class="badge" :class="getStatusClass(schedule.status)">
              {{ getStatusLabel(schedule.status) }}
            </span>
          </div>
          <p class="text-sm text-base-content/60 mb-3">{{ schedule.description || '-' }}</p>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-base-content/60">Proyek</span>
              <template v-if="schedule.project">
                <NuxtLink :to="`/projects/${schedule.project.id}`" class="link link-primary">
                  {{ schedule.project.projectNumber }}
                </NuxtLink>
              </template>
              <span v-else class="text-base-content/40">-</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/60">Pelanggan</span>
              <span>{{ schedule.project?.customer?.name || schedule.customer?.name || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/60">Tanggal</span>
              <span :class="isOverdue(schedule) ? 'text-error font-medium' : ''">
                {{ formatDate(schedule.scheduledDate) }}
              </span>
            </div>
            <div v-if="schedule.completedDate" class="flex justify-between">
              <span class="text-base-content/60">Selesai</span>
              <span class="text-success">{{ formatDate(schedule.completedDate) }}</span>
            </div>
          </div>

          <div class="card-actions justify-end mt-4 gap-1">
            <button
              v-if="schedule.status === 'SCHEDULED'"
              @click="startSchedule(schedule)"
              class="btn btn-info btn-xs"
            >
              Mulai
            </button>
            <button
              v-if="schedule.status === 'IN_PROGRESS'"
              @click="completeSchedule(schedule)"
              class="btn btn-success btn-xs"
            >
              Selesai
            </button>
            <button
              v-if="schedule.status === 'COMPLETED' && !schedule.resultProjectId"
              @click="createProjectFromSchedule(schedule)"
              class="btn btn-primary btn-xs"
            >
              Buat Project
            </button>
            <NuxtLink
              v-if="schedule.resultProjectId"
              :to="`/projects/${schedule.resultProjectId}`"
              class="btn btn-outline btn-primary btn-xs"
            >
              Lihat Project
            </NuxtLink>
            <button @click="openEditModal(schedule)" class="btn btn-ghost btn-xs">Edit</button>
            <button @click="confirmDelete(schedule)" class="btn btn-ghost btn-xs text-error">
              Hapus
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
                <th>Judul</th>
                <th>Proyek</th>
                <th>Pelanggan</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="schedule in schedules" :key="schedule.id" class="hover">
                <td>
                  <p class="font-medium">{{ schedule.title }}</p>
                  <p class="text-xs text-base-content/60">{{ schedule.description }}</p>
                </td>
                <td>
                  <template v-if="schedule.project">
                    <NuxtLink :to="`/projects/${schedule.project.id}`" class="link link-primary">
                      {{ schedule.project.projectNumber }}
                    </NuxtLink>
                  </template>
                  <span v-else class="text-base-content/40">-</span>
                </td>
                <td>{{ schedule.project?.customer?.name || schedule.customer?.name || '-' }}</td>
                <td :class="isOverdue(schedule) ? 'text-error font-medium' : ''">
                  {{ formatDate(schedule.scheduledDate) }}
                </td>
                <td>
                  <span class="badge" :class="getStatusClass(schedule.status)">
                    {{ getStatusLabel(schedule.status) }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-1">
                    <button
                      v-if="schedule.status === 'SCHEDULED'"
                      @click="startSchedule(schedule)"
                      class="btn btn-info btn-xs"
                    >
                      Mulai
                    </button>
                    <button
                      v-if="schedule.status === 'IN_PROGRESS'"
                      @click="completeSchedule(schedule)"
                      class="btn btn-success btn-xs"
                    >
                      Selesai
                    </button>
                    <button
                      v-if="schedule.status === 'COMPLETED' && !schedule.resultProjectId"
                      @click="createProjectFromSchedule(schedule)"
                      class="btn btn-primary btn-xs"
                    >
                      Buat Project
                    </button>
                    <NuxtLink
                      v-if="schedule.resultProjectId"
                      :to="`/projects/${schedule.resultProjectId}`"
                      class="btn btn-outline btn-primary btn-xs"
                    >
                      Lihat Project
                    </NuxtLink>
                    <button @click="openEditModal(schedule)" class="btn btn-ghost btn-xs">
                      Edit
                    </button>
                    <button
                      @click="confirmDelete(schedule)"
                      class="btn btn-ghost btn-xs text-error"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ editingSchedule ? 'Edit Jadwal' : 'Buat Jadwal Baru' }}
        </h3>
        <form @submit.prevent="saveSchedule">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Proyek (opsional)</label>
              <AppSearchableSelect
                v-model="form.projectId"
                :options="projectOptions"
                placeholder="Cari proyek..."
                :search-fields="['label', 'projectNumber', 'title']"
              >
                <template #option="{ option }">
                  <div>
                    <div class="font-medium">{{ option.projectNumber }}</div>
                    <div class="text-xs opacity-70">{{ option.title }}</div>
                  </div>
                </template>
              </AppSearchableSelect>
              <p class="text-xs text-base-content/60 mt-1">
                Pilih project jika maintenance terkait project tertentu
              </p>
            </div>
            <div v-if="!form.projectId">
              <label class="block text-sm font-medium mb-2">Customer *</label>
              <AppCustomerSelect
                v-model="form.customerId"
                placeholder="Cari customer..."
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Judul *</label>
              <input
                v-model="form.title"
                type="text"
                class="input input-bordered w-full"
                required
                placeholder="Contoh: Preventive Maintenance CCTV"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Deskripsi</label>
              <textarea
                v-model="form.description"
                class="textarea textarea-bordered w-full"
                rows="2"
                placeholder="Detail pekerjaan maintenance..."
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Tanggal Jadwal *</label>
              <button
                type="button"
                :popovertarget="`cally-popover-${editingSchedule?.id || 'new'}`"
                class="input input-bordered w-full text-left"
                :style="{ anchorName: `--cally-${editingSchedule?.id || 'new'}` }"
              >
                {{
                  form.scheduledDate
                    ? dayjs(form.scheduledDate).format('DD MMMM YYYY')
                    : 'Pilih tanggal'
                }}
              </button>
              <div
                popover
                :id="`cally-popover-${editingSchedule?.id || 'new'}`"
                class="dropdown bg-base-100 rounded-box shadow-lg p-2"
                :style="{ positionAnchor: `--cally-${editingSchedule?.id || 'new'}` }"
              >
                <calendar-date class="cally" :value="form.scheduledDate" @change="handleDateChange">
                  <svg
                    aria-label="Previous"
                    class="fill-current size-4"
                    slot="previous"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15.75 19.5 8.25 12l7.5-7.5"></path>
                  </svg>
                  <svg
                    aria-label="Next"
                    class="fill-current size-4"
                    slot="next"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="m8.25 4.5 7.5 7.5-7.5 7.5"></path>
                  </svg>
                  <calendar-month></calendar-month>
                </calendar-date>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Catatan</label>
              <textarea
                v-model="form.notes"
                class="textarea textarea-bordered w-full"
                rows="2"
                placeholder="Catatan tambahan..."
              ></textarea>
            </div>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false" :disabled="saving">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner"></span>
              Simpan
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showModal = false">close</button>
      </form>
    </dialog>

    <!-- Create Project Confirmation Modal -->
    <dialog class="modal" :class="{ 'modal-open': showCreateProjectModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Buat Project dari Maintenance</h3>
        <p class="py-2">
          Buat project untuk maintenance
          <strong>"{{ selectedScheduleForProject?.title }}"</strong>
        </p>

        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text font-medium">Estimasi Nilai Project *</span>
          </label>
          <input
            v-model.number="projectBudget"
            type="number"
            min="0"
            step="1000"
            class="input input-bordered w-full"
            placeholder="Masukkan estimasi nilai/budget..."
            required
          />
          <label class="label">
            <span class="label-text-alt text-base-content/60">
              Nilai ini digunakan untuk analisis margin.
              <br />
              Bisa diupdate nanti di halaman project.
            </span>
          </label>
        </div>

        <p class="text-sm text-base-content/70 mt-2">
          Project baru akan dibuat dengan nomor MNT-YYMM-XXX untuk tracking biaya dan items
          maintenance.
        </p>
        <div class="modal-action">
          <button class="btn" @click="showCreateProjectModal = false" :disabled="creatingProject">
            Batal
          </button>
          <button
            class="btn btn-primary"
            @click="executeCreateProject"
            :disabled="creatingProject || !projectBudget || projectBudget <= 0"
          >
            <span v-if="creatingProject" class="loading loading-spinner"></span>
            Buat Project
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreateProjectModal = false">close</button>
      </form>
    </dialog>

    <!-- Delete Confirmation Modal -->
    <dialog class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4 text-error">Hapus Jadwal</h3>
        <p class="py-2">
          Yakin ingin menghapus jadwal
          <strong>"{{ selectedScheduleForDelete?.title }}"</strong>
          ?
        </p>
        <p class="text-sm text-base-content/70">Aksi ini tidak dapat dibatalkan.</p>
        <div class="modal-action">
          <button class="btn" @click="showDeleteModal = false" :disabled="deleting">Batal</button>
          <button class="btn btn-error" @click="executeDelete" :disabled="deleting">
            <span v-if="deleting" class="loading loading-spinner"></span>
            Hapus
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showDeleteModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

// Import cally only on client-side (it uses document which is not available in SSR)
onMounted(() => {
  import('cally')
})

const { formatDate } = useFormatter()
const { showAlert } = useAlert()

const viewMode = ref<'GRID' | 'LIST'>('LIST')
const search = ref('')
const statusFilter = ref('')
const projectFilter = ref('')
const showModal = ref(false)
const saving = ref(false)
const editingSchedule = ref<any>(null)

// Create Project Modal
const showCreateProjectModal = ref(false)
const selectedScheduleForProject = ref<any>(null)
const creatingProject = ref(false)
const projectBudget = ref<number>(0)

// Delete Modal
const showDeleteModal = ref(false)
const selectedScheduleForDelete = ref<any>(null)
const deleting = ref(false)

const form = reactive({
  projectId: '',
  customerId: '',
  title: '',
  description: '',
  scheduledDate: '',
  notes: '',
})

// Clear customerId when projectId is selected
watch(
  () => form.projectId,
  newProjectId => {
    if (newProjectId) {
      form.customerId = ''
    }
  }
)

// Handle date change from Cally Calendar
const handleDateChange = (event: any) => {
  const date = event.target?.value
  if (date) {
    form.scheduledDate = date
  }
}

// Fetch schedules
const {
  data: schedulesData,
  pending,
  refresh,
} = await useFetch('/api/maintenance-schedules', {
  query: { status: statusFilter, projectId: projectFilter, search },
  watch: [statusFilter, projectFilter, search],
})

const schedules = computed(() => (schedulesData.value as any)?.data || [])

// Fetch projects for dropdown
const { data: projectsData } = await useFetch('/api/projects', {
  query: { limit: 1000 },
})
const projects = computed(() => (projectsData.value as any)?.data || [])

// Prepare project options for searchable select
const projectOptions = computed(() => {
  return [
    { value: '', label: 'Tanpa Proyek', projectNumber: '', title: '' },
    ...projects.value.map((p: any) => ({
      value: p.id,
      label: `${p.projectNumber} - ${p.title}`,
      projectNumber: p.projectNumber,
      title: p.title,
    })),
  ]
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    SCHEDULED: 'Terjadwal',
    IN_PROGRESS: 'Berlangsung',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    SCHEDULED: 'badge-info',
    IN_PROGRESS: 'badge-warning',
    COMPLETED: 'badge-success',
    CANCELLED: 'badge-ghost',
  }
  return classes[status] || 'badge-ghost'
}

const isOverdue = (schedule: any) => {
  if (schedule.status === 'COMPLETED' || schedule.status === 'CANCELLED') return false
  return dayjs(schedule.scheduledDate).isBefore(dayjs(), 'day')
}

const openCreateModal = () => {
  editingSchedule.value = null
  form.projectId = ''
  form.customerId = ''
  form.title = ''
  form.description = ''
  form.scheduledDate = dayjs().format('YYYY-MM-DD')
  form.notes = ''
  showModal.value = true
}

const openEditModal = (schedule: any) => {
  editingSchedule.value = schedule
  form.projectId = schedule.projectId || ''
  form.customerId = schedule.customerId || ''
  form.title = schedule.title
  form.description = schedule.description || ''
  form.scheduledDate = dayjs(schedule.scheduledDate).format('YYYY-MM-DD')
  form.notes = schedule.notes || ''
  showModal.value = true
}

const saveSchedule = async () => {
  saving.value = true
  try {
    // Prepare body - filter empty strings
    const body = {
      projectId: form.projectId || undefined,
      customerId: form.customerId || undefined,
      title: form.title,
      description: form.description || undefined,
      scheduledDate: form.scheduledDate,
      notes: form.notes || undefined,
    }

    if (editingSchedule.value) {
      await $fetch(`/api/maintenance-schedules/${editingSchedule.value.id}`, {
        method: 'PATCH',
        body,
      })
      showAlert('Jadwal berhasil diperbarui!', 'success')
    } else {
      await $fetch('/api/maintenance-schedules', {
        method: 'POST',
        body,
      })
      showAlert('Jadwal berhasil dibuat!', 'success')
    }
    showModal.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan jadwal', 'error')
  } finally {
    saving.value = false
  }
}

const startSchedule = async (schedule: any) => {
  try {
    await $fetch(`/api/maintenance-schedules/${schedule.id}`, {
      method: 'PATCH',
      body: { status: 'IN_PROGRESS' },
    })
    showAlert('Maintenance dimulai!', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal memulai maintenance', 'error')
  }
}

const completeSchedule = async (schedule: any) => {
  try {
    await $fetch(`/api/maintenance-schedules/${schedule.id}`, {
      method: 'PATCH',
      body: { status: 'COMPLETED' },
    })
    showAlert('Maintenance selesai!', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyelesaikan maintenance', 'error')
  }
}

const confirmDelete = (schedule: any) => {
  selectedScheduleForDelete.value = schedule
  showDeleteModal.value = true
}

const executeDelete = async () => {
  if (!selectedScheduleForDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/maintenance-schedules/${selectedScheduleForDelete.value.id}`, {
      method: 'DELETE',
    })
    showAlert('Jadwal dihapus!', 'success')
    showDeleteModal.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menghapus jadwal', 'error')
  } finally {
    deleting.value = false
  }
}

const createProjectFromSchedule = (schedule: any) => {
  selectedScheduleForProject.value = schedule
  projectBudget.value = 0 // Reset budget input
  showCreateProjectModal.value = true
}

const executeCreateProject = async () => {
  if (!selectedScheduleForProject.value) return
  creatingProject.value = true
  try {
    const project = await $fetch(
      `/api/maintenance-schedules/${selectedScheduleForProject.value.id}/create-project`,
      {
        method: 'POST',
        body: { budget: projectBudget.value },
      }
    )
    showAlert('Project berhasil dibuat!', 'success')
    showCreateProjectModal.value = false
    navigateTo(`/projects/${(project as any).id}`)
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal membuat project', 'error')
  } finally {
    creatingProject.value = false
  }
}
</script>
