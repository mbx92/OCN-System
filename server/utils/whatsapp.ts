// WhatsApp integration using Fonnte API
// https://fonnte.com/

interface WhatsAppConfig {
  apiToken: string
  deviceId?: string
}

interface SendWhatsAppOptions {
  to: string // Phone number with country code (e.g., 6281234567890)
  message: string
  file?: string // URL of file to send
}

// Get WhatsApp config from database
export async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  const setting = await prisma.integrationSetting.findUnique({
    where: { name: 'whatsapp' },
  })

  if (setting?.enabled && setting.config) {
    const config = setting.config as any
    if (config.apiToken) {
      return {
        apiToken: config.apiToken,
        deviceId: config.deviceId,
      }
    }
  }

  // Fallback to environment variables
  if (process.env.WHATSAPP_API_TOKEN) {
    return {
      apiToken: process.env.WHATSAPP_API_TOKEN,
      deviceId: process.env.WHATSAPP_DEVICE_ID,
    }
  }

  return null
}

// Send WhatsApp message via Fonnte
export async function sendWhatsApp(
  options: SendWhatsAppOptions
): Promise<{ success: boolean; message: string }> {
  const config = await getWhatsAppConfig()

  if (!config) {
    return { success: false, message: 'WhatsApp belum dikonfigurasi' }
  }

  try {
    // Format phone number (remove + and spaces)
    const phone = options.to.replace(/[+\s-]/g, '')

    const response = await $fetch<any>('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: config.apiToken,
      },
      body: {
        target: phone,
        message: options.message,
        url: options.file,
      },
    })

    if (response.status) {
      return { success: true, message: 'Pesan WhatsApp berhasil dikirim' }
    } else {
      return { success: false, message: response.detail || 'Gagal mengirim pesan' }
    }
  } catch (error: any) {
    console.error('WhatsApp send error:', error)
    return { success: false, message: error.message || 'Gagal mengirim pesan WhatsApp' }
  }
}

// Test WhatsApp connection
export async function testWhatsAppConnection(
  config: WhatsAppConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await $fetch<any>('https://api.fonnte.com/device', {
      method: 'POST',
      headers: {
        Authorization: config.apiToken,
      },
    })

    if (response.status) {
      return { success: true, message: `Terhubung ke device: ${response.device || 'Active'}` }
    } else {
      return { success: false, message: response.detail || 'Gagal terhubung ke WhatsApp' }
    }
  } catch (error: any) {
    console.error('WhatsApp connection test error:', error)
    return { success: false, message: error.message || 'Gagal terhubung ke WhatsApp API' }
  }
}

// Send invoice via WhatsApp
export async function sendInvoiceWhatsApp(
  phone: string,
  invoiceData: {
    invoiceNumber: string
    customerName: string
    amount: string
    dueDate: string
    paymentLink?: string
  }
): Promise<{ success: boolean; message: string }> {
  let message = `*Invoice ${invoiceData.invoiceNumber}*
  
Yth. ${invoiceData.customerName},

Berikut adalah invoice untuk Anda:
• No. Invoice: ${invoiceData.invoiceNumber}
• Total: ${invoiceData.amount}
• Jatuh Tempo: ${invoiceData.dueDate}`

  if (invoiceData.paymentLink) {
    message += `

Klik link berikut untuk pembayaran:
${invoiceData.paymentLink}`
  }

  message += `

Terima kasih.
_OCN CCTV & Networking Solutions_`

  return sendWhatsApp({
    to: phone,
    message,
  })
}

// Send payment reminder via WhatsApp
export async function sendPaymentReminder(
  phone: string,
  reminderData: {
    customerName: string
    invoiceNumber: string
    amount: string
    daysOverdue: number
  }
): Promise<{ success: boolean; message: string }> {
  const message = `*Reminder Pembayaran*

Yth. ${reminderData.customerName},

Ini adalah pengingat untuk pembayaran invoice berikut:
• No. Invoice: ${reminderData.invoiceNumber}
• Total: ${reminderData.amount}
• Keterlambatan: ${reminderData.daysOverdue} hari

Mohon segera melakukan pembayaran.

Terima kasih.
_OCN CCTV & Networking Solutions_`

  return sendWhatsApp({
    to: phone,
    message,
  })
}
