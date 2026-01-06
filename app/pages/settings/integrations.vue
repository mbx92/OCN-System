<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Integrasi Third Party</h1>
        <p class="text-base-content/60">Kelola integrasi dengan layanan eksternal</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="space-y-6">
      <!-- Telegram Integration -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-lg bg-[#0088cc] flex items-center justify-center shrink-0"
            >
              <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
                />
              </svg>
            </div>

            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold">Telegram Bot</h2>
                  <span
                    v-if="integrations?.telegram?.configured"
                    class="badge badge-success badge-sm"
                  >
                    Terkonfigurasi
                  </span>
                  <span v-else class="badge badge-ghost badge-sm">Belum dikonfigurasi</span>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-primary"
                  :checked="integrations?.telegram?.enabled"
                  @change="toggleIntegration('telegram', $event)"
                />
              </div>
              <p class="text-sm text-base-content/60">
                Terima notifikasi real-time untuk proyek baru, pembayaran, maintenance via Telegram.
              </p>

              <div v-if="integrations?.telegram?.configured" class="mt-3">
                <button
                  @click="testTelegram"
                  class="btn btn-outline btn-sm"
                  :disabled="testingTelegram"
                >
                  <span v-if="testingTelegram" class="loading loading-spinner loading-sm"></span>
                  Test Kirim Pesan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Email/SMTP Integration -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-lg bg-base-300 flex items-center justify-center shrink-0">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold">Email / SMTP</h2>
                  <span v-if="integrations?.email?.configured" class="badge badge-success badge-sm">
                    Terkonfigurasi
                  </span>
                  <span v-else class="badge badge-ghost badge-sm">Belum dikonfigurasi</span>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-primary"
                  :checked="integrations?.email?.enabled"
                  @change="toggleIntegration('email', $event)"
                />
              </div>
              <p class="text-sm text-base-content/60">
                Kirim invoice, quotation, dan notifikasi via email secara otomatis.
              </p>

              <div v-if="integrations?.email?.enabled" class="mt-3">
                <button @click="openEmailModal" class="btn btn-outline btn-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Konfigurasi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- WhatsApp Integration -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-lg bg-[#25D366] flex items-center justify-center shrink-0"
            >
              <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                />
              </svg>
            </div>

            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold">WhatsApp Business API</h2>
                  <span
                    v-if="integrations?.whatsapp?.configured"
                    class="badge badge-success badge-sm"
                  >
                    Terkonfigurasi
                  </span>
                  <span v-else class="badge badge-ghost badge-sm">Belum dikonfigurasi</span>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-primary"
                  :checked="integrations?.whatsapp?.enabled"
                  @change="toggleIntegration('whatsapp', $event)"
                />
              </div>
              <p class="text-sm text-base-content/60">
                Kirim invoice, reminder pembayaran, dan notifikasi langsung ke WhatsApp pelanggan.
              </p>

              <div v-if="integrations?.whatsapp?.enabled" class="mt-3">
                <button @click="openWhatsAppModal" class="btn btn-outline btn-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Konfigurasi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Midtrans Integration -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-lg bg-[#0a2540] flex items-center justify-center shrink-0"
            >
              <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </div>

            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold">Midtrans Payment Gateway</h2>
                  <span
                    v-if="integrations?.midtrans?.configured"
                    class="badge badge-success badge-sm"
                  >
                    Terkonfigurasi
                  </span>
                  <span v-else class="badge badge-ghost badge-sm">Belum dikonfigurasi</span>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-primary"
                  :checked="integrations?.midtrans?.enabled"
                  @change="toggleIntegration('midtrans', $event)"
                />
              </div>
              <p class="text-sm text-base-content/60">
                Terima pembayaran online dari pelanggan melalui berbagai metode.
              </p>

              <div v-if="integrations?.midtrans?.enabled" class="mt-3">
                <button @click="openMidtransModal" class="btn btn-outline btn-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Konfigurasi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Config Modal -->
    <dialog class="modal" :class="{ 'modal-open': showEmailModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Konfigurasi Email SMTP</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label"><span class="label-text">SMTP Host</span></label>
              <input
                v-model="emailConfig.host"
                type="text"
                class="input input-bordered w-full"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label class="label"><span class="label-text">Port</span></label>
              <input
                v-model="emailConfig.port"
                type="number"
                class="input input-bordered w-full"
                placeholder="587"
              />
            </div>
          </div>
          <div>
            <label class="label"><span class="label-text">Username/Email</span></label>
            <input
              v-model="emailConfig.user"
              type="text"
              class="input input-bordered w-full"
              placeholder="you@gmail.com"
            />
          </div>
          <div>
            <label class="label"><span class="label-text">Password/App Password</span></label>
            <input
              v-model="emailConfig.pass"
              type="password"
              class="input input-bordered w-full"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label class="label"><span class="label-text">From Address</span></label>
            <input
              v-model="emailConfig.from"
              type="text"
              class="input input-bordered w-full"
              placeholder="OCN System <noreply@ocn.com>"
            />
          </div>
          <label class="label cursor-pointer justify-start gap-2">
            <input
              v-model="emailConfig.secure"
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary"
            />
            <span class="label-text">SSL/TLS (port 465)</span>
          </label>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showEmailModal = false">Batal</button>
          <button class="btn btn-outline" @click="testEmail" :disabled="testingEmail">
            <span v-if="testingEmail" class="loading loading-spinner loading-sm"></span>
            Test
          </button>
          <button class="btn btn-primary" @click="saveEmailConfig" :disabled="savingEmail">
            <span v-if="savingEmail" class="loading loading-spinner loading-sm"></span>
            Simpan
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showEmailModal = false">close</button>
      </form>
    </dialog>

    <!-- WhatsApp Config Modal -->
    <dialog class="modal" :class="{ 'modal-open': showWhatsAppModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Konfigurasi WhatsApp API</h3>
        <div class="alert alert-info mb-4 py-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-sm">
            Menggunakan
            <a href="https://fonnte.com" target="_blank" class="link">Fonnte</a>
            sebagai provider.
          </span>
        </div>
        <div class="space-y-4">
          <div>
            <label class="label"><span class="label-text">API Token</span></label>
            <input
              v-model="whatsappConfig.apiToken"
              type="password"
              class="input input-bordered w-full"
              placeholder="Fonnte API Token"
            />
          </div>
          <div>
            <label class="label"><span class="label-text">Device ID (opsional)</span></label>
            <input
              v-model="whatsappConfig.deviceId"
              type="text"
              class="input input-bordered w-full"
              placeholder="Device ID"
            />
          </div>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showWhatsAppModal = false">Batal</button>
          <button class="btn btn-outline" @click="testWhatsApp" :disabled="testingWhatsApp">
            <span v-if="testingWhatsApp" class="loading loading-spinner loading-sm"></span>
            Test
          </button>
          <button class="btn btn-primary" @click="saveWhatsAppConfig" :disabled="savingWhatsApp">
            <span v-if="savingWhatsApp" class="loading loading-spinner loading-sm"></span>
            Simpan
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showWhatsAppModal = false">close</button>
      </form>
    </dialog>

    <!-- Midtrans Config Modal -->
    <dialog class="modal" :class="{ 'modal-open': showMidtransModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Konfigurasi Midtrans</h3>
        <div class="space-y-4">
          <div>
            <label class="label"><span class="label-text">Server Key</span></label>
            <input
              v-model="midtransConfig.serverKey"
              type="password"
              class="input input-bordered w-full"
              placeholder="SB-Mid-server-xxx"
            />
          </div>
          <div>
            <label class="label"><span class="label-text">Client Key</span></label>
            <input
              v-model="midtransConfig.clientKey"
              type="password"
              class="input input-bordered w-full"
              placeholder="SB-Mid-client-xxx"
            />
          </div>
          <label class="label cursor-pointer justify-start gap-2">
            <input
              v-model="midtransConfig.isProduction"
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary"
            />
            <span class="label-text">Production Mode</span>
          </label>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showMidtransModal = false">Batal</button>
          <button class="btn btn-primary" @click="saveMidtransConfig" :disabled="savingMidtrans">
            <span v-if="savingMidtrans" class="loading loading-spinner loading-sm"></span>
            Simpan
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showMidtransModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { showAlert } = useAlert()

const testingTelegram = ref(false)
const savingEmail = ref(false)
const testingEmail = ref(false)
const savingWhatsApp = ref(false)
const testingWhatsApp = ref(false)
const savingMidtrans = ref(false)

// Modals
const showEmailModal = ref(false)
const showWhatsAppModal = ref(false)
const showMidtransModal = ref(false)

const { data: integrations, pending, refresh } = await useFetch('/api/integrations')

// Configs
const emailConfig = reactive({ host: '', port: 587, user: '', pass: '', from: '', secure: false })
const whatsappConfig = reactive({ apiToken: '', deviceId: '' })
const midtransConfig = reactive({ serverKey: '', clientKey: '', isProduction: false })

// Populate from data
watch(
  integrations,
  data => {
    if (data?.email) {
      emailConfig.host = data.email.host || ''
      emailConfig.port = data.email.port || 587
      emailConfig.from = data.email.from || ''
      emailConfig.secure = data.email.secure ?? false
    }
    if (data?.midtrans) {
      midtransConfig.isProduction = data.midtrans.isProduction ?? false
    }
  },
  { immediate: true }
)

// Modal openers
const openEmailModal = () => {
  showEmailModal.value = true
}
const openWhatsAppModal = () => {
  showWhatsAppModal.value = true
}
const openMidtransModal = () => {
  showMidtransModal.value = true
}

// Toggle integration
const toggleIntegration = async (name: string, event: Event) => {
  const enabled = (event.target as HTMLInputElement).checked
  try {
    await $fetch('/api/integrations', { method: 'PUT', body: { integration: { name, enabled } } })
    showAlert(`${name} ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`, 'success')
    await refresh()
  } catch {
    showAlert('Gagal mengubah status integrasi', 'error')
    await refresh()
  }
}

// Test Telegram
const testTelegram = async () => {
  testingTelegram.value = true
  try {
    const result = await $fetch<any>('/api/integrations/telegram-test', { method: 'POST' })
    showAlert(result.message, result.success ? 'success' : 'error')
  } catch {
    showAlert('Gagal mengirim pesan test', 'error')
  } finally {
    testingTelegram.value = false
  }
}

// Email
const saveEmailConfig = async () => {
  if (!emailConfig.host || !emailConfig.user || !emailConfig.pass) {
    showAlert('Lengkapi semua field', 'warning')
    return
  }
  savingEmail.value = true
  try {
    await $fetch('/api/integrations', {
      method: 'PUT',
      body: { integration: { name: 'email', config: { ...emailConfig } } },
    })
    showAlert('Konfigurasi Email berhasil disimpan', 'success')
    showEmailModal.value = false
    await refresh()
  } catch {
    showAlert('Gagal menyimpan', 'error')
  } finally {
    savingEmail.value = false
  }
}

const testEmail = async () => {
  testingEmail.value = true
  try {
    const result = await $fetch<any>('/api/integrations/email-test', {
      method: 'POST',
      body: { config: emailConfig },
    })
    showAlert(result.message, result.success ? 'success' : 'error')
  } catch {
    showAlert('Gagal test koneksi', 'error')
  } finally {
    testingEmail.value = false
  }
}

// WhatsApp
const saveWhatsAppConfig = async () => {
  if (!whatsappConfig.apiToken) {
    showAlert('Masukkan API Token', 'warning')
    return
  }
  savingWhatsApp.value = true
  try {
    await $fetch('/api/integrations', {
      method: 'PUT',
      body: { integration: { name: 'whatsapp', config: { ...whatsappConfig } } },
    })
    showAlert('Konfigurasi WhatsApp berhasil disimpan', 'success')
    showWhatsAppModal.value = false
    await refresh()
  } catch {
    showAlert('Gagal menyimpan', 'error')
  } finally {
    savingWhatsApp.value = false
  }
}

const testWhatsApp = async () => {
  testingWhatsApp.value = true
  try {
    const result = await $fetch<any>('/api/integrations/whatsapp-test', {
      method: 'POST',
      body: { config: whatsappConfig },
    })
    showAlert(result.message, result.success ? 'success' : 'error')
  } catch {
    showAlert('Gagal test koneksi', 'error')
  } finally {
    testingWhatsApp.value = false
  }
}

// Midtrans
const saveMidtransConfig = async () => {
  if (!midtransConfig.serverKey || !midtransConfig.clientKey) {
    showAlert('Masukkan Server Key dan Client Key', 'warning')
    return
  }
  savingMidtrans.value = true
  try {
    await $fetch('/api/integrations', {
      method: 'PUT',
      body: { integration: { name: 'midtrans', config: { ...midtransConfig } } },
    })
    showAlert('Konfigurasi Midtrans berhasil disimpan', 'success')
    showMidtransModal.value = false
    await refresh()
  } catch {
    showAlert('Gagal menyimpan', 'error')
  } finally {
    savingMidtrans.value = false
  }
}
</script>
