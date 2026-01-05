/**
 * Telegram Bot Polling Mode
 * Alternative to webhook - no DNS required
 */
import { processUpdate } from './telegram-commands'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
let offset = 0
let isPolling = false

export async function startPolling() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram Polling] TELEGRAM_BOT_TOKEN not found, skipping')
    return
  }

  if (isPolling) {
    console.log('[Telegram Polling] Already running')
    return
  }

  isPolling = true
  console.log('[Telegram Polling] Starting bot in polling mode...')

  // Delete webhook first
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`)
    console.log('[Telegram Polling] Webhook deleted')
  } catch (err) {
    console.error('[Telegram Polling] Failed to delete webhook:', err)
  }

  // Start polling loop
  poll()
}

async function poll() {
  while (isPolling) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.ok && data.result.length > 0) {
        console.log(`[Telegram Polling] Received ${data.result.length} update(s)`)

        for (const update of data.result) {
          offset = update.update_id + 1

          // Process update asynchronously
          processUpdate(update).catch(err => {
            console.error('[Telegram Polling] Error processing update:', err)
          })
        }
      }
    } catch (error: any) {
      console.error('[Telegram Polling] Error:', error.message)
      // Wait 5 seconds before retry on error
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

export function stopPolling() {
  console.log('[Telegram Polling] Stopping...')
  isPolling = false
}
