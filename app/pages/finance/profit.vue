<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">Analisis Profit Per Proyek</h1>
      <p class="text-base-content/60">Perhitungan margin, kas usaha, dan upah teknisi</p>
    </div>

    <!-- Filter -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-3 flex-1">
            <div class="form-control w-full sm:w-48">
              <select v-model="filterStatus" class="select select-bordered w-full">
                <option value="">Semua Status</option>
                <option value="APPROVED">Disetujui</option>
                <option value="ONGOING">Berjalan</option>
                <option value="COMPLETED">Selesai</option>
                <option value="PAID">Lunas</option>
              </select>
            </div>
            <div class="form-control w-full sm:flex-1">
              <input
                v-model="filterDateFrom"
                type="date"
                class="input input-bordered w-full"
                placeholder="Dari Tanggal"
              />
            </div>
            <div class="form-control w-full sm:flex-1">
              <input
                v-model="filterDateTo"
                type="date"
                class="input input-bordered w-full"
                placeholder="Sampai Tanggal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Total Nilai Proyek</div>
        <div class="stat-value text-primary text-2xl">
          {{ formatCurrency(summary.totalRevenue) }}
        </div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Total HPP</div>
        <div class="stat-value text-error text-2xl">{{ formatCurrency(summary.totalCost) }}</div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Total Margin</div>
        <div class="stat-value text-success text-2xl">
          {{ formatCurrency(summary.totalMargin) }}
        </div>
      </div>
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-title">Margin %</div>
        <div class="stat-value text-2xl">{{ summary.marginPercentage }}%</div>
      </div>
    </div>

    <!-- Projects List -->
    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow"
      >
        <div class="card-body">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex-1">
              <h3 class="card-title text-lg">{{ project.projectNumber }} - {{ project.title }}</h3>
              <p class="text-sm text-base-content/60">{{ project.customer?.name }}</p>
              <div class="flex gap-2 mt-2">
                <span class="badge badge-sm" :class="getStatusClass(project.status)">
                  {{ project.status }}
                </span>
                <span class="badge badge-ghost badge-sm">
                  {{ project.technicians?.length || 0 }} Teknisi
                </span>
              </div>
            </div>
            <button @click="toggleDetail(project.id)" class="btn btn-sm btn-outline">
              {{ expandedProjects.includes(project.id) ? 'Sembunyikan' : 'Lihat Detail' }}
            </button>
          </div>

          <!-- Collapsed Summary -->
          <div
            v-if="!expandedProjects.includes(project.id)"
            class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t"
          >
            <div>
              <p class="text-xs text-base-content/60">Nilai Project</p>
              <p class="font-bold text-primary">
                {{ formatCurrency(project.finalPrice || project.budget) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">HPP</p>
              <p class="font-bold text-error">{{ formatCurrency(calculateTotalHPP(project)) }}</p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">Margin</p>
              <p class="font-bold text-success">{{ formatCurrency(calculateMargin(project)) }}</p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">Margin %</p>
              <p class="font-bold">{{ calculateMarginPercentage(project) }}%</p>
            </div>
          </div>

          <!-- Expanded Detail -->
          <div v-else class="mt-4 pt-4 border-t space-y-4">
            <!-- Pengaturan Kas Usaha -->
            <div class="bg-base-200 p-4 rounded-lg">
              <div
                class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div class="flex-1">
                  <h4 class="font-semibold mb-2">Pengaturan Kas Usaha</h4>
                  <p class="text-sm text-base-content/60">
                    Persentase margin yang dialokasikan untuk kas usaha (default 30-35%)
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="project.businessCashPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    class="input input-bordered w-20 text-center"
                  />
                  <span class="font-bold">%</span>
                  <button
                    @click="updateBusinessCashPercentage(project)"
                    class="btn btn-primary btn-sm"
                    :disabled="savingProject === project.id"
                  >
                    <span
                      v-if="savingProject === project.id"
                      class="loading loading-spinner loading-xs"
                    ></span>
                    <span v-else>Simpan</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Perhitungan Detail -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Kiri: Perhitungan -->
              <div class="space-y-3">
                <h4 class="font-semibold">Perhitungan Profit</h4>

                <div class="bg-base-200 p-3 rounded">
                  <div class="flex justify-between mb-1">
                    <span class="text-sm">Total Nilai Project</span>
                    <span class="font-mono font-bold text-primary">
                      {{ formatCurrency(project.finalPrice || project.budget) }}
                    </span>
                  </div>
                </div>

                <div class="bg-base-200 p-3 rounded">
                  <div class="flex justify-between mb-1">
                    <span class="text-sm">HPP (Biaya Aktual)</span>
                    <span class="font-mono font-bold text-error">
                      - {{ formatCurrency(calculateTotalHPP(project)) }}
                    </span>
                  </div>
                  <div class="text-xs text-base-content/60 mt-2">
                    <div>• Biaya Item: {{ formatCurrency(calculateItemCost(project)) }}</div>
                    <div>
                      • Biaya Operasional: {{ formatCurrency(calculateExpenseCost(project)) }}
                    </div>
                  </div>
                </div>

                <div class="divider my-2"></div>

                <div class="bg-success/10 p-3 rounded border border-success">
                  <div class="flex justify-between mb-1">
                    <span class="font-semibold">Margin Kotor</span>
                    <span class="font-mono font-bold text-success text-lg">
                      {{ formatCurrency(calculateMargin(project)) }}
                    </span>
                  </div>
                  <div class="text-xs text-success/70">
                    {{ calculateMarginPercentage(project) }}% dari nilai project
                  </div>
                </div>

                <div class="bg-primary/10 p-3 rounded border border-primary">
                  <div class="flex justify-between mb-1">
                    <span class="font-semibold">
                      Kas Usaha ({{ project.businessCashPercentage || 30 }}%)
                    </span>
                    <span class="font-mono font-bold text-primary">
                      {{ formatCurrency(calculateBusinessCash(project)) }}
                    </span>
                  </div>
                </div>

                <div class="divider my-2"></div>

                <div class="bg-warning/10 p-3 rounded border border-warning">
                  <div class="flex justify-between mb-1">
                    <span class="font-semibold">Total Upah Teknisi</span>
                    <span class="font-mono font-bold text-warning text-lg">
                      {{ formatCurrency(calculateTechnicianWage(project)) }}
                    </span>
                  </div>
                  <div class="text-xs text-warning/70">Sisa margin setelah kas usaha</div>
                </div>
              </div>

              <!-- Kanan: Pembagian Teknisi -->
              <div class="space-y-3">
                <h4 class="font-semibold">Pembagian Upah Teknisi</h4>

                <div
                  v-if="!project.technicians?.length"
                  class="text-center py-8 text-base-content/60"
                >
                  Belum ada teknisi yang ditugaskan
                </div>

                <div v-else class="space-y-2">
                  <div
                    v-for="tech in project.technicians"
                    :key="tech.id"
                    class="bg-base-200 p-3 rounded"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1">
                        <p class="font-semibold">{{ tech.technician?.name }}</p>
                        <p class="text-xs text-base-content/60">
                          {{ tech.technician?.type }}
                        </p>
                      </div>
                      <div class="flex items-center gap-2">
                        <div
                          class="badge badge-sm"
                          :class="tech.isPaid ? 'badge-success' : 'badge-warning'"
                        >
                          {{ tech.isPaid ? 'Lunas' : 'Belum Bayar' }}
                        </div>
                        <button
                          v-if="!tech.isPaid"
                          @click="openSavePaymentModal(tech, project)"
                          class="btn btn-xs btn-primary"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>

                    <div class="text-sm">
                      <div class="flex justify-between mb-1">
                        <span class="text-base-content/60">Fee yang didapat:</span>
                        <span class="font-mono font-bold text-success">
                          {{ formatCurrency(calculateTechFee(tech, project)) }}
                        </span>
                      </div>
                      <div class="text-xs text-base-content/60">
                        <!-- Jika fee sudah di-assign -->
                        <div v-if="tech.feeType === 'PERCENTAGE'">
                          <div class="badge badge-success badge-xs">Fee Persentase</div>
                          <div class="mt-1">
                            {{ tech.fee }}% dari Total Upah Teknisi
                            <div class="text-xs opacity-70">
                              {{ tech.fee }}% ×
                              {{ formatCurrency(calculateTechnicianWage(project)) }}
                            </div>
                            <div class="text-warning">
                              (Min: {{ formatCurrency(tech.technician?.minFee || 0) }})
                            </div>
                          </div>
                        </div>
                        <div v-else-if="tech.feeType === 'FIXED'">
                          <div class="badge badge-info badge-xs">Fee Tetap</div>
                          <div class="mt-1">{{ formatCurrency(tech.fee) }}</div>
                        </div>
                        <div v-else-if="tech.fee && Number(tech.fee) > 0">
                          <div class="badge badge-primary badge-xs">Fee Custom</div>
                          <div class="mt-1">Sesuai kesepakatan</div>
                        </div>
                        <!-- Jika fee dihitung dari master teknisi -->
                        <div v-else>
                          <div class="badge badge-warning badge-xs">Estimasi dari Master</div>
                          <div v-if="tech.technician?.feeType === 'PERCENTAGE'" class="mt-1">
                            {{ tech.technician.feePercentage }}% dari Total Upah Teknisi
                            <div class="text-xs opacity-70">
                              {{ tech.technician.feePercentage }}% ×
                              {{ formatCurrency(calculateTechnicianWage(project)) }}
                            </div>
                            <div class="text-warning">
                              (Min: {{ formatCurrency(tech.technician.minFee) }})
                            </div>
                          </div>
                          <div v-else-if="tech.technician?.feeType === 'FIXED'" class="mt-1">
                            Fee tetap: {{ formatCurrency(tech.technician.minFee) }}
                          </div>
                          <div v-else class="mt-1">Custom per proyek (belum di-set)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="divider my-2"></div>

                  <div class="bg-warning/10 p-3 rounded border border-warning">
                    <div class="flex justify-between">
                      <span class="font-semibold">Total Fee Teknisi</span>
                      <span class="font-mono font-bold">
                        {{ formatCurrency(calculateTotalTechFee(project)) }}
                      </span>
                    </div>
                  </div>

                  <div class="alert alert-info py-2 text-xs">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Sisa upah teknisi:
                      {{
                        formatCurrency(
                          calculateTechnicianWage(project) - calculateTotalTechFee(project)
                        )
                      }}
                      dapat dialokasikan sesuai kesepakatan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!filteredProjects?.length" class="text-center py-12 text-base-content/60">
        <p class="text-lg">Tidak ada data proyek</p>
      </div>
    </div>

    <!-- Modal Simpan Pembayaran Teknisi -->
    <dialog class="modal" :class="{ 'modal-open': showPaymentModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Simpan Pembayaran Teknisi</h3>

        <div v-if="selectedTech" class="space-y-4">
          <!-- Info Teknisi -->
          <div class="bg-base-200 p-3 rounded">
            <p class="font-semibold">{{ selectedTech.technician?.name }}</p>
            <p class="text-sm text-base-content/60">{{ selectedTech.technician?.type }}</p>
            <p class="text-xs text-base-content/60 mt-1">
              Proyek: {{ selectedProject?.projectNumber }} - {{ selectedProject?.title }}
            </p>
          </div>

          <!-- Fee Calculated -->
          <div class="bg-success/10 p-3 rounded border border-success">
            <div class="flex justify-between items-center">
              <span class="text-sm">Fee dari Perhitungan:</span>
              <span class="font-mono font-bold text-success">
                {{ formatCurrency(calculatedFee) }}
              </span>
            </div>
          </div>

          <!-- Editable Amount -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Jumlah yang Dibayar</span>
            </label>
            <input
              v-model.number="paymentAmount"
              type="number"
              class="input input-bordered w-full"
              min="0"
              placeholder="Masukkan jumlah"
            />

            <!-- Rounding Buttons -->
            <div class="flex flex-wrap gap-2 mt-2">
              <div class="text-xs text-base-content/60 w-full mb-1">Pembulatan:</div>
              <div class="flex gap-1">
                <button
                  type="button"
                  @click="roundDown(1000)"
                  class="btn btn-xs btn-outline"
                  title="Bulatkan ke bawah (ribuan)"
                >
                  ↓ 1rb
                </button>
                <button
                  type="button"
                  @click="roundUp(1000)"
                  class="btn btn-xs btn-outline"
                  title="Bulatkan ke atas (ribuan)"
                >
                  ↑ 1rb
                </button>
              </div>
              <div class="flex gap-1">
                <button
                  type="button"
                  @click="roundDown(10000)"
                  class="btn btn-xs btn-outline"
                  title="Bulatkan ke bawah (puluhan ribu)"
                >
                  ↓ 10rb
                </button>
                <button
                  type="button"
                  @click="roundUp(10000)"
                  class="btn btn-xs btn-outline"
                  title="Bulatkan ke atas (puluhan ribu)"
                >
                  ↑ 10rb
                </button>
              </div>
              <div class="flex gap-1">
                <button
                  type="button"
                  @click="roundDown(50000)"
                  class="btn btn-xs btn-outline"
                  title="Bulatkan ke bawah (50 ribu)"
                >
                  ↓ 50rb
                </button>
                <button
                  type="button"
                  @click="roundUp(50000)"
                  class="btn btn-xs btn-outline"
                  title="Bulatkan ke atas (50 ribu)"
                >
                  ↑ 50rb
                </button>
              </div>
              <div class="flex gap-1">
                <button
                  type="button"
                  @click="roundDown(100000)"
                  class="btn btn-xs btn-outline"
                  title="Bulatkan ke bawah (ratusan ribu)"
                >
                  ↓ 100rb
                </button>
                <button
                  type="button"
                  @click="roundUp(100000)"
                  class="btn btn-xs btn-outline"
                  title="Bulatkan ke atas (ratusan ribu)"
                >
                  ↑ 100rb
                </button>
              </div>
            </div>

            <label class="label">
              <span class="label-text-alt text-base-content/60">
                Bisa diubah sesuai kesepakatan
              </span>
            </label>
          </div>

          <!-- Description -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Keterangan (opsional)</span>
            </label>
            <textarea
              v-model="paymentDescription"
              class="textarea textarea-bordered w-full"
              rows="2"
              placeholder="Keterangan pembayaran..."
            ></textarea>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="showPaymentModal = false">Batal</button>
          <button
            class="btn btn-primary"
            :disabled="savingPayment || !paymentAmount"
            @click="saveTechnicianPayment"
          >
            <span v-if="savingPayment" class="loading loading-spinner loading-sm"></span>
            <span v-else>Simpan Pembayaran</span>
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showPaymentModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { formatCurrency } = useFormatter()
const { showAlert } = useAlert()

const filterStatus = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const expandedProjects = ref<string[]>([])
const savingProject = ref<string | null>(null)

// Payment Modal State
const showPaymentModal = ref(false)
const selectedTech = ref<any>(null)
const selectedProject = ref<any>(null)
const paymentAmount = ref(0)
const paymentDescription = ref('')
const savingPayment = ref(false)
const calculatedFee = ref(0)

const { data: projects, pending, refresh } = await useFetch('/api/projects/profit-analysis')

const filteredProjects = computed(() => {
  if (!projects.value) return []

  let filtered = projects.value as any[]

  if (filterStatus.value) {
    filtered = filtered.filter(p => p.status === filterStatus.value)
  }

  if (filterDateFrom.value) {
    filtered = filtered.filter(p => new Date(p.createdAt) >= new Date(filterDateFrom.value))
  }

  if (filterDateTo.value) {
    filtered = filtered.filter(p => new Date(p.createdAt) <= new Date(filterDateTo.value))
  }

  return filtered
})

const summary = computed(() => {
  const totalRevenue = filteredProjects.value.reduce(
    (sum, p) => sum + Number(p.finalPrice || p.budget),
    0
  )
  const totalCost = filteredProjects.value.reduce((sum, p) => sum + calculateTotalHPP(p), 0)
  const totalMargin = totalRevenue - totalCost
  const marginPercentage =
    totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100).toFixed(2) : '0.00'

  return {
    totalRevenue,
    totalCost,
    totalMargin,
    marginPercentage,
  }
})

const calculateTotalHPP = (project: any) => {
  return calculateItemCost(project) + calculateExpenseCost(project)
}

const calculateMargin = (project: any) => {
  const revenue = Number(project.finalPrice || project.budget)
  const cost = calculateTotalHPP(project)
  return revenue - cost
}

const calculateMarginPercentage = (project: any) => {
  const revenue = Number(project.finalPrice || project.budget)
  const margin = calculateMargin(project)
  return revenue > 0 ? ((margin / revenue) * 100).toFixed(2) : '0.00'
}

const calculateBusinessCash = (project: any) => {
  const margin = calculateMargin(project)
  const percentage = project.businessCashPercentage || 30
  return margin * (percentage / 100)
}

const calculateTechnicianWage = (project: any) => {
  const margin = calculateMargin(project)
  const businessCash = calculateBusinessCash(project)
  return margin - businessCash
}

const calculateItemCost = (project: any) => {
  if (!project.items) return 0
  return project.items.reduce((sum: number, item: any) => sum + Number(item.totalCost || 0), 0)
}

const calculateExpenseCost = (project: any) => {
  if (!project.expenses) return 0
  return project.expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)
}

