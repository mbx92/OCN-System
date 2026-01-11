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

📄 Invoice sedang dikirim...`

  await sendTelegramMessage(message)

  // Send Invoice PDF if projectId provided
  if (project.projectId) {
    try {
      console.log('[Telegram] Fetching project data for Invoice PDF:', project.projectId)

      // Import PDF generator
      const { generateInvoicePdfBuffer } = await import('./pdf-generator')
      const { prisma } = await import('./prisma')

      // Get project data with related info
      const projectData = await prisma.project.findUnique({
        where: { id: project.projectId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
          payments: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!projectData) {
        console.error('[Telegram] Project not found:', project.projectId)
        await sendTelegramMessage('❌ Error: Project data tidak ditemukan')
        return true
      }

      console.log('[Telegram] Project data fetched, payments count:', projectData.payments.length)

      const company = await prisma.company.findFirst()
      console.log('[Telegram] Company data:', {
        found: !!company,
        name: company?.name,
        hasSettings: !!company?.settings,
        settings: company?.settings,
      })
      const latestPayment = projectData.payments[projectData.payments.length - 1]

      if (latestPayment) {
        console.log('[Telegram] Latest payment found, generating PDFs...')

        const paymentWithProject = {
          ...latestPayment,
          project: projectData,
        }

        // Generate and send Invoice PDF only
        try {
          console.log('[Telegram] Generating invoice PDF...')
          const invoicePdf = await generateInvoicePdfBuffer(paymentWithProject, company)
          if (invoicePdf) {
            console.log('[Telegram] Invoice PDF generated, sending...')
            await sendTelegramDocument(
              invoicePdf,
              `Invoice_${project.projectNumber}.pdf`,
              `📄 <b>Invoice</b>\nProject: ${project.projectNumber}`
            )
            console.log('[Telegram] Invoice PDF sent successfully')
          } else {
            console.error('[Telegram] Invoice PDF generation returned null')
          }
        } catch (err) {
          console.error('[Telegram] Error generating invoice PDF:', err)
          await sendTelegramMessage(`❌ Error generating invoice: ${err.message}`)
        }
      } else {
        console.log('[Telegram] No payment found for project')
        await sendTelegramMessage(
          '⚠️ Tidak ada pembayaran yang tercatat untuk project ini. Invoice tidak dapat dibuat.'
        )
      }
    } catch (error) {
      console.error('[Telegram] Error sending Invoice PDF:', error)
      await sendTelegramMessage(`❌ Error: ${error.message}`)
    }
  }

  return true
}

/**
 * Send payment received notification with Receipt PDF (Kwitansi)
 */
export async function notifyPaymentReceived(payment: {
  amount: number
  projectNumber?: string
  customerName?: string
  paymentType: string
  paymentId?: string
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
${payment.projectNumber ? `📁 <b>Project:</b> ${payment.projectNumber}` : ''}

🧾 Kwitansi sedang dikirim...`

  await sendTelegramMessage(message)

  // Send Receipt PDF for FULL payment or SETTLEMENT (pelunasan)
  if (
    payment.paymentId &&
    (payment.paymentType === 'FULL' || payment.paymentType === 'SETTLEMENT')
  ) {
    try {
      console.log('[Telegram] Fetching payment data for Receipt PDF:', payment.paymentId)

      const { generateReceiptPdfBuffer } = await import('./pdf-generator')
      const { prisma } = await import('./prisma')

      // Get payment data with project info
      const paymentData = await prisma.payment.findUnique({
        where: { id: payment.paymentId },
        include: {
          project: {
            include: {
              customer: true,
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      })

      if (!paymentData) {
        console.error('[Telegram] Payment not found:', payment.paymentId)
        await sendTelegramMessage('❌ Error: Payment data tidak ditemukan')
        return true
      }

      if (!paymentData.project) {
        console.log('[Telegram] Payment tidak terkait dengan project, skip PDF')
        return true
      }

      console.log('[Telegram] Payment data fetched, generating Receipt PDF...')

      const company = await prisma.company.findFirst()
      console.log('[Telegram] Company data:', {
        found: !!company,
        name: company?.name,
        hasSettings: !!company?.settings,
        settings: company?.settings,
      })

      // Generate and send Receipt PDF
      try {
        console.log('[Telegram] Generating receipt PDF...')
        const receiptPdf = await generateReceiptPdfBuffer(paymentData, company)
        if (receiptPdf) {
          console.log('[Telegram] Receipt PDF generated, sending...')
          await sendTelegramDocument(
            receiptPdf,
            `Kwitansi_${payment.projectNumber}.pdf`,
            `🧾 <b>Kwitansi Pembayaran</b>\nProject: ${payment.projectNumber}`
          )
          console.log('[Telegram] Receipt PDF sent successfully')
        } else {
          console.error('[Telegram] Receipt PDF generation returned null')
        }
      } catch (err) {
        console.error('[Telegram] Error generating receipt PDF:', err)
        await sendTelegramMessage(`❌ Error generating kwitansi: ${err.message}`)
      }
    } catch (error) {
      console.error('[Telegram] Error sending Receipt PDF:', error)
      await sendTelegramMessage(`❌ Error: ${error.message}`)
    }
  }

  return true
}

/**
 * Send invoice created notification with Invoice PDF
 */
export async function notifyInvoiceCreated(invoice: {
  amount: number
  projectNumber?: string
  customerName?: string
  paymentNumber: string
  dueDate?: Date | null
  paymentId?: string
}) {
  const amountStr = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(invoice.amount)

  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Tidak ada batas waktu'

  const message = `📄 <b>Invoice Baru</b>

📋 <b>No Invoice:</b> ${invoice.paymentNumber}
💵 <b>Jumlah:</b> ${amountStr}
${invoice.customerName ? `👤 <b>Customer:</b> ${invoice.customerName}` : ''}
${invoice.projectNumber ? `📁 <b>Project:</b> ${invoice.projectNumber}` : ''}
📅 <b>Jatuh Tempo:</b> ${dueDateStr}

📄 Invoice sedang dikirim...`

  await sendTelegramMessage(message)

  // Send Invoice PDF
  if (invoice.paymentId) {
    try {
      console.log('[Telegram] Fetching payment data for Invoice PDF:', invoice.paymentId)

      const { generateInvoicePdfBuffer } = await import('./pdf-generator')
      const { prisma } = await import('./prisma')

      // Get payment data with project info
      const paymentData = await prisma.payment.findUnique({
        where: { id: invoice.paymentId },
        include: {
          project: {
            include: {
              customer: true,
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      })

      if (!paymentData) {
        console.error('[Telegram] Payment not found:', invoice.paymentId)
        await sendTelegramMessage('❌ Error: Payment data tidak ditemukan')
        return true
      }

      if (!paymentData.project) {
        console.log('[Telegram] Payment tidak terkait dengan project, skip PDF')
        return true
      }

      console.log('[Telegram] Payment data fetched, generating Invoice PDF...')

      const company = await prisma.company.findFirst()
      console.log('[Telegram] Company data:', {
        found: !!company,
        name: company?.name,
        hasSettings: !!company?.settings,
        logoLength: (company?.settings as any)?.logo?.length,
      })

      // Generate and send Invoice PDF
      try {
        console.log('[Telegram] Generating invoice PDF...')
        const invoicePdf = await generateInvoicePdfBuffer(paymentData, company)
        if (invoicePdf) {
          console.log('[Telegram] Invoice PDF generated, sending...')
          await sendTelegramDocument(
            invoicePdf,
            `Invoice_${invoice.projectNumber}.pdf`,
            `📄 <b>Invoice</b>\nProject: ${invoice.projectNumber}\nJatuh Tempo: ${dueDateStr}`
          )
          console.log('[Telegram] Invoice PDF sent successfully')
        } else {
          console.error('[Telegram] Invoice PDF generation returned null')
        }
      } catch (err) {
        console.error('[Telegram] Error generating invoice PDF:', err)
        await sendTelegramMessage(`❌ Error generating invoice: ${err.message}`)
      }
    } catch (error) {
      console.error('[Telegram] Error sending Invoice PDF:', error)
      await sendTelegramMessage(`❌ Error: ${error.message}`)
    }
  }

  return true
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
