<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/customers" class="btn btn-ghost btn-sm btn-circle">
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold">Tambah Pelanggan Baru</h1>
        <p class="text-base-content/60">Isi data pelanggan baru</p>
      </div>
    </div>

    <!-- Form -->
    <div class="card bg-base-100 shadow-xl max-w-2xl">
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Row 1: Name & Company -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Name -->
            <div class="form-control w-full">
              <label class="label pb-1">
                <span class="label-text font-semibold">
                  Nama Pelanggan
                  <span class="text-error">*</span>
                </span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Masukkan nama pelanggan"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.name }"
                required
              />
              <label v-if="errors.name" class="label py-1">
                <span class="label-text-alt text-error">{{ errors.name }}</span>
              </label>
            </div>

            <!-- Company Name -->
            <div class="form-control w-full">
              <label class="label pb-1">
                <span class="label-text font-semibold">Nama Perusahaan</span>
              </label>
              <input
                v-model="form.companyName"
                type="text"
                placeholder="Opsional"
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <!-- Row 2: Phone & Email -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Phone -->
            <div class="form-control w-full">
              <label class="label pb-1">
                <span class="label-text font-semibold">
                  Nomor Telepon
                  <span class="text-error">*</span>
                </span>
              </label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="Contoh: 081234567890"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.phone }"
                required
              />
              <label v-if="errors.phone" class="label py-1">
                <span class="label-text-alt text-error">{{ errors.phone }}</span>
              </label>
            </div>

            <!-- Email -->
            <div class="form-control w-full">
              <label class="label pb-1">
                <span class="label-text font-semibold">Email</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                placeholder="Opsional"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.email }"
              />
              <label v-if="errors.email" class="label py-1">
                <span class="label-text-alt text-error">{{ errors.email }}</span>
              </label>
            </div>
          </div>

          <!-- Address -->
          <div class="form-control w-full">
            <label class="label pb-1">
              <span class="label-text font-semibold">
                Alamat
                <span class="text-error">*</span>
              </span>
            </label>
            <textarea
              v-model="form.address"
              placeholder="Masukkan alamat lengkap"
              class="textarea textarea-bordered w-full h-24 resize-none"
              :class="{ 'textarea-error': errors.address }"
              required
            ></textarea>
            <label v-if="errors.address" class="label py-1">
              <span class="label-text-alt text-error">{{ errors.address }}</span>
            </label>
          </div>

          <!-- Coordinates -->
          <div class="form-control w-full">
            <label class="label pb-1">
              <span class="label-text font-semibold">Koordinat Lokasi</span>
            </label>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                v-model.number="form.latitude"
                type="number"
                step="any"
                placeholder="Latitude (contoh: -6.2088)"
                class="input input-bordered w-full"
              />
              <input
                v-model.number="form.longitude"
                type="number"
                step="any"
                placeholder="Longitude (contoh: 106.8456)"
                class="input input-bordered w-full"
              />
              <button
                type="button"
                @click="getMyLocation"
                class="btn btn-outline btn-primary"
                :disabled="gettingLocation"
              >
                <span v-if="gettingLocation" class="loading loading-spinner loading-sm"></span>
                <svg
                  v-else
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Lokasi Saya
              </button>
            </div>
            <label class="label py-1">
              <span class="label-text-alt text-base-content/60">
                Klik "Lokasi Saya" untuk mengisi koordinat otomatis dari GPS
              </span>
            </label>
          </div>

          <!-- Notes -->
          <div class="form-control w-full">
            <label class="label pb-1">
              <span class="label-text font-semibold">Catatan</span>
            </label>
            <textarea
              v-model="form.notes"
              placeholder="Catatan tambahan (opsional)"
              class="textarea textarea-bordered w-full h-20 resize-none"
            ></textarea>
          </div>

          <!-- Divider -->
          <div class="divider my-2"></div>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <NuxtLink to="/customers" class="btn btn-ghost">Batal</NuxtLink>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              <svg
                v-else
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
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
  latitude: null as number | null,
  longitude: null as number | null,
  notes: '',
})

const errors = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
})

const loading = ref(false)
const gettingLocation = ref(false)

const getMyLocation = () => {
  if (!navigator.geolocation) {
    showError('Browser tidak mendukung geolokasi')
    return
  }

  gettingLocation.value = true
  navigator.geolocation.getCurrentPosition(
    position => {
      form.latitude = position.coords.latitude
      form.longitude = position.coords.longitude
      gettingLocation.value = false
      success('Lokasi berhasil didapatkan')
    },
    err => {
      gettingLocation.value = false
      showError('Gagal mendapatkan lokasi: ' + err.message)
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

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
