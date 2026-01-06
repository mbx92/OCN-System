import { testWhatsAppConnection, sendWhatsApp } from '../../utils/whatsapp'

export default defineEventHandler(async event => {
  const body = await readBody(event)

  // If config provided in body, test that config directly
  if (body.config?.apiToken) {
    const result = await testWhatsAppConnection({
      apiToken: body.config.apiToken,
      deviceId: body.config.deviceId,
    })

    // If test successful and sendTest is true, send test message
    if (result.success && body.sendTest && body.testPhone) {
      const sendResult = await sendWhatsApp({
        to: body.testPhone,
        message: `🎉 *Test WhatsApp Berhasil!*

Selamat! Konfigurasi WhatsApp API Anda sudah benar.

Pesan ini dikirim dari sistem OCN pada ${new Date().toLocaleString('id-ID')}.

_OCN CCTV & Networking Solutions_`,
      })

      return sendResult
    }

    return result
  }

  // Test saved configuration
  const setting = await prisma.integrationSetting.findUnique({
    where: { name: 'whatsapp' },
  })

  if (!setting?.enabled || !(setting.config as any)?.apiToken) {
    return { success: false, message: 'WhatsApp API belum dikonfigurasi' }
  }

  return testWhatsAppConnection({
    apiToken: (setting.config as any).apiToken,
    deviceId: (setting.config as any).deviceId,
  })
})
