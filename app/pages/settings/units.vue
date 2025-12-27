<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Master Satuan</h1>
        <p class="text-base-content/60">Kelola satuan dan konversi</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <!-- Units List -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0"
          >
            <h2 class="card-title text-lg sm:text-xl">Daftar Satuan</h2>
            <div class="flex gap-2 w-full sm:w-auto">
              <div class="flex-none">
                <AppViewToggle v-model="viewMode" />
              </div>
              <button
                @click="showAddUnit = true"
                class="btn btn-primary btn-sm flex-1 sm:flex-none"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Tambah
              </button>
            </div>
          </div>

          <!-- Add Unit Form -->
          <div v-if="showAddUnit" class="bg-base-200 p-3 sm:p-4 rounded-lg mt-4">
            <h3 class="font-semibold mb-3 text-sm sm:text-base">Tambah Satuan Baru</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <input
                v-model="newUnit.name"
                type="text"
                placeholder="Nama (pcs, box)"
                class="input input-bordered input-sm"
              />
              <input
                v-model="newUnit.symbol"
                type="text"
                placeholder="Simbol"
                class="input input-bordered input-sm"
              />
              <input
                v-model="newUnit.description"
                type="text"
                placeholder="Deskripsi (opsional)"
                class="input input-bordered input-sm sm:col-span-2"
              />
              <label class="label cursor-pointer justify-start gap-2 sm:col-span-2">
                <input
                  v-model="newUnit.isBase"
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-primary"
                />
                <span class="label-text">Satuan dasar</span>
              </label>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 mt-3">
              <button @click="showAddUnit = false" class="btn btn-ghost btn-sm w-full sm:w-auto">
                Batal
              </button>
              <button
                @click="addUnit"
                class="btn btn-primary btn-sm w-full sm:w-auto"
                :disabled="!newUnit.name || !newUnit.symbol"
              >
                Simpan
              </button>
            </div>
          </div>

          <!-- Units Grid -->
          <div v-if="viewMode === 'GRID'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div v-if="!units?.length" class="col-span-full text-center text-base-content/60 py-8">
              Belum ada satuan
            </div>
            <div
              v-for="unit in units"
              :key="unit.id"
              class="card bg-base-200 border border-base-300"
            >
              <div class="card-body p-4">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="font-bold text-base">{{ unit.name }}</h3>
                    <p class="text-sm text-base-content/60 mt-1">{{ unit.symbol }}</p>
                    <p v-if="unit.description" class="text-xs text-base-content/50 mt-1">
                      {{ unit.description }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="unit.isBase" class="badge badge-primary badge-sm">Base</span>
                    <button @click="deleteUnit(unit.id)" class="btn btn-ghost btn-xs text-error">
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
                </div>
              </div>
            </div>
          </div>

          <!-- Units Table -->
          <div v-else class="overflow-x-auto mt-4">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Simbol</th>
                  <th>Deskripsi</th>
                  <th>Base</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="unit in units" :key="unit.id" class="hover">
                  <td class="font-medium">{{ unit.name }}</td>
                  <td>{{ unit.symbol }}</td>
                  <td class="text-sm text-base-content/60">{{ unit.description || '-' }}</td>
                  <td>
                    <span v-if="unit.isBase" class="badge badge-primary badge-sm">Base</span>
                  </td>
                  <td>
                    <button @click="deleteUnit(unit.id)" class="btn btn-ghost btn-xs text-error">
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
                  </td>
                </tr>
                <tr v-if="!units?.length">
                  <td colspan="5" class="text-center text-base-content/60 py-8">
                    Belum ada satuan
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Conversions -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center">
            <h2 class="card-title">Konversi Satuan</h2>
            <button
              @click="showAddConversion = true"
              class="btn btn-primary btn-sm"
              :disabled="!units?.length"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tambah
            </button>
          </div>

          <!-- Add Conversion Form -->
          <div v-if="showAddConversion" class="bg-base-200 p-4 rounded-lg mt-4">
            <h3 class="font-semibold mb-3">Tambah Konversi</h3>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm">1</span>
              <select
                v-model="newConversion.fromUnitId"
                class="select select-bordered select-sm w-28"
              >
                <option value="">Dari</option>
                <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
              <span class="text-sm">=</span>
              <input
                v-model.number="newConversion.factor"
                type="number"
                step="0.0001"
                min="0"
                placeholder="Faktor"
                class="input input-bordered input-sm w-24"
              />
              <select
                v-model="newConversion.toUnitId"
                class="select select-bordered select-sm w-28"
              >
                <option value="">Ke</option>
                <option
                  v-for="u in units"
                  :key="u.id"
                  :value="u.id"
                  :disabled="u.id === newConversion.fromUnitId"
                >
                  {{ u.name }}
                </option>
              </select>
            </div>
            <input
              v-model="newConversion.notes"
              type="text"
              placeholder="Catatan (contoh: 1 box kabel = 305 meter)"
              class="input input-bordered input-sm w-full mt-2"
            />
            <div class="flex gap-2 mt-3">
              <button @click="showAddConversion = false" class="btn btn-ghost btn-sm">Batal</button>
              <button
                @click="addConversion"
                class="btn btn-primary btn-sm"
                :disabled="
                  !newConversion.fromUnitId || !newConversion.toUnitId || !newConversion.factor
                "
              >
                Simpan
              </button>
            </div>
          </div>

          <!-- Conversions List -->
          <div class="space-y-2 mt-4">
            <div
              v-for="conv in conversions"
              :key="conv.id"
              class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
            >
              <div>
                <p class="font-medium">
                  1 {{ conv.fromUnit.name }} = {{ conv.factor }} {{ conv.toUnit.name }}
                </p>
                <p v-if="conv.notes" class="text-xs text-base-content/60">{{ conv.notes }}</p>
              </div>
              <button @click="deleteConversion(conv.id)" class="btn btn-ghost btn-xs text-error">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div v-if="!conversions?.length" class="text-center text-base-content/60 py-8">
              Belum ada konversi
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversion Calculator -->
    <div class="card bg-base-100 shadow-xl max-w-xl">
      <div class="card-body">
        <h2 class="card-title">Kalkulator Konversi</h2>
        <div class="flex items-center gap-3 flex-wrap">
          <input
            v-model.number="calcQuantity"
            type="number"
            min="0"
            placeholder="Jumlah"
            class="input input-bordered input-sm w-24"
          />
          <select v-model="calcFromUnit" class="select select-bordered select-sm w-28">
            <option value="">Dari</option>
            <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
          <span class="text-lg">=</span>
          <div class="font-bold text-primary text-lg min-w-24">
            {{ calcResult !== null ? calcResult.toFixed(2) : '?' }}
          </div>
          <select v-model="calcToUnit" class="select select-bordered select-sm w-28">
            <option value="">Ke</option>
            <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
          <button
            @click="calculate"
            class="btn btn-primary btn-sm"
            :disabled="!calcQuantity || !calcFromUnit || !calcToUnit"
          >
            Hitung
          </button>
        </div>
        <p v-if="calcError" class="text-error text-sm mt-2">{{ calcError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { success, error: showError } = useAlert()

const viewMode = ref<'GRID' | 'LIST'>('GRID')

// Fetch data
const { data: units, refresh: refreshUnits } = await useFetch('/api/units')
const { data: conversions, refresh: refreshConversions } = await useFetch('/api/units/conversions')

// Add Unit
const showAddUnit = ref(false)
const newUnit = reactive({
  name: '',
  symbol: '',
  description: '',
  isBase: false,
})

const addUnit = async () => {
  try {
    await $fetch('/api/units', {
      method: 'POST',
      body: newUnit,
    })
    success('Satuan berhasil ditambahkan')
    showAddUnit.value = false
    newUnit.name = ''
    newUnit.symbol = ''
    newUnit.description = ''
    newUnit.isBase = false
    refreshUnits()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal menambahkan satuan')
  }
}

const deleteUnit = async (id: string) => {
  if (!confirm('Hapus satuan ini?')) return
  try {
    await $fetch(`/api/units/${id}`, { method: 'DELETE' })
    success('Satuan berhasil dihapus')
    refreshUnits()
    refreshConversions()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal menghapus satuan')
  }
}

// Add Conversion
const showAddConversion = ref(false)
const newConversion = reactive({
  fromUnitId: '',
  toUnitId: '',
  factor: null as number | null,
  notes: '',
})

const addConversion = async () => {
  try {
    await $fetch('/api/units/conversions', {
      method: 'POST',
      body: newConversion,
    })
    success('Konversi berhasil ditambahkan')
    showAddConversion.value = false
    newConversion.fromUnitId = ''
    newConversion.toUnitId = ''
    newConversion.factor = null
    newConversion.notes = ''
    refreshConversions()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal menambahkan konversi')
  }
}

const deleteConversion = async (id: string) => {
  if (!confirm('Hapus konversi ini?')) return
  try {
    await $fetch(`/api/units/conversions/${id}`, { method: 'DELETE' })
    success('Konversi berhasil dihapus')
    refreshConversions()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal menghapus konversi')
  }
}

// Calculator
const calcQuantity = ref<number | null>(null)
const calcFromUnit = ref('')
const calcToUnit = ref('')
const calcResult = ref<number | null>(null)
const calcError = ref('')

const calculate = async () => {
  calcError.value = ''
  calcResult.value = null

  if (calcFromUnit.value === calcToUnit.value) {
    calcResult.value = calcQuantity.value
    return
  }

  try {
    const result = await $fetch('/api/units/convert', {
      method: 'POST',
      body: {
        fromUnitId: calcFromUnit.value,
        toUnitId: calcToUnit.value,
        quantity: calcQuantity.value,
      },
    })
    calcResult.value = (result as any).toQuantity
  } catch (err: any) {
    calcError.value = err.data?.message || 'Tidak ada konversi antar satuan ini'
  }
}
</script>
