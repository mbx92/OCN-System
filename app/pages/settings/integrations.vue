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
            <!-- Telegram Icon -->
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
              <div class="flex items-center gap-2 mb-1">
                <h2 class="text-lg font-bold">Telegram Bot</h2>
                <span
                  v-if="integrations?.telegram?.configured"
                  class="badge badge-success badge-sm gap-1"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  Terkonfigurasi
                </span>
                <span v-else class="badge badge-ghost badge-sm">Belum dikonfigurasi</span>
              </div>
              <p class="text-sm text-base-content/60 mb-4">
                Terima notifikasi real-time untuk proyek baru, pembayaran, maintenance, dan lainnya
                melalui Telegram.
              </p>

              <!-- Configuration Info -->
              <div class="bg-base-200 rounded-lg p-4 mb-4">
                <h4 class="font-medium mb-3">Konfigurasi (Environment Variables)</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-base-content/60">TELEGRAM_BOT_TOKEN:</span>
                    <span class="ml-2 font-mono">
                      {{ integrations?.telegram?.botToken || 'Tidak diset' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-base-content/60">TELEGRAM_CHAT_ID:</span>
                    <span class="ml-2 font-mono">
                      {{ integrations?.telegram?.chatId || 'Tidak diset' }}
                    </span>
                  </div>
                </div>
                <div class="mt-3 text-xs text-base-content/50">
                  <p>Untuk mengkonfigurasi, set environment variables berikut:</p>
                  <code class="bg-base-300 px-2 py-1 rounded mt-1 block">
                    TELEGRAM_BOT_TOKEN=your_bot_token
                  </code>
                  <code class="bg-base-300 px-2 py-1 rounded mt-1 block">
                    TELEGRAM_CHAT_ID=your_chat_id
                  </code>
                </div>
              </div>

              <!-- Notification Settings -->
              <div v-if="integrations?.telegram?.configured" class="space-y-4">
                <h4 class="font-medium">Pengaturan Notifikasi</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="telegramNotifications.newProject"
                      class="checkbox checkbox-sm checkbox-primary"
                    />
                    <span class="text-sm">Proyek baru dibuat</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="telegramNotifications.projectCompleted"
                      class="checkbox checkbox-sm checkbox-primary"
                    />
                    <span class="text-sm">Proyek selesai</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="telegramNotifications.paymentReceived"
                      class="checkbox checkbox-sm checkbox-primary"
                    />
                    <span class="text-sm">Pembayaran diterima</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="telegramNotifications.maintenanceSchedule"
                      class="checkbox checkbox-sm checkbox-primary"
                    />
                    <span class="text-sm">Jadwal maintenance</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="telegramNotifications.warrantyClaim"
                      class="checkbox checkbox-sm checkbox-primary"
                    />
                    <span class="text-sm">Klaim garansi</span>
                  </label>
                </div>

                <div class="flex gap-2 pt-2">
                  <button
                    @click="testTelegram"
                    class="btn btn-outline btn-sm"
                    :disabled="testingTelegram"
                  >
                    <span v-if="testingTelegram" class="loading loading-spinner loading-sm"></span>
                    <svg
                      v-else
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Test Kirim Pesan
                  </button>
                  <button
                    @click="saveNotificationSettings"
                    class="btn btn-primary btn-sm"
                    :disabled="savingSettings"
                  >
                    <span v-if="savingSettings" class="loading loading-spinner loading-sm"></span>
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Midtrans Integration -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="flex items-start gap-4">
            <!-- Midtrans Icon -->
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
              <div class="flex items-center gap-2 mb-1">
                <h2 class="text-lg font-bold">Midtrans Payment Gateway</h2>
                <span class="badge badge-ghost badge-sm">Segera Hadir</span>
              </div>
              <p class="text-sm text-base-content/60 mb-4">
                Terima pembayaran online dari pelanggan melalui berbagai metode: transfer bank,
                e-wallet, kartu kredit, dan lainnya.
              </p>

              <div class="alert alert-info">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm">
                  Integrasi Midtrans sedang dalam pengembangan. Fitur ini akan memungkinkan
                  pelanggan melakukan pembayaran online langsung dari invoice.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- WhatsApp Integration -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="flex items-start gap-4">
            <!-- WhatsApp Icon -->
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
              <div class="flex items-center gap-2 mb-1">
                <h2 class="text-lg font-bold">WhatsApp Business API</h2>
                <span class="badge badge-ghost badge-sm">Segera Hadir</span>
              </div>
              <p class="text-sm text-base-content/60 mb-4">
                Kirim invoice, reminder pembayaran, dan notifikasi langsung ke WhatsApp pelanggan.
              </p>

              <div class="alert alert-info">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm">
                  Integrasi WhatsApp Business API akan segera tersedia untuk mengirim pesan otomatis
                  ke pelanggan.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Email/SMTP Integration -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="flex items-start gap-4">
            <!-- Email Icon -->
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
              <div class="flex items-center gap-2 mb-1">
                <h2 class="text-lg font-bold">Email / SMTP</h2>
                <span class="badge badge-ghost badge-sm">Segera Hadir</span>
              </div>
              <p class="text-sm text-base-content/60 mb-4">
                Kirim invoice, quotation, dan notifikasi via email secara otomatis.
              </p>

              <div class="alert alert-info">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm">
                  Konfigurasi SMTP untuk mengirim email otomatis akan segera tersedia.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { showAlert } = useAlert()

const testingTelegram = ref(false)
const savingSettings = ref(false)

const { data: integrations, pending, refresh } = await useFetch('/api/integrations')

const telegramNotifications = reactive({
  newProject: true,
  projectCompleted: true,
  paymentReceived: true,
  maintenanceSchedule: true,
  warrantyClaim: true,
})

// Populate settings from fetched data
watch(
  integrations,
  data => {
    if (data?.telegram?.notifications) {
      Object.assign(telegramNotifications, data.telegram.notifications)
    }
  },
  { immediate: true }
)

const testTelegram = async () => {
  testingTelegram.value = true
  try {
    const result = await $fetch('/api/integrations/telegram-test', { method: 'POST' })
    if (result.success) {
      showAlert(result.message, 'success')
    } else {
      showAlert(result.message, 'error')
    }
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal mengirim pesan test', 'error')
  } finally {
    testingTelegram.value = false
  }
}

const saveNotificationSettings = async () => {
  savingSettings.value = true
  try {
    await $fetch('/api/integrations', {
      method: 'PUT',
      body: {
        telegramNotifications,
      },
    })
    showAlert('Pengaturan notifikasi berhasil disimpan!', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan pengaturan', 'error')
  } finally {
    savingSettings.value = false
  }
}
</script>
