<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Bonus Teknisi</h1>
        <p class="text-gray-600 mt-1">Kelola bonus dan insentif teknisi</p>
      </div>
      <button
        class="btn btn-primary"
        @click="openAddDialog"
        v-if="user?.role === 'ADMIN' || user?.role === 'OWNER'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
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
        Tambah Bonus
      </button>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-lg mb-6">
      <div class="card-body py-4 flex-row items-center gap-4">
        <!-- View Toggle -->
        <AppViewToggle v-model="viewMode" />

        <!-- Technician Filter -->
        <select v-model="selectedTechnician" class="select select-bordered">
          <option value="">Semua Teknisi</option>
          <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
            {{ tech.name }}
          </option>
        </select>

        <!-- Type Filter -->
        <select v-model="selectedType" class="select select-bordered">
          <option value="">Semua Tipe</option>
          <option value="HOLIDAY">Hari Raya</option>
          <option value="PERFORMANCE">Performa</option>
          <option value="PROJECT">Proyek</option>
          <option value="OTHER">Lainnya</option>
        </select>

        <!-- Period Filter -->
        <input
          v-model="selectedPeriod"
          type="month"
          class="input input-bordered"
          placeholder="Periode"
        />

        <!-- Refresh Button -->
        <button class="btn btn-square btn-ghost" @click="loadBonuses" :disabled="loading">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            :class="{ 'animate-spin': loading }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Bonuses Grid View -->
    <div v-if="viewMode === 'GRID'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="loading" class="col-span-full flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="bonuses.length === 0" class="col-span-full text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 mx-auto text-gray-400 mb-4"
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
        <p class="text-gray-500">Tidak ada data bonus</p>
      </div>

      <div v-else v-for="bonus in bonuses" :key="bonus.id" class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-bold text-lg">{{ bonus.technician.name }}</h3>
              <p class="text-sm text-gray-500">{{ bonus.technician.phone }}</p>
            </div>
            <span
              class="badge"
              :class="{
                'badge-success': bonus.bonusType === 'HOLIDAY',
                'badge-info': bonus.bonusType === 'PERFORMANCE',
                'badge-warning': bonus.bonusType === 'PROJECT',
                'badge-neutral': bonus.bonusType === 'OTHER',
              }"
            >
              {{
                bonus.bonusType === 'HOLIDAY'
                  ? 'Hari Raya'
                  : bonus.bonusType === 'PERFORMANCE'
                    ? 'Performa'
                    : bonus.bonusType === 'PROJECT'
                      ? 'Proyek'
                      : 'Lainnya'
              }}
            </span>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tanggal:</span>
              <span class="font-medium">{{ formatDate(bonus.date) }}</span>
            </div>
            <div class="text-sm">
              <span class="text-gray-600">Deskripsi:</span>
              <p class="font-medium mt-1">{{ bonus.description }}</p>
            </div>
            <div class="flex justify-between text-sm" v-if="bonus.period">
              <span class="text-gray-600">Periode:</span>
              <span class="font-medium">{{ bonus.period }}</span>
            </div>
            <div class="divider my-2"></div>
            <div class="flex justify-between">
              <span class="text-gray-600">Jumlah:</span>
              <span class="font-bold text-success text-lg">{{ formatCurrency(bonus.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bonuses Table -->
    <div v-else class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div v-if="loading" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="bonuses.length === 0" class="text-center py-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 mx-auto text-gray-400 mb-4"
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
          <p class="text-gray-500">Tidak ada data bonus</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Teknisi</th>
                <th>Tipe</th>
                <th>Deskripsi</th>
                <th>Periode</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bonus in bonuses" :key="bonus.id">
                <td>{{ formatDate(bonus.date) }}</td>
                <td>
                  <div class="font-semibold">{{ bonus.technician.name }}</div>
                  <div class="text-sm text-gray-500">{{ bonus.technician.phone }}</div>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="{
                      'badge-success': bonus.bonusType === 'HOLIDAY',
                      'badge-info': bonus.bonusType === 'PERFORMANCE',
                      'badge-warning': bonus.bonusType === 'PROJECT',
                      'badge-neutral': bonus.bonusType === 'OTHER',
                    }"
                  >
                    {{
                      bonus.bonusType === 'HOLIDAY'
                        ? 'Hari Raya'
                        : bonus.bonusType === 'PERFORMANCE'
                          ? 'Performa'
                          : bonus.bonusType === 'PROJECT'
                            ? 'Proyek'
                            : 'Lainnya'
                    }}
                  </span>
                </td>
                <td>{{ bonus.description }}</td>
                <td>{{ bonus.period || '-' }}</td>
                <td class="font-bold text-success">{{ formatCurrency(bonus.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Bonus Dialog -->
    <dialog ref="addDialog" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Tambah Bonus</h3>
        <form @submit.prevent="addBonus">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Teknisi</span>
            </label>
            <select v-model="form.technicianId" class="select select-bordered w-full" required>
              <option value="">Pilih Teknisi</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                {{ tech.name }}
              </option>
            </select>
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Tipe Bonus</span>
            </label>
            <select v-model="form.bonusType" class="select select-bordered w-full" required>
              <option value="">Pilih Tipe</option>
              <option value="HOLIDAY">Hari Raya</option>
              <option value="PERFORMANCE">Performa</option>
              <option value="PROJECT">Proyek</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Jumlah</span>
            </label>
            <input
              v-model.number="form.amount"
              type="number"
              class="input input-bordered w-full"
              placeholder="Masukkan jumlah bonus"
              required
              min="0"
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Deskripsi</span>
            </label>
            <textarea
              v-model="form.description"
              class="textarea textarea-bordered w-full"
              placeholder="Deskripsi bonus"
              rows="2"
              required
            ></textarea>
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Periode (YYYY-MM) - Opsional</span>
            </label>
            <input v-model="form.period" type="month" class="input input-bordered w-full" />
            <label class="label">
              <span class="label-text-alt">Kosongkan jika bukan bonus bulanan</span>
            </label>
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Tanggal</span>
            </label>
            <input v-model="form.date" type="date" class="input input-bordered w-full" required />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Catatan (Opsional)</span>
            </label>
            <textarea
              v-model="form.notes"
              class="textarea textarea-bordered w-full"
              placeholder="Catatan tambahan"
              rows="2"
            ></textarea>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeAddDialog">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner"></span>
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useAuth } from '~/composables/useAuth'
import { useFormatter } from '~/composables/useFormatter'
import { useAlert } from '~/composables/useAlert'

const { user } = useAuth()
const { formatCurrency, formatDate } = useFormatter()
const { showAlert } = useAlert()

definePageMeta({
  layout: 'default',
})

const loading = ref(false)
const saving = ref(false)
const viewMode = ref<'GRID' | 'LIST'>('LIST')
const bonuses = ref<any[]>([])
const technicians = ref<any[]>([])
const selectedTechnician = ref('')
const selectedType = ref('')
const selectedPeriod = ref('')
const addDialog = ref<HTMLDialogElement>()

const form = ref({
  technicianId: '',
  bonusType: '',
  amount: 0,
  description: '',
  period: '',
  date: dayjs().format('YYYY-MM-DD'),
  notes: '',
})

onMounted(async () => {
  await loadTechnicians()
  await loadBonuses()
})

async function loadTechnicians() {
  try {
    const data = await $fetch('/api/technicians')
    technicians.value = data
  } catch (error) {
    console.error('Failed to load technicians:', error)
    showAlert('error', 'Gagal memuat data teknisi')
  }
}

async function loadBonuses() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (selectedTechnician.value) params.append('technicianId', selectedTechnician.value)
    if (selectedType.value) params.append('bonusType', selectedType.value)
    if (selectedPeriod.value) params.append('period', selectedPeriod.value)

    const data = await $fetch(`/api/technicians/bonuses?${params.toString()}`)
    bonuses.value = data
  } catch (error) {
    console.error('Failed to load bonuses:', error)
    showAlert('error', 'Gagal memuat data bonus')
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  form.value = {
    technicianId: '',
    bonusType: '',
    amount: 0,
    description: '',
    period: '',
    date: dayjs().format('YYYY-MM-DD'),
    notes: '',
  }
  addDialog.value?.showModal()
}

function closeAddDialog() {
  addDialog.value?.close()
}

async function addBonus() {
  saving.value = true
  try {
    await $fetch('/api/technicians/bonuses', {
      method: 'POST',
      body: form.value,
    })

    showAlert('success', 'Bonus berhasil ditambahkan')
    closeAddDialog()
    await loadBonuses()
  } catch (error) {
    console.error('Failed to add bonus:', error)
    showAlert('error', 'Gagal menambahkan bonus')
  } finally {
    saving.value = false
  }
}
</script>
