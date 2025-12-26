<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold">Profil Saya</h1>
      <p class="text-base-content/60">Kelola informasi profil Anda</p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Profile Form -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Informasi Pribadi</h2>

            <form @submit.prevent="updateProfile" class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Nama Lengkap</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  class="input input-bordered w-full"
                  required
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Email</span>
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  class="input input-bordered w-full"
                  required
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Telepon</span>
                </label>
                <input v-model="form.phone" type="tel" class="input input-bordered w-full" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Alamat</span>
                </label>
                <textarea
                  v-model="form.address"
                  class="textarea textarea-bordered w-full"
                  rows="3"
                ></textarea>
              </div>

              <div class="flex justify-end gap-2">
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="loading loading-spinner"></span>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Change Password -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Ubah Password</h2>

            <form @submit.prevent="changePassword" class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Password Lama</span>
                </label>
                <input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  class="input input-bordered w-full"
                  required
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Password Baru</span>
                </label>
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  class="input input-bordered w-full"
                  required
                  minlength="6"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Konfirmasi Password Baru</span>
                </label>
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  class="input input-bordered w-full"
                  required
                  minlength="6"
                />
              </div>

              <div class="flex justify-end gap-2">
                <button type="submit" class="btn btn-primary" :disabled="changingPassword">
                  <span v-if="changingPassword" class="loading loading-spinner"></span>
                  Ubah Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- User Info Card -->
        <div class="card bg-base-100 shadow">
          <div class="card-body items-center text-center">
            <div class="avatar placeholder mb-4">
              <div class="bg-primary text-primary-content rounded-full w-24">
                <span class="text-3xl">{{ getInitials(user?.name) }}</span>
              </div>
            </div>
            <h3 class="font-bold text-lg">{{ user?.name }}</h3>
            <p class="text-sm text-base-content/60">{{ user?.email }}</p>
            <div class="badge badge-primary badge-sm mt-2">{{ getRoleLabel(user?.role) }}</div>
          </div>
        </div>

        <!-- Account Info -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="font-semibold mb-2">Informasi Akun</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-base-content/60">Username</p>
                <p class="font-medium">{{ user?.username }}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Role</p>
                <p class="font-medium">{{ getRoleLabel(user?.role) }}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Bergabung</p>
                <p class="font-medium">{{ formatDate(user?.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, fetchUser } = useAuth()
const { showAlert } = useAlert()
const { formatDate } = useFormatter()

const loading = ref(false)
const saving = ref(false)
const changingPassword = ref(false)

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

onMounted(async () => {
  loading.value = true
  await fetchUser()
  if (user.value) {
    form.value = {
      name: user.value.name || '',
      email: user.value.email || '',
      phone: user.value.phone || '',
      address: user.value.address || '',
    }
  }
  loading.value = false
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

const getRoleLabel = (role?: string) => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrator',
    STAFF: 'Staff',
    TECHNICIAN: 'Teknisi',
  }
  return labels[role || ''] || role
}

const updateProfile = async () => {
  saving.value = true
  try {
    await $fetch('/api/profile', {
      method: 'PUT',
      body: form.value,
    })
    showAlert('Profil berhasil diperbarui', 'success')
    await fetchUser()
  } catch (error: any) {
    showAlert(error.data?.message || 'Gagal memperbarui profil', 'error')
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showAlert('Konfirmasi password tidak cocok', 'error')
    return
  }

  changingPassword.value = true
  try {
    await $fetch('/api/profile/password', {
      method: 'PUT',
      body: {
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword,
      },
    })
    showAlert('Password berhasil diubah', 'success')
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  } catch (error: any) {
    showAlert(error.data?.message || 'Gagal mengubah password', 'error')
  } finally {
    changingPassword.value = false
  }
}
</script>
