<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Pelanggan</h1>
        <p class="text-base-content/60">Kelola data pelanggan</p>
      </div>
      <NuxtLink to="/customers/create" class="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
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
        Tambah Pelanggan
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
                placeholder="Cari nama, perusahaan, telepon..."
                class="input input-bordered w-full"
                @input="debouncedSearch"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Grid -->
    <div v-if="viewMode === 'GRID'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="pending" class="col-span-full text-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div
        v-else-if="!customers?.data?.length"
        class="col-span-full text-center py-12 text-base-content/60"
      >
        <p>Belum ada pelanggan</p>
      </div>

      <div
        v-for="customer in customers?.data"
        :key="customer.id"
        class="card bg-base-100 shadow hover:shadow-md transition-shadow cursor-pointer"
        @click="navigateTo(`/customers/${customer.id}`)"
      >
        <div class="card-body p-5">
          <div class="flex justify-between items-start">
            <div class="font-bold text-lg">{{ customer.name }}</div>
            <div class="badge badge-ghost">{{ customer._count?.projects || 0 }} Proyek</div>
          </div>

          <div v-if="customer.companyName" class="text-sm font-medium text-base-content/70 mb-2">
            {{ customer.companyName }}
          </div>

          <div class="text-sm space-y-1 mb-4">
            <div v-if="customer.phone" class="flex items-center gap-2 text-base-content/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"
                />
              </svg>
              <span>{{ customer.phone }}</span>
            </div>
            <div v-if="customer.email" class="flex items-center gap-2 text-base-content/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span>{{ customer.email }}</span>
            </div>
            <div v-if="customer.address" class="flex items-center gap-2 text-base-content/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="truncate">{{ customer.address }}</span>
            </div>
          </div>

          <div class="card-actions justify-end mt-auto">
            <button @click.stop="confirmDelete(customer)" class="btn btn-ghost btn-sm text-error">
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer List -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kontak</th>
                <th>Alamat</th>
                <th class="text-center">Proyek</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pending" class="text-center">
                <td colspan="5" class="py-8">
                  <span class="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
              <tr v-else-if="!customers?.data?.length" class="text-center">
                <td colspan="5" class="py-8 text-base-content/60">
                  <p>Belum ada pelanggan</p>
                </td>
              </tr>
              <tr
                v-for="customer in customers?.data"
                :key="customer.id"
                class="hover cursor-pointer"
                @click="navigateTo(`/customers/${customer.id}`)"
              >
                <td>
                  <div>
                    <p class="font-medium">{{ customer.name }}</p>
                    <p v-if="customer.companyName" class="text-sm text-base-content/60">
                      {{ customer.companyName }}
                    </p>
                  </div>
                </td>
                <td>
                  <div>
                    <p class="font-mono text-sm">{{ customer.phone }}</p>
                    <p v-if="customer.email" class="text-sm text-base-content/60">
                      {{ customer.email }}
                    </p>
                  </div>
                </td>
                <td>
                  <p class="max-w-xs truncate">{{ customer.address }}</p>
                </td>
                <td class="text-center">
                  <span class="badge badge-ghost">{{ customer._count?.projects || 0 }}</span>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-1" @click.stop>
                    <NuxtLink
                      :to="`/customers/${customer.id}`"
                      class="btn btn-ghost btn-sm btn-square"
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </NuxtLink>
                    <button
                      @click="confirmDelete(customer)"
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

    <!-- Pagination (moved outside) -->
    <div v-if="customers?.meta?.totalPages > 1" class="flex justify-center">
      <div class="join bg-base-100 shadow border border-base-200">
        <button class="join-item btn btn-sm" :disabled="page <= 1" @click="page--">«</button>
        <button class="join-item btn btn-sm pointer-events-none bg-base-100">
          Halaman {{ page }} dari {{ customers?.meta?.totalPages }}
        </button>
        <button
          class="join-item btn btn-sm"
          :disabled="page >= customers?.meta?.totalPages"
          @click="page++"
        >
          »
        </button>
      </div>
    </div>

    <!-- Delete Modal -->
    <dialog ref="deleteModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Hapus Pelanggan</h3>
        <p class="py-4">
          Apakah Anda yakin ingin menghapus
          <strong>{{ customerToDelete?.name }}</strong>
          ?
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="deleteModal?.close()">Batal</button>
          <button class="btn btn-error" :disabled="deleting" @click="deleteCustomer">
            <span v-if="deleting" class="loading loading-spinner loading-sm"></span>
            Hapus
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const { success, error: showError } = useAlert()

const search = ref('')
const viewMode = ref<'GRID' | 'LIST'>('GRID')
const page = ref(1)
const deleteModal = ref<HTMLDialogElement>()
const customerToDelete = ref<any>(null)
const deleting = ref(false)

const {
  data: customers,
  pending,
  refresh,
} = await useFetch('/api/customers', {
  query: {
    search,
    page,
    limit: 10,
  },
  watch: [page],
})

const debouncedSearch = useDebounceFn(() => {
  page.value = 1
  refresh()
}, 300)

const confirmDelete = (customer: any) => {
  customerToDelete.value = customer
  deleteModal.value?.showModal()
}

const deleteCustomer = async () => {
  if (!customerToDelete.value) return

  deleting.value = true
  try {
    await $fetch(`/api/customers/${customerToDelete.value.id}`, {
      method: 'DELETE',
    })
    success('Pelanggan berhasil dihapus')
    deleteModal.value?.close()
    refresh()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal menghapus pelanggan')
  } finally {
    deleting.value = false
  }
}
</script>
