<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Pengguna</h1>
        <p class="text-base-content/60">Kelola akun pengguna sistem</p>
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
        Tambah Pengguna
      </button>
    </div>

    <!-- View Toggle -->
    <div class="flex justify-end">
      <AppViewToggle v-model="viewMode" />
    </div>

    <!-- Users Grid -->
    <div v-if="viewMode === 'GRID'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="pending" class="col-span-full text-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="!users?.length" class="col-span-full text-center py-12 text-base-content/60">
        <p class="text-lg">Belum ada pengguna</p>
      </div>

      <div
        v-for="user in users"
        :key="user.id"
        class="card bg-base-100 shadow hover:shadow-md transition-shadow"
      >
        <div class="card-body p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="avatar placeholder">
              <div
                class="bg-primary text-primary-content w-12 rounded-full flex items-center justify-center"
              >
                <span class="text-lg">
                  {{ user.name?.charAt(0)?.toUpperCase() || 'U' }}
                </span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-base">{{ user.name }}</h3>
              <p class="text-sm text-base-content/60">{{ user.phone || '-' }}</p>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2 text-base-content/70">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span class="font-mono">{{ user.username }}</span>
            </div>
            <div class="flex items-center gap-2 text-base-content/60">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span class="truncate">{{ user.email }}</span>
            </div>
          </div>

          <div class="flex gap-2 mt-3">
            <span
              class="badge flex-1 justify-center"
              :class="{
                'badge-primary': user.role === 'OWNER',
                'badge-secondary': user.role === 'ADMIN',
                'badge-accent': user.role === 'TECHNICIAN',
                'badge-ghost': user.role === 'VIEWER',
              }"
            >
              {{ getRoleLabel(user.role) }}
            </span>
            <span
              class="badge flex-1 justify-center"
              :class="user.isActive ? 'badge-success' : 'badge-error'"
            >
              {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>

          <div class="card-actions justify-end mt-4 pt-4 border-t border-base-200">
            <button @click="editUser(user)" class="btn btn-ghost btn-sm">Edit</button>
            <button
              @click="toggleStatus(user)"
              class="btn btn-ghost btn-sm"
              :class="user.isActive ? 'text-error' : 'text-success'"
            >
              {{ user.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-sm sm:table-md">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pending" class="text-center">
                <td colspan="6" class="py-8">
                  <span class="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
              <tr v-else-if="!users?.length" class="text-center">
                <td colspan="6" class="py-8 text-base-content/60">
                  <p class="text-lg">Belum ada pengguna</p>
                </td>
              </tr>
              <tr v-for="user in users" :key="user.id" class="hover">
                <td>
                  <div class="flex items-center gap-2 sm:gap-3">
                    <div class="avatar placeholder">
                      <div
                        class="bg-primary text-primary-content w-8 sm:w-10 rounded-full flex items-center justify-center"
                      >
                        <span class="text-xs sm:text-sm">
                          {{ user.name?.charAt(0)?.toUpperCase() || 'U' }}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div class="font-bold text-sm sm:text-base">{{ user.name }}</div>
                      <div class="text-xs text-base-content/60">{{ user.phone || '-' }}</div>
                    </div>
                  </div>
                </td>
                <td class="font-mono text-xs sm:text-sm">{{ user.username }}</td>
                <td class="text-xs sm:text-sm">{{ user.email }}</td>
                <td>
                  <span
                    class="badge"
                    :class="{
                      'badge-primary': user.role === 'OWNER',
                      'badge-secondary': user.role === 'ADMIN',
                      'badge-accent': user.role === 'TECHNICIAN',
                      'badge-ghost': user.role === 'VIEWER',
                    }"
                  >
                    {{ getRoleLabel(user.role) }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="user.isActive ? 'badge-success' : 'badge-error'">
                    {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-1">
                    <button @click="editUser(user)" class="btn btn-ghost btn-xs text-xs">
                      Edit
                    </button>
                    <button
                      @click="toggleStatus(user)"
                      class="btn btn-ghost btn-xs text-xs"
                      :class="user.isActive ? 'text-error' : 'text-success'"
                    >
                      {{ user.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit User Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ isEditing ? 'Edit Pengguna' : 'Tambah Pengguna' }}
        </h3>
        <form @submit.prevent="saveUser">
          <div class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Nama Lengkap *</span></label>
              <input v-model="form.name" type="text" class="input input-bordered w-full" required />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Username *</span></label>
                <input
                  v-model="form.username"
                  type="text"
                  class="input input-bordered w-full"
                  required
                />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Email *</span></label>
                <input
                  v-model="form.email"
                  type="email"
                  class="input input-bordered w-full"
                  required
                />
              </div>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  {{ isEditing ? 'Password (kosongkan jika tidak diubah)' : 'Password *' }}
                </span>
              </label>
              <input
                v-model="form.password"
                type="password"
                class="input input-bordered w-full"
                :required="!isEditing"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text">Role *</span></label>
                <select v-model="form.role" class="select select-bordered w-full" required>
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TECHNICIAN">Teknisi</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">No. Telepon</span></label>
                <input v-model="form.phone" type="tel" class="input input-bordered w-full" />
              </div>
            </div>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false" :disabled="saving">
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner"></span>
              {{ isEditing ? 'Simpan' : 'Tambah' }}
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

const viewMode = ref<'GRID' | 'LIST'>('GRID')
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const editingId = ref('')

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'ADMIN',
  phone: '',
})

const { data: usersData, pending, refresh } = await useFetch('/api/users')
const users = computed(() => (usersData.value as any) || [])

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    TECHNICIAN: 'Teknisi',
    VIEWER: 'Viewer',
  }
  return labels[role] || role
}

const openModal = () => {
  isEditing.value = false
  editingId.value = ''
  form.name = ''
  form.username = ''
  form.email = ''
  form.password = ''
  form.role = 'ADMIN'
  form.phone = ''
  showModal.value = true
}

const editUser = (user: any) => {
  isEditing.value = true
  editingId.value = user.id
  form.name = user.name
  form.username = user.username
  form.email = user.email
  form.password = ''
  form.role = user.role
  form.phone = user.phone || ''
  showModal.value = true
}

const saveUser = async () => {
  saving.value = true
  try {
    const body: any = {
      name: form.name,
      username: form.username,
      email: form.email,
      role: form.role,
      phone: form.phone || null,
    }
    if (form.password) {
      body.password = form.password
    }

    if (isEditing.value) {
      await $fetch(`/api/users/${editingId.value}`, {
        method: 'PUT',
        body,
      })
      showAlert('Pengguna berhasil diperbarui', 'success')
    } else {
      body.password = form.password
      await $fetch('/api/users', {
        method: 'POST',
        body,
      })
      showAlert('Pengguna berhasil ditambahkan', 'success')
    }
    showModal.value = false
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan pengguna', 'error')
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (user: any) => {
  try {
    await $fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      body: { isActive: !user.isActive },
    })
    showAlert(`Pengguna ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`, 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengubah status', 'error')
  }
}
</script>
