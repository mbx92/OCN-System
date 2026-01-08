// API endpoint untuk kirim slip pembayaran via Telegram
import dayjs from 'dayjs'

export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { technicianId, period, startDate, endDate } = body

  if (!technicianId) {
    throw createError({
      statusCode: 400,
      message: 'Technician ID is required',
    })
  }

  try {
    // Get technician info with telegram chat ID
    const technician = await prisma.technician.findUnique({
      where: { id: technicianId },
      select: {
        name: true,
        phone: true,
        user: {
          select: {
            telegramChatId: true,
          },
        },
      },
    })

    if (!technician) {
      throw createError({
        statusCode: 404,
        message: 'Technician not found',
      })
    }

    if (!technician.user?.telegramChatId) {
      throw createError({
        statusCode: 400,
        message: 'Technician does not have Telegram integration',
      })
    }

    // Fetch payment recap
    const params = new URLSearchParams({ technicianId })
    if (period) params.append('period', period)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const recap: any = await $fetch(`/api/technicians/payment-recap?${params.toString()}`)

    // Generate HTML for PDF
    const slipResponse: any = await $fetch(
      `/api/technicians/payment-slip/generate?${params.toString()}`
    )

    // Prepare message for Telegram
    const periodDisplay = recap.period.display
    const message = `
📄 *SLIP PEMBAYARAN TEKNISI*

👤 *${technician.name}*
📅 *Periode:* ${periodDisplay}

━━━━━━━━━━━━━━━━━━━━
💰 *RINGKASAN*
━━━━━━━━━━━━━━━━━━━━

💵 Total Pembayaran: Rp ${Number(recap.summary.totalPayments).toLocaleString('id-ID')}
${recap.summary.totalBonuses > 0 ? `🎁 Bonus: Rp ${Number(recap.summary.totalBonuses).toLocaleString('id-ID')}` : ''}
${recap.summary.totalCashAdvances > 0 ? `📉 Potongan Kas Bon: Rp ${Number(recap.summary.totalCashAdvances).toLocaleString('id-ID')}` : ''}

━━━━━━━━━━━━━━━━━━━━
✅ *TOTAL BERSIH*
*Rp ${Number(recap.summary.netPayment).toLocaleString('id-ID')}*
━━━━━━━━━━━━━━━━━━━━

_Slip pembayaran lengkap ada di dokumen PDF di atas._
    `.trim()

    // Get Telegram bot settings
    const company = await prisma.company.findFirst()
    const settings = company?.settings as any
    const botToken = settings?.telegramBotToken

    if (!botToken) {
      throw createError({
        statusCode: 500,
        message: 'Telegram bot not configured',
      })
    }

    // For now, send message with text (PDF generation will be enhanced later)
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

    await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: technician.user.telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'SEND',
        entity: 'PAYMENT_SLIP',
        entityId: technicianId,
        metadata: {
          technicianName: technician.name,
          period: periodDisplay,
          totalPayment: recap.summary.netPayment,
        },
      },
    })

    return {
      success: true,
      message: 'Payment slip sent to Telegram successfully',
    }
  } catch (error: any) {
    console.error('Error sending payment slip:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to send payment slip',
    })
  }
})
