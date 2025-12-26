<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Kelola Teknisi</h1>
        <p class="text-base-content/60">Manajemen teknisi dan penghasilan</p>
      </div>
      <button @click="openModal()" class="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
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
        Tambah Teknisi
      </button>
    </div>

    <!-- Search -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-4">
        <input
          v-model="search"
          type="text"
          placeholder="Cari teknisi..."
          class="input input-bordered w-full"
        />
      </div>
    </div>

    <!-- Technician List -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-sm sm:table-md">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kontak</th>
                <th>Tipe</th>
                <th>Fee</th>
                <th class="text-center">Proyek</th>
                <th class="text-right">Total Pendapatan</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pending" class="text-center">
                <td colspan="7" class="py-8">
                  <span class="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
              <tr v-else-if="!filteredTechnicians?.length" class="text-center">
                <td colspan="7" class="py-8 text-base-content/60">
                  <p class="text-lg">Belum ada teknisi</p>
                  <button @click="openModal()" class="btn btn-primary mt-4">
                    Tambah Teknisi Pertama
                  </button>
                </td>
              </tr>
              <tr v-for="tech in filteredTechnicians" :key="tech.id" class="hover">
                <td>
                  <div class="flex items-center gap-2 sm:gap-3">
                    <div class="avatar placeholder">
                      <div class="bg-primary text-primary-content rounded-full w-8 sm:w-10">
                        <span class="text-xs sm:text-sm">{{ getInitials(tech.name) }}</span>
                      </div>
                    </div>
                    <div>
                      <p class="font-medium text-sm sm:text-base">{{ tech.name }}</p>
                      <span class="badge badge-ghost badge-xs sm:badge-sm">{{ tech.type }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <p class="font-mono text-xs sm:text-sm">{{ tech.phone }}</p>
                  <p v-if="tech.email" class="text-xs sm:text-sm text-base-content/60">
                    {{ tech.email }}
                  </p>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="tech.type === 'INTERNAL' ? 'badge-primary' : 'badge-outline'"
                  >
                    {{ tech.type }}
                  </span>
                </td>
                <td>
                  <template v-if="tech.feeType === 'PERCENTAGE'">
                    <span class="font-mono">{{ tech.feePercentage }}%</span>
                    <span class="text-xs text-base-content/60 block">
                      Min: {{ formatCurrency(tech.minFee) }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="badge badge-ghost">{{ tech.feeType }}</span>
                  </template>
                </td>
                <td class="text-center">
                  <span class="badge badge-ghost">{{ tech.totalProjects || 0 }}</span>
                  <span v-if="tech.activeProjects" class="badge badge-success ml-1">
                    {{ tech.activeProjects }} aktif
                  </span>
                </td>
                <td class="text-right font-mono font-bold text-success">
                  {{ formatCurrency(tech.totalEarnings || 0) }}
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-1">
                    <button @click="openModal(tech)" class="btn btn-ghost btn-sm btn-square">
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="deleteTechnician(tech)"
                      class="btn btn-ghost btn-sm btn-square text-error"
                    >
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ editingTech ? 'Edit Teknisi' : 'Tambah Teknisi' }}
        </h3>
        <form @submit.prevent="saveTechnician">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Nama *</label>
              <input v-model="form.name" type="text" class="input input-bordered w-full" required />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">No. Telepon *</label>
              <input
                v-model="form.phone"
                type="text"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Tipe</label>
              <select v-model="form.type" class="select select-bordered w-full">
                <option value="FREELANCE">Freelance</option>
                <option value="INTERNAL">Internal</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Tipe Fee</label>
              <select v-model="form.feeType" class="select select-bordered w-full">
                <option value="PERCENTAGE">Persentase</option>
                <option value="FIXED">Fixed</option>
                <option value="CUSTOM">Custom per proyek</option>
              </select>
            </div>
            <div v-if="form.feeType === 'PERCENTAGE'">
              <label class="block text-sm font-medium mb-2">Persentase Fee (%)</label>
              <input
                v-model.number="form.feePercentage"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="input input-bordered w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Fee Minimum</label>
              <input
                v-model.number="form.minFee"
                type="number"
                min="0"
                class="input input-bordered w-full"
              />
            </div>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false" :disabled="saving">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner"></span>
              {{ editingTech ? 'Update' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { showAlert } = useAlert()
const { formatCurrency } = useFormatter()

const search = ref('')
const showModal = ref(false)
const saving = ref(false)
const editingTech = ref<any>(null)

const { data: technicians, pending, refresh } = await useFetch('/api/technicians')

const filteredTechnicians = computed(() => {
  if (!technicians.value) return []
  if (!search.value) return technicians.value

  const searchLower = search.value.toLowerCase()
  return (technicians.value as any[]).filter(
    t => t.name?.toLowerCase().includes(searchLower) || t.phone?.includes(search.value)
  )
})

const form = reactive({
  name: '',
  phone: '',
  type: 'FREELANCE',
  feeType: 'PERCENTAGE',
  feePercentage: 10,
  minFee: 150000,
})

const getInitials = (name?: string) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const openModal = (tech?: any) => {
  if (tech) {
    editingTech.value = tech
    form.name = tech.name
    form.phone = tech.phone
    form.type = tech.type
    form.feeType = tech.feeType
    form.feePercentage = parseFloat(tech.feePercentage) || 10
    form.minFee = parseFloat(tech.minFee) || 150000
  } else {
    editingTech.value = null
    form.name = ''
    form.phone = ''
    form.type = 'FREELANCE'
    form.feeType = 'PERCENTAGE'
    form.feePercentage = 10
    form.minFee = 150000
  }
  showModal.value = true
}

const saveTechnician = async () => {
  saving.value = true
  try {
    if (editingTech.value) {
      await $fetch(`/api/technicians/${editingTech.value.id}`, {
        method: 'PUT',
        body: form,
      })
      showAlert('Teknisi berhasil diupdate!', 'success')
    } else {
      await $fetch('/api/technicians', {
        method: 'POST',
        body: form,
      })
      showAlert('Teknisi berhasil ditambahkan!', 'success')
    }
    showModal.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan teknisi', 'error')
  } finally {
    saving.value = false
  }
}

const deleteTechnician = async (tech: any) => {
  if (!confirm(`Hapus teknisi ${tech.name}?`)) return

  try {
    await $fetch(`/api/technicians/${tech.id}`, {
      method: 'DELETE',
    })
    showAlert('Teknisi berhasil dihapus', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menghapus teknisi', 'error')
  }
}
</script>
