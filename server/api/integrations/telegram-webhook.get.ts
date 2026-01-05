/**
 * Get Telegram Webhook Info
 */
export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user || user.role !== 'OWNER') {
    throw createError({
      statusCode: 403,
      message: 'Only owner can view webhook info',
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
    const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
    const result = await response.json()

    if (!result.ok) {
      throw createError({
        statusCode: 400,
        message: 'Gagal mendapatkan info webhook',
      })
    }

    return result.result
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Gagal mendapatkan info webhook',
    })
  }
})
