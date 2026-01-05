# Telegram Webhook DNS Fix

## Problem

```
Bad Request: bad webhook: Failed to resolve host: Temporary failure in name resolution
```

Telegram servers cannot resolve `erp.ocnetworks.web.id` (IP: 49.128.178.235)

## Solutions (Try in Order)

### 1. Use IP Address (Quick Test)

Set webhook to: `https://49.128.178.235/api/telegram/webhook`

**Steps:**

1. Login to your ERP system
2. Go to Settings > Integrations
3. Enter: `https://49.128.178.235/api/telegram/webhook`
4. Click "Set Webhook"

**Note:** This will work but SSL certificate won't match (might show warnings)

---

### 2. Wait for DNS Propagation (Recommended)

If you recently changed DNS settings, wait 24-48 hours for full propagation.

**Check DNS propagation:**

- https://dnschecker.org/#A/erp.ocnetworks.web.id
- Ensure all regions show IP: 49.128.178.235

---

### 3. Use Cloudflare DNS (Best Solution)

Telegram works well with Cloudflare's globally distributed DNS.

**Steps:**

1. Login to your domain registrar (web.id)
2. Change nameservers to Cloudflare:
   - `budi.ns.cloudflare.com`
   - `dora.ns.cloudflare.com`
3. Add A record: `erp` → `49.128.178.235`
4. Enable proxy (orange cloud) for DDoS protection
5. Wait 10-30 minutes for propagation
6. Set webhook: `https://erp.ocnetworks.web.id/api/telegram/webhook`

---

### 4. Use Alternative Webhook Method (Polling)

If webhook keeps failing, use polling mode instead.

**Create:** `server/utils/telegram-polling.ts`

```typescript
/**
 * Telegram Bot Polling (Alternative to Webhook)
 */
import { processUpdate } from './telegram-commands'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
let offset = 0
let isPolling = false

export async function startPolling() {
  if (isPolling) return
  isPolling = true

  console.log('[Telegram] Starting polling mode...')

  while (isPolling) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`
      )
      const data = await response.json()

      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1
          await processUpdate(update).catch(err => {
            console.error('[Telegram Polling] Error:', err)
          })
        }
      }
    } catch (error) {
      console.error('[Telegram Polling] Fetch error:', error)
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5s on error
    }
  }
}

export function stopPolling() {
  isPolling = false
}
```

**Update:** `server/plugins/telegram.ts` (create if not exists)

```typescript
import { startPolling } from '../utils/telegram-polling'

export default defineNitroPlugin(() => {
  // Only start polling in production
  if (process.env.NODE_ENV === 'production') {
    startPolling()
  }
})
```

**Disable webhook first:**

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook
```

---

## Current Status

- ✅ Domain resolves locally: `erp.ocnetworks.web.id` → `49.128.178.235`
- ✅ HTTPS port 443 accessible
- ❌ Telegram servers cannot resolve domain
- ✅ Webhook endpoint ready: `/api/telegram/webhook`

## Recommended Action

1. **Short-term:** Use IP address webhook or enable polling mode
2. **Long-term:** Move DNS to Cloudflare for better reliability

## Verify Webhook

After setting webhook, test it:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Should show:

```json
{
  "ok": true,
  "result": {
    "url": "https://erp.ocnetworks.web.id/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```
