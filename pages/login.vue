<template>
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body">
      <!-- Logo/Header -->
      <div class="text-center mb-6">
        <div class="flex justify-center mb-4">
          <div class="bg-primary text-primary-content rounded-xl p-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h1 class="text-2xl font-bold text-primary">OCN System</h1>
        <p class="text-base-content/60 mt-1">CCTV & Networking Management</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Username Field -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Username atau Email</span>
          </label>
          <div class="relative">
            <input
              v-model="credentials.username"
              type="text"
              placeholder="Masukkan username atau email"
              class="input input-bordered w-full pl-10"
              :class="{ 'input-error': errors.username }"
              required
              autocomplete="username"
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <label v-if="errors.username" class="label">
            <span class="label-text-alt text-error">{{ errors.username }}</span>
          </label>
        </div>

        <!-- Password Field -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Password</span>
          </label>
          <div class="relative">
            <input
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Masukkan password"
              class="input input-bordered w-full pl-10 pr-10"
              :class="{ 'input-error': errors.password }"
              required
              autocomplete="current-password"
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
            >
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          <label v-if="errors.password" class="label">
            <span class="label-text-alt text-error">{{ errors.password }}</span>
          </label>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="loading"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          {{ loading ? 'Masuk...' : 'Masuk' }}
        </button>
      </form>

      <!-- Demo Info -->
      <div class="divider text-xs text-base-content/40">DEMO</div>
      <div class="text-center text-sm text-base-content/60 space-y-1">
        <p><span class="font-medium">Owner:</span> owner / password123</p>
        <p><span class="font-medium">Teknisi:</span> tech1 / password123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const { login } = useAuth()

const credentials = reactive({
  username: '',
  password: '',
})

const errors = reactive({
  username: '',
  password: '',
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const validate = (): boolean => {
  errors.username = ''
  errors.password = ''

  if (!credentials.username.trim()) {
    errors.username = 'Username atau email harus diisi'
  }

  if (!credentials.password) {
    errors.password = 'Password harus diisi'
  }

  return !errors.username && !errors.password
}

const handleLogin = async () => {
  if (!validate()) return

  loading.value = true
  error.value = ''

  try {
    await login(credentials.username, credentials.password)
    await navigateTo('/dashboard')
  } catch (err: any) {
    error.value = err.data?.message || err.statusMessage || 'Login gagal. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>