const calculateTotalTechFee = (project: any) => {
  if (!project.technicians) return 0
  return project.technicians.reduce((sum: number, tech: any) => {
    return sum + calculateTechFee(tech, project)
  }, 0)
}

const calculateTechFee = (tech: any, project: any) => {
  // Hitung total upah teknisi yang tersedia (margin - kas usaha)
  const totalTechnicianWage = calculateTechnicianWage(project)

  // Jika feeType adalah PERCENTAGE, hitung berdasarkan persentase dari upah teknisi
  if (tech.feeType === 'PERCENTAGE') {
    // Prioritas 1: Gunakan fee yang sudah di-assign (tersimpan di tech.fee)
    const percentage = Number(tech.fee || 0)
    const minFee = Number(tech.technician?.minFee || 0)
    const calculatedFee = totalTechnicianWage * (percentage / 100)
    return Math.max(calculatedFee, minFee)
  }

  // Jika feeType adalah FIXED atau CUSTOM, gunakan nilai nominal
  if (tech.feeType === 'FIXED') {
    // Untuk FIXED, fee adalah nilai nominal
    return Number(tech.fee || tech.technician?.minFee || 0)
  }

  // Fallback: hitung dari master technician
  const technician = tech.technician
  if (!technician) return 0

  if (technician.feeType === 'PERCENTAGE') {
    const percentage = Number(technician.feePercentage || 0)
    const minFee = Number(technician.minFee || 0)
    const calculatedFee = totalTechnicianWage * (percentage / 100)
    return Math.max(calculatedFee, minFee)
  } else if (technician.feeType === 'FIXED') {
    return Number(technician.minFee || 0)
  }

  return 0
}

