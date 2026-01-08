<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Paket Produk</h1>
        <p class="text-base-content/60">Kelola paket bundling produk</p>
      </div>
      <NuxtLink to="/packages/create" class="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
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
        Buat Paket Baru
      </NuxtLink>
    </div>

    <!-- Search & Filter -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- View Toggle -->
          <div class="flex-none">
            <AppViewToggle v-model="viewMode" />
          </div>

          <!-- Search -->
          <div class="flex-1">
            <div class="form-control">
              <input
                v-model="search"
                type="text"
                placeholder="Cari paket..."
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-3 lg:flex-none lg:w-auto">
            <div class="form-control w-full sm:w-48">
              <select v-model="category" class="select select-bordered w-full">
                <option value="">Semua Kategori</option>
                <option value="CCTV">CCTV</option>
                <option value="NETWORK">Network</option>
                <option value="COMBO">Combo</option>
              </select>
            </div>
            <div class="form-control w-full sm:w-48">
              <select v-model="isActive" class="select select-bordered w-full">
                <option value="">Semua Status</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="col-span-full text-center py-8">
      <span class="loading loading-spinner"></span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!packagesData?.data?.length"
      class="col-span-full text-center py-12 text-base-content/60"
    >
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
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
      <p class="text-lg mb-2">Tidak ada paket</p>
      <p class="text-sm mb-4">Mulai dengan membuat paket baru.</p>
      <NuxtLink to="/packages/create" class="btn btn-primary">Buat Paket Baru</NuxtLink>
    </div>

    <!-- Packages Grid View -->
    <div
      v-else-if="viewMode === 'GRID'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
    >
      <div
        v-for="pkg in packagesData.data"
        :key="pkg.id"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow"
      >
        <div class="card-body p-4 sm:p-6">
          <!-- Header -->
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <h2 class="card-title text-base sm:text-lg">{{ pkg.name }}</h2>
              <div class="flex gap-2 mt-2">
                <span
                  v-if="pkg.category"
                  class="badge badge-sm"
                  :class="getCategoryBadge(pkg.category)"
                >
                  {{ pkg.category }}
                </span>
                <span
                  class="badge badge-sm"
                  :class="pkg.isActive ? 'badge-success' : 'badge-error'"
                >
                  {{ pkg.isActive ? 'Aktif' : 'Nonaktif' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <p v-if="pkg.description" class="text-sm text-base-content/60 line-clamp-2 mb-3">
            {{ pkg.description }}
          </p>

          <!-- Items Preview -->
          <div class="mb-3">
            <div class="text-xs font-medium text-base-content/60 mb-1">
              {{ pkg.items?.length || 0 }} item
            </div>
            <div class="space-y-1">
              <div
                v-for="(item, idx) in pkg.items?.slice(0, 3)"
                :key="idx"
                class="text-xs text-base-content/80"
              >
                • {{ item.name }} ({{ item.quantity }} {{ item.unit }})
              </div>
              <div v-if="pkg.items && pkg.items.length > 3" class="text-xs text-base-content/60">
                +{{ pkg.items.length - 3 }} item lainnya
              </div>
            </div>
          </div>

          <!-- Price -->
          <div class="flex justify-between items-center pt-3 border-t border-base-200">
            <div>
              <div class="text-xs text-base-content/60">Total Harga</div>
              <div class="text-lg font-bold text-primary">
                {{ formatCurrency(pkg.totalPrice) }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="card-actions justify-end mt-4">
            <NuxtLink :to="`/packages/${pkg.id}`" class="btn btn-sm btn-ghost">Detail</NuxtLink>
            <button @click="confirmDelete(pkg)" class="btn btn-sm btn-error btn-outline">
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Packages List View -->
    <div v-else-if="viewMode === 'LIST'" class="space-y-4">
      <div
        v-for="pkg in packagesData.data"
        :key="pkg.id"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow"
      >
        <div class="card-body p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-start gap-3">
                <div class="flex-1">
                  <h2 class="text-lg font-bold">{{ pkg.name }}</h2>
                  <p v-if="pkg.description" class="text-sm text-base-content/60 mt-1">
                    {{ pkg.description }}
                  </p>
                  <div class="flex gap-2 mt-2">
                    <span
                      v-if="pkg.category"
                      class="badge badge-sm"
                      :class="getCategoryBadge(pkg.category)"
                    >
                      {{ pkg.category }}
                    </span>
                    <span
                      class="badge badge-sm"
                      :class="pkg.isActive ? 'badge-success' : 'badge-error'"
                    >
                      {{ pkg.isActive ? 'Aktif' : 'Nonaktif' }}
                    </span>
                    <span class="badge badge-sm badge-ghost">
                      {{ pkg.items?.length || 0 }} item
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div class="text-right">
                <div class="text-xs text-base-content/60">Total Harga</div>
                <div class="text-xl font-bold text-primary">
                  {{ formatCurrency(pkg.totalPrice) }}
                </div>
              </div>
              <div class="flex gap-2">
                <NuxtLink :to="`/packages/${pkg.id}`" class="btn btn-sm btn-ghost">Detail</NuxtLink>
                <button @click="confirmDelete(pkg)" class="btn btn-sm btn-error btn-outline">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="packagesData?.meta?.total" class="mt-6">
      <AppPagination :total="packagesData.meta.total" :per-page="10" v-model:current-page="page" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { formatCurrency } = useFormatter()
const { success, error: showError } = useAlert()
const { confirm } = useConfirm()

const search = ref('')
const category = ref('')
const isActive = ref('')
const page = ref(1)
const viewMode = ref<'GRID' | 'LIST'>('GRID')

const {
  data: packagesData,
  pending,
  refresh,
} = await useFetch('/api/packages', {
  query: {
    search,
    category,
    isActive,
    page,
  },
  watch: [search, category, isActive, page],
})

const getCategoryBadge = (cat: string) => {
  const badges: Record<string, string> = {
    CCTV: 'badge-primary',
    NETWORK: 'badge-secondary',
    COMBO: 'badge-accent',
  }
  return badges[cat] || 'badge-ghost'
}

const confirmDelete = async (pkg: any) => {
  const confirmed = await confirm(
    `Hapus paket "${pkg.name}"?`,
    'Paket dan semua item di dalamnya akan dihapus. Aksi ini tidak dapat dibatalkan.'
  )

  if (confirmed) {
    try {
      await $fetch(`/api/packages/${pkg.id}`, { method: 'DELETE' })
      success('Paket berhasil dihapus')
      refresh()
    } catch (err: any) {
      showError(err.data?.message || 'Gagal menghapus paket')
    }
  }
}
</script>
