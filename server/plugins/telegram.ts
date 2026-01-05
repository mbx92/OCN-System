/**
 * Telegram Bot Plugin
 * Auto-start polling in production
 */
import { startPolling } from '../utils/telegram-polling'

export default defineNitroPlugin(() => {
  // Start polling in production mode
  if (process.env.NODE_ENV === 'production') {
    console.log('[Telegram Plugin] Initializing bot in production mode...')
    startPolling()
  } else {
    console.log('[Telegram Plugin] Development mode - polling disabled')
    console.log('[Telegram Plugin] Use webhook for local testing')
  }
})
