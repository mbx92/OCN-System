/**
 * Delete Telegram Webhook
 */
export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user || user.role !== 'OWNER') {
    throw createError({
      statusCode: 403,
      message: 'Only owner can delete webhook',
    })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'TELEGRAM_BOT_TOKEN tidak ditemukan',
    })
  }

  try {
    // Delete webhook
    const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
    })

    const result = await response.json()

    if (!result.ok) {
      throw createError({
        statusCode: 400,
        message: 'Gagal hapus webhook',
      })
    }

    return {
      success: true,
      message: 'Webhook berhasil dihapus',
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Gagal hapus webhook',
    })
  }
})
