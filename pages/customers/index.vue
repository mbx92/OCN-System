<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Pelanggan</h1>
        <p class="text-base-content/60">Kelola data pelanggan</p>
      </div>
      <NuxtLink to="/customers/create" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Pelanggan
      </NuxtLink>
    </div>

    <!-- Search -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="form-control flex-1">
            <div class="relative">
              <input
                v-model="search"
                type="text"
                placeholder="Cari nama, perusahaan, telepon..."
                class="input input-bordered w-full pl-10"
                @input="debouncedSearch"
              />
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer List -->
    <div class="card bg-base-100 shadow">
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
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
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
                    <p v-if="customer.companyName" class="text-sm text-base-content/60">{{ customer.companyName }}</p>
                  </div>
                </td>
                <td>
                  <div>
                    <p class="font-mono text-sm">{{ customer.phone }}</p>
                    <p v-if="customer.email" class="text-sm text-base-content/60">{{ customer.email }}</p>
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
                    <NuxtLink :to="`/customers/${customer.id}`" class="btn btn-ghost btn-sm btn-square">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </NuxtLink>
                    <button @click="confirmDelete(customer)" class="btn btn-ghost btn-sm btn-square text-error">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="customers?.meta?.totalPages > 1" class="flex justify-center p-4 border-t border-base-200">
          <div class="join">
            <button
              class="join-item btn btn-sm"
              :disabled="page <= 1"
              @click="page--"
            >
              «
            </button>
            <button class="join-item btn btn-sm">
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
      </div>
    </div>

    <!-- Delete Modal -->
    <dialog ref="deleteModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Hapus Pelanggan</h3>
        <p class="py-4">
          Apakah Anda yakin ingin menghapus <strong>{{ customerToDelete?.name }}</strong>?
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
const page = ref(1)
const deleteModal = ref<HTMLDialogElement>()
const customerToDelete = ref<any>(null)
const deleting = ref(false)

const { data: customers, pending, refresh } = await useFetch('/api/customers', {
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
