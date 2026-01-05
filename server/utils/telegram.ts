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
 * Send a document/file to Telegram
 */
export async function sendTelegramDocument(file: Buffer, filename: string, caption?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.log('[Telegram] Bot not configured, skipping document')
    return false
  }

  try {
    const formData = new FormData()
    formData.append('chat_id', chatId)
    formData.append('document', new Blob([file]), filename)
    if (caption) {
      formData.append('caption', caption)
      formData.append('parse_mode', 'HTML')
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!result.ok) {
      console.error('[Telegram] Failed to send document:', result.description)
      return false
    }

    console.log('[Telegram] Document sent successfully')
    return true
  } catch (error) {
    console.error('[Telegram] Error sending document:', error)
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
 * Send project completed notification with invoice & receipt PDFs
 */
export async function notifyProjectCompleted(project: {
  projectNumber: string
  title: string
  customerName: string
  projectId?: string
}) {
  const message = `✅ <b>Project Selesai</b>

📁 <b>No:</b> ${project.projectNumber}
📋 <b>Judul:</b> ${project.title}
👤 <b>Customer:</b> ${project.customerName}

📄 Invoice dan Kwitansi sedang dikirim...`

  await sendTelegramMessage(message)

  // Send PDF documents if projectId provided
  if (project.projectId) {
    try {
      // Generate and send Invoice PDF
      const invoicePdf = await $fetch(`/api/projects/${project.projectId}/invoice-pdf`)
      if (invoicePdf) {
        await sendTelegramDocument(
          Buffer.from(invoicePdf as any),
          `Invoice_${project.projectNumber}.pdf`,
          `📄 <b>Invoice</b>\nProject: ${project.projectNumber}`
        )
      }

      // Generate and send Receipt PDF
      const receiptPdf = await $fetch(`/api/projects/${project.projectId}/receipt-pdf`)
      if (receiptPdf) {
        await sendTelegramDocument(
          Buffer.from(receiptPdf as any),
          `Kwitansi_${project.projectNumber}.pdf`,
          `🧾 <b>Kwitansi</b>\nProject: ${project.projectNumber}`
        )
      }
    } catch (error) {
      console.error('[Telegram] Error sending PDFs:', error)
    }
  }

  return true
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

/**
 * Send expense notification
 */
export async function notifyExpense(expense: {
  type: string
  category: string
  description: string
  amount: number
  projectNumber?: string
  projectTitle?: string
}) {
  const amountStr = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(expense.amount)

  const typeLabels: Record<string, string> = {
    PROJECT: '📁 Pengeluaran Project',
    OPERATIONAL: '🏢 Pengeluaran Operasional',
    SALARY: '💼 Gaji/Upah',
    ASSET: '🏗️ Asset',
  }

  const typeLabel = typeLabels[expense.type] || '💸 Pengeluaran'

  const message = `${typeLabel}

💵 <b>Jumlah:</b> ${amountStr}
📝 <b>Kategori:</b> ${expense.category}
📋 <b>Keterangan:</b> ${expense.description}
${expense.projectNumber ? `📁 <b>Project:</b> ${expense.projectNumber}` : ''}
${expense.projectTitle ? `📌 <b>Judul:</b> ${expense.projectTitle}` : ''}`

  return sendTelegramMessage(message)
}

/**
 * Send stock opname notification
 */
export async function notifyStockOpname(opname: {
  productName: string
  productSku: string
  systemStock: number
  actualStock: number
  difference: number
  unit: string
  notes?: string
}) {
  const diffIcon = opname.difference > 0 ? '📈' : opname.difference < 0 ? '📉' : '✅'
  const diffText =
    opname.difference > 0 ? 'Kelebihan' : opname.difference < 0 ? 'Kekurangan' : 'Sesuai'

  const message = `📦 <b>Stock Opname</b>

📌 <b>Produk:</b> ${opname.productName}
🏷️ <b>SKU:</b> ${opname.productSku}

💾 <b>Stok Sistem:</b> ${opname.systemStock} ${opname.unit}
📊 <b>Stok Aktual:</b> ${opname.actualStock} ${opname.unit}
${diffIcon} <b>Selisih:</b> ${opname.difference > 0 ? '+' : ''}${opname.difference} ${opname.unit} (${diffText})${
    opname.notes
      ? `

📝 <b>Catatan:</b> ${opname.notes}`
      : ''
  }`

  return sendTelegramMessage(message)
}