const toggleDetail = (projectId: string) => {
  const index = expandedProjects.value.indexOf(projectId)
  if (index > -1) {
    expandedProjects.value.splice(index, 1)
  } else {
    expandedProjects.value.push(projectId)
  }
}

const updateBusinessCashPercentage = async (project: any) => {
  savingProject.value = project.id
  try {
    await $fetch(`/api/projects/${project.id}/business-cash`, {
      method: 'PUT',
      body: {
        businessCashPercentage: project.businessCashPercentage,
      },
    })
    showAlert('Persentase kas usaha berhasil diupdate', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengupdate persentase', 'error')
  } finally {
    savingProject.value = null
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
    CLOSED: 'badge-ghost',
  }
  return classes[status] || 'badge-ghost'
}

// Open payment modal
const openSavePaymentModal = (tech: any, project: any) => {
  selectedTech.value = tech
  selectedProject.value = project
  const fee = calculateTechFee(tech, project)
  calculatedFee.value = fee
  paymentAmount.value = fee
  paymentDescription.value = `Pembayaran fee proyek ${project.projectNumber}`
  showPaymentModal.value = true
}

// Save technician payment
const saveTechnicianPayment = async () => {
  if (!selectedTech.value || !paymentAmount.value) return

  savingPayment.value = true
  try {
    await $fetch('/api/technician-payments', {
      method: 'POST',
      body: {
        technicianId: selectedTech.value.technician?.id,
        projectId: selectedProject.value?.id,
        amount: paymentAmount.value,
        description: paymentDescription.value,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM format
        status: 'PENDING',
      },
    })

    showAlert('Pembayaran teknisi berhasil disimpan', 'success')
    showPaymentModal.value = false

    // Reset form
    selectedTech.value = null
    selectedProject.value = null
    paymentAmount.value = 0
    paymentDescription.value = ''

    // Refresh data
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan pembayaran', 'error')
  } finally {
    savingPayment.value = false
  }
}

const roundUp = (nearest: number) => {
  if (!paymentAmount.value) return
  paymentAmount.value = Math.ceil(paymentAmount.value / nearest) * nearest
}

const roundDown = (nearest: number) => {
  if (!paymentAmount.value) return
  paymentAmount.value = Math.floor(paymentAmount.value / nearest) * nearest
}
</script>
