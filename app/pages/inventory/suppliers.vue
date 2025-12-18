<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Supplier</h1>
        <p class="text-base-content/60">Kelola data supplier</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
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
        Tambah Supplier
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-4 flex-row items-center gap-4">
        <input
          v-model="search"
          type="text"
          placeholder="Cari supplier..."
          class="input input-bordered w-full"
        />
        <AppViewToggle v-model="viewMode" />
      </div>
    </div>

    <!-- Supplier Grid -->
    <div v-if="viewMode === 'GRID'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="col-span-full text-center py-12 text-base-content/60">
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <p class="text-lg">Belum ada supplier</p>
        <button @click="openAddModal" class="btn btn-primary mt-4">Tambah Supplier Pertama</button>
      </div>
    </div>

    <!-- Supplier List -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kontak</th>
                <th>Telepon</th>
                <th>Alamat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="5" class="text-center py-8 text-base-content/60">
                  Belum ada supplier
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { showAlert } = useAlert()

const search = ref('')
const viewMode = ref<'GRID' | 'LIST'>('GRID')

const openAddModal = () => {
  showAlert('Fitur supplier akan segera tersedia', 'info')
}
</script>
