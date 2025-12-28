/**
 * Telegram Bot Utility
 * Sends notifications to configured Telegram chat
 */

interface TelegramMessage {
  text: string
  parseMode?: 'HTML' | 'Markdown'
}

/**
 * Send a message to Telegram
 */
export async function sendTelegramMessage(
  message: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.log('[Telegram] Bot not configured, skipping notification')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      console.error('[Telegram] Failed to send message:', result.description)
      return false
    }

    console.log('[Telegram] Message sent successfully')
    return true
  } catch (error) {
    console.error('[Telegram] Error sending message:', error)
    return false
  }
}

/**
 * Send maintenance schedule notification
 */
export async function notifyMaintenanceSchedule(schedule: {
  title: string
  scheduledDate: Date
  customerName?: string
  projectNumber?: string
}) {
  const dateStr = new Date(schedule.scheduledDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const message = `🔧 <b>Jadwal Maintenance Baru</b>

📋 <b>Judul:</b> ${schedule.title}
📅 <b>Tanggal:</b> ${dateStr}
${schedule.customerName ? `👤 <b>Customer:</b> ${schedule.customerName}` : ''}
${schedule.projectNumber ? `📁 <b>Project:</b> ${schedule.projectNumber}` : ''}`

  return sendTelegramMessage(message)
}

/**
 * Send warranty claim notification
 */
export async function notifyWarrantyClaim(claim: {
  issue: string
  customerName: string
  projectNumber?: string
}) {
  const message = `🛡️ <b>Klaim Garansi Baru</b>

⚠️ <b>Masalah:</b> ${claim.issue}
👤 <b>Customer:</b> ${claim.customerName}
${claim.projectNumber ? `📁 <b>Project:</b> ${claim.projectNumber}` : ''}`

  return sendTelegramMessage(message)
}

/**
 * Send project completed notification
 */
export async function notifyProjectCompleted(project: {
  projectNumber: string
  title: string
  customerName: string
}) {
  const message = `✅ <b>Project Selesai</b>

📁 <b>No:</b> ${project.projectNumber}
📋 <b>Judul:</b> ${project.title}
👤 <b>Customer:</b> ${project.customerName}`

  return sendTelegramMessage(message)
}

/**
 * Send payment received notification
 */
export async function notifyPaymentReceived(payment: {
  amount: number
  projectNumber?: string
  customerName?: string
  paymentType: string
}) {
  const amountStr = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(payment.amount)

  const message = `💰 <b>Pembayaran Diterima</b>

💵 <b>Jumlah:</b> ${amountStr}
📝 <b>Tipe:</b> ${payment.paymentType}
${payment.customerName ? `👤 <b>Customer:</b> ${payment.customerName}` : ''}
${payment.projectNumber ? `📁 <b>Project:</b> ${payment.projectNumber}` : ''}`

  return sendTelegramMessage(message)
}
