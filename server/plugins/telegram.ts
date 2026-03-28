/**
 * Telegram Bot Plugin
 * - Production: webhook mode (Telegram pushes updates to our server — no conflicts)
 * - Development: polling mode
 */
import { startPolling } from '../utils/telegram-polling'

export default defineNitroPlugin(async () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const token = process.env.TELEGRAM_BOT_TOKEN
  const baseUrl = process.env.BASE_URL

  if (!token) {
    console.log('[Telegram Plugin] TELEGRAM_BOT_TOKEN not set, skipping')
    return
  }

  if (isProduction && baseUrl) {
    console.log('[Telegram Plugin] Production mode — registering webhook...')

    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`

    try {
      // First delete any existing webhook/polling sessions cleanly
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`)

      // Register webhook with Telegram
      const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query'],
        }),
      })
      const result = await res.json() as any
      if (result.ok) {
        console.log(`[Telegram Plugin] Webhook registered: ${webhookUrl}`)
      } else {
        console.error('[Telegram Plugin] Failed to register webhook:', result.description)
      }
    } catch (err) {
      console.error('[Telegram Plugin] Error registering webhook:', err)
    }
  } else {
    console.log('[Telegram Plugin] Development mode — starting polling...')
    startPolling()
  }
})
