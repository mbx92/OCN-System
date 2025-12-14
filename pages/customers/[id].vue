<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="flex items-center gap-4">
        <NuxtLink to="/customers" class="btn btn-ghost btn-sm btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold">{{ customer?.name }}</h1>
          <p v-if="customer?.companyName" class="text-base-content/60">{{ customer.companyName }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="isEditing = true" v-if="!isEditing" class="btn btn-outline btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <NuxtLink :to="`/quotations/create?customerId=${customer?.id}`" class="btn btn-primary btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Buat Penawaran
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Customer Info -->
      <div class="lg:col-span-1">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Informasi Pelanggan</h2>

            <!-- View Mode -->
            <div v-if="!isEditing" class="space-y-4">
              <div>
                <p class="text-sm text-base-content/60">Telepon</p>
                <p class="font-mono">{{ customer?.phone }}</p>
              </div>
              <div v-if="customer?.email">
                <p class="text-sm text-base-content/60">Email</p>
                <p>{{ customer.email }}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Alamat</p>
                <p>{{ customer?.address }}</p>
              </div>
              <div v-if="customer?.notes">
                <p class="text-sm text-base-content/60">Catatan</p>
                <p class="text-sm">{{ customer.notes }}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Total Proyek</p>
                <p class="font-semibold">{{ customer?._count?.projects || 0 }}</p>
              </div>
            </div>

            <!-- Edit Mode -->
            <form v-else @submit.prevent="handleUpdate" class="space-y-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Nama</span></label>
                <input v-model="form.name" type="text" class="input input-bordered input-sm" required />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Perusahaan</span></label>
                <input v-model="form.companyName" type="text" class="input input-bordered input-sm" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Telepon</span></label>
                <input v-model="form.phone" type="tel" class="input input-bordered input-sm" required />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Email</span></label>
                <input v-model="form.email" type="email" class="input input-bordered input-sm" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Alamat</span></label>
                <textarea v-model="form.address" class="textarea textarea-bordered textarea-sm" required></textarea>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Catatan</span></label>
                <textarea v-model="form.notes" class="textarea textarea-bordered textarea-sm"></textarea>
              </div>
              <div class="flex gap-2">
                <button type="button" @click="cancelEdit" class="btn btn-ghost btn-sm flex-1">Batal</button>
                <button type="submit" class="btn btn-primary btn-sm flex-1" :disabled="updating">
                  <span v-if="updating" class="loading loading-spinner loading-xs"></span>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Project History -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Riwayat Proyek</h2>

            <div v-if="customer?.projects?.length" class="space-y-3">
              <div
                v-for="project in customer.projects"
                :key="project.id"
                class="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                @click="navigateTo(`/projects/${project.id}`)"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm text-base-content/60">{{ project.projectNumber }}</span>
                    <span class="badge badge-sm" :class="getStatusClass(project.status)">
                      {{ getStatusLabel(project.status) }}
                    </span>
                  </div>
                  <p class="font-medium">{{ project.title }}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{{ formatCurrency(project.budget) }}</p>
                  <p class="text-xs text-base-content/60">{{ formatDate(project.createdAt) }}</p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-base-content/60">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Belum ada proyek</p>
              <NuxtLink :to="`/quotations/create?customerId=${customer?.id}`" class="btn btn-primary btn-sm mt-4">
                Buat Penawaran Pertama
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()
const { success, error: showError } = useAlert()

const { data: customer, refresh } = await useFetch(`/api/customers/${route.params.id}`)

const isEditing = ref(false)
const updating = ref(false)

const form = reactive({
  name: '',
  companyName: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})

const populateForm = () => {
  if (customer.value) {
    form.name = customer.value.name
    form.companyName = customer.value.companyName || ''
    form.phone = customer.value.phone
    form.email = customer.value.email || ''
    form.address = customer.value.address
    form.notes = customer.value.notes || ''
  }
}

watch(isEditing, (val) => {
  if (val) populateForm()
})

const cancelEdit = () => {
  isEditing.value = false
  populateForm()
}

const handleUpdate = async () => {
  updating.value = true
  try {
    await $fetch(`/api/customers/${route.params.id}`, {
      method: 'PUT',
      body: form,
    })
    success('Pelanggan berhasil diperbarui')
    isEditing.value = false
    refresh()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal memperbarui pelanggan')
  } finally {
    updating.value = false
  }
}

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
