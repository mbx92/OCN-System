/**
 * Telegram Webhook Endpoint
 * Receives updates from Telegram Bot API
 */
import { processUpdate } from '../../utils/telegram-commands'

export default defineEventHandler(async event => {
  const body = await readBody(event)

  // Verify this is a valid Telegram update
  if (!body || !body.update_id) {
    throw createError({
      statusCode: 400,
      message: 'Invalid update',
    })
  }

  // Process the update asynchronously (don't wait)
  processUpdate(body).catch(err => {
    console.error('[Telegram Webhook] Error processing update:', err)
  })

  // Always return OK to Telegram
  return { ok: true }
})
