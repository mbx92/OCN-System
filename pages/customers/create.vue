<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/customers" class="btn btn-ghost btn-sm btn-circle">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold">Tambah Pelanggan Baru</h1>
        <p class="text-base-content/60">Isi data pelanggan baru</p>
      </div>
    </div>

    <!-- Form -->
    <div class="card bg-base-100 shadow max-w-2xl">
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Nama Pelanggan <span class="text-error">*</span></span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Masukkan nama pelanggan"
              class="input input-bordered"
              :class="{ 'input-error': errors.name }"
              required
            />
            <label v-if="errors.name" class="label">
              <span class="label-text-alt text-error">{{ errors.name }}</span>
            </label>
          </div>

          <!-- Company Name -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Nama Perusahaan</span>
            </label>
            <input
              v-model="form.companyName"
              type="text"
              placeholder="Masukkan nama perusahaan (opsional)"
              class="input input-bordered"
            />
          </div>

          <!-- Phone -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Nomor Telepon <span class="text-error">*</span></span>
            </label>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="Contoh: 081234567890"
              class="input input-bordered"
              :class="{ 'input-error': errors.phone }"
              required
            />
            <label v-if="errors.phone" class="label">
              <span class="label-text-alt text-error">{{ errors.phone }}</span>
            </label>
          </div>

          <!-- Email -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Email</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="Masukkan email (opsional)"
              class="input input-bordered"
              :class="{ 'input-error': errors.email }"
            />
            <label v-if="errors.email" class="label">
              <span class="label-text-alt text-error">{{ errors.email }}</span>
            </label>
          </div>

          <!-- Address -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Alamat <span class="text-error">*</span></span>
            </label>
            <textarea
              v-model="form.address"
              placeholder="Masukkan alamat lengkap"
              class="textarea textarea-bordered h-24"
              :class="{ 'textarea-error': errors.address }"
              required
            ></textarea>
            <label v-if="errors.address" class="label">
              <span class="label-text-alt text-error">{{ errors.address }}</span>
            </label>
          </div>

          <!-- Notes -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Catatan</span>
            </label>
            <textarea
              v-model="form.notes"
              placeholder="Catatan tambahan (opsional)"
              class="textarea textarea-bordered h-20"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 pt-4">
            <NuxtLink to="/customers" class="btn btn-ghost">Batal</NuxtLink>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { success, error: showError } = useAlert()

const form = reactive({
  name: '',
  companyName: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})

const errors = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
})

const loading = ref(false)

const validate = (): boolean => {
  errors.name = ''
  errors.phone = ''
  errors.email = ''
  errors.address = ''

  if (!form.name.trim()) {
    errors.name = 'Nama pelanggan harus diisi'
  }
  if (!form.phone.trim()) {
    errors.phone = 'Nomor telepon harus diisi'
  }
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Format email tidak valid'
  }
  if (!form.address.trim()) {
    errors.address = 'Alamat harus diisi'
  }

  return !errors.name && !errors.phone && !errors.email && !errors.address
}

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    await $fetch('/api/customers', {
      method: 'POST',
      body: form,
    })
    success('Pelanggan berhasil ditambahkan')
    await navigateTo('/customers')
  } catch (err: any) {
    showError(err.data?.message || 'Gagal menambahkan pelanggan')
  } finally {
    loading.value = false
  }
}
</script>
