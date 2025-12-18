<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Daftar Supplier</h1>
        <p class="text-base-content/60">Kelola data supplier untuk Purchase Order</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
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
        Tambah Supplier
      </button>
    </div>

    <!-- Suppliers Table -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div v-if="pending" class="text-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="!suppliers?.length" class="text-center py-12 text-base-content/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 mx-auto mb-4 opacity-50"
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
          <p>Belum ada supplier</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-base-200">
              <tr>
                <th>Nama Supplier</th>
                <th>Contact Person</th>
                <th>Telepon</th>
                <th>Email</th>
                <th>Alamat</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="supplier in suppliers" :key="supplier.id" class="hover">
                <td class="font-bold">{{ supplier.name }}</td>
                <td>{{ supplier.contactPerson || '-' }}</td>
                <td>{{ supplier.phone }}</td>
                <td>{{ supplier.email || '-' }}</td>
                <td class="max-w-xs truncate">{{ supplier.address || '-' }}</td>
                <td class="text-center">
                  <div class="flex gap-2 justify-center">
                    <button class="btn btn-ghost btn-sm" @click="openEditModal(supplier)">
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
                      class="btn btn-ghost btn-sm text-error"
                      @click="confirmDelete(supplier)"
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

    <!-- Create/Edit Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg">
            {{ isEditing ? 'Edit Supplier' : 'Tambah Supplier Baru' }}
          </h3>
          <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        <form @submit.prevent="saveSupplier" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Nama Supplier *</span></label>
            <input
              v-model="form.name"
              type="text"
              class="input input-bordered"
              placeholder="PT ABC Indonesia"
              required
            />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Contact Person</span></label>
            <input
              v-model="form.contactPerson"
              type="text"
              class="input input-bordered"
              placeholder="Bapak/Ibu..."
            />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Telepon *</span></label>
            <input
              v-model="form.phone"
              type="text"
              class="input input-bordered"
              placeholder="021-12345678"
              required
            />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Email</span></label>
            <input
              v-model="form.email"
              type="email"
              class="input input-bordered"
              placeholder="sales@company.com"
            />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Alamat</span></label>
            <textarea
              v-model="form.address"
              class="textarea textarea-bordered"
              rows="2"
              placeholder="Alamat lengkap..."
            ></textarea>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeModal" :disabled="processing">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="processing">
              <span v-if="processing" class="loading loading-spinner"></span>
              {{ isEditing ? 'Simpan Perubahan' : 'Tambah Supplier' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
      </form>
    </dialog>

    <!-- Delete Confirmation Modal -->
    <dialog class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Hapus Supplier</h3>
        <p class="py-4">
          Apakah Anda yakin ingin menghapus supplier
          <strong>{{ deleteTarget?.name }}</strong>
          ?
        </p>
        <div class="modal-action">
          <button class="btn" @click="showDeleteModal = false" :disabled="processing">Batal</button>
          <button class="btn btn-error" @click="deleteSupplier" :disabled="processing">
            <span v-if="processing" class="loading loading-spinner"></span>
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
const { showAlert } = useAlert()

const { data: suppliers, pending, refresh } = await useFetch('/api/suppliers')

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const deleteTarget = ref<any>(null)
const processing = ref(false)

const form = reactive({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
})

const resetForm = () => {
  form.name = ''
  form.contactPerson = ''
  form.phone = ''
  form.email = ''
  form.address = ''
  isEditing.value = false
  editingId.value = null
}

const openCreateModal = () => {
  resetForm()
  showModal.value = true
}

const openEditModal = (supplier: any) => {
  form.name = supplier.name
  form.contactPerson = supplier.contactPerson || ''
  form.phone = supplier.phone
  form.email = supplier.email || ''
  form.address = supplier.address || ''
  isEditing.value = true
  editingId.value = supplier.id
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const saveSupplier = async () => {
  processing.value = true
  try {
    if (isEditing.value && editingId.value) {
      await $fetch(`/api/suppliers/${editingId.value}`, {
        method: 'PUT',
        body: form,
      })
      showAlert('Supplier berhasil diperbarui', 'success')
    } else {
      await $fetch('/api/suppliers', {
        method: 'POST',
        body: form,
      })
      showAlert('Supplier berhasil ditambahkan', 'success')
    }
    closeModal()
    refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan supplier', 'error')
  } finally {
    processing.value = false
  }
}

const confirmDelete = (supplier: any) => {
  deleteTarget.value = supplier
  showDeleteModal.value = true
}

const deleteSupplier = async () => {
  if (!deleteTarget.value) return
  processing.value = true
  try {
    await $fetch(`/api/suppliers/${deleteTarget.value.id}`, {
      method: 'DELETE',
    })
    showAlert('Supplier berhasil dihapus', 'success')
    showDeleteModal.value = false
    deleteTarget.value = null
    refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menghapus supplier', 'error')
  } finally {
    processing.value = false
  }
}
</script>
