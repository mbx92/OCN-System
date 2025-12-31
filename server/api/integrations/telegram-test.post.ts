import { sendTelegramMessage } from '../../utils/telegram'

export default defineEventHandler(async () => {
  const result = await sendTelegramMessage(
    '🔔 Test notifikasi dari OCN System. Jika Anda menerima pesan ini, integrasi Telegram berhasil!'
  )

  return {
    success: result,
    message: result
      ? 'Pesan test berhasil dikirim!'
      : 'Gagal mengirim pesan test. Periksa konfigurasi bot.',
  }
})
