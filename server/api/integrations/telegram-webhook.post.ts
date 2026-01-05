/**
 * Set Telegram Webhook
 */
export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user || user.role !== 'OWNER') {
    throw createError({
      statusCode: 403,
      message: 'Only owner can set webhook',
    })
  }

  const body = await readBody(event)
  const { webhookUrl } = body

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'TELEGRAM_BOT_TOKEN tidak ditemukan di environment variables',
    })
  }

  try {
    // Set webhook
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      throw createError({
        statusCode: 400,
        message: result.description || 'Gagal set webhook',
      })
    }

    return {
      success: true,
      message: 'Webhook berhasil di-set',
      result,
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Gagal set webhook',
    })
  }
})
