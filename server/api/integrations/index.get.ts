export default defineEventHandler(async () => {
  // Get integrations from database
  const integrations = await prisma.integrationSetting.findMany()

  // Convert to map for easier access
  const integrationsMap: Record<string, any> = {}
  integrations.forEach(i => {
    integrationsMap[i.name] = {
      enabled: i.enabled,
      config: i.config,
    }
  })

  // Get company settings for telegram notifications
  const company = await prisma.company.findFirst()
  const companySettings = (company?.settings as any) || {}

  return {
    telegram: {
      enabled: integrationsMap.telegram?.enabled ?? true,
      configured: !!process.env.TELEGRAM_BOT_TOKEN,
      botToken: process.env.TELEGRAM_BOT_TOKEN
        ? '••••••••' + process.env.TELEGRAM_BOT_TOKEN.slice(-4)
        : '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      notifications: companySettings.telegramNotifications || {
        newProject: true,
        projectCompleted: true,
        paymentReceived: true,
        maintenanceSchedule: true,
        warrantyClaim: true,
      },
    },
    midtrans: {
      enabled: integrationsMap.midtrans?.enabled ?? false,
      configured: !!(
        integrationsMap.midtrans?.config?.serverKey || process.env.MIDTRANS_SERVER_KEY
      ),
      serverKey: integrationsMap.midtrans?.config?.serverKey
        ? '••••••••' + String(integrationsMap.midtrans.config.serverKey).slice(-4)
        : process.env.MIDTRANS_SERVER_KEY
          ? '••••••••' + process.env.MIDTRANS_SERVER_KEY.slice(-4)
          : '',
      clientKey: integrationsMap.midtrans?.config?.clientKey
        ? '••••••••' + String(integrationsMap.midtrans.config.clientKey).slice(-4)
        : process.env.MIDTRANS_CLIENT_KEY
          ? '••••••••' + process.env.MIDTRANS_CLIENT_KEY.slice(-4)
          : '',
      isProduction: integrationsMap.midtrans?.config?.isProduction ?? false,
    },
    whatsapp: {
      enabled: integrationsMap.whatsapp?.enabled ?? false,
      configured: !!(integrationsMap.whatsapp?.config?.apiToken || process.env.WHATSAPP_API_TOKEN),
      apiToken: integrationsMap.whatsapp?.config?.apiToken
        ? '••••••••' + String(integrationsMap.whatsapp.config.apiToken).slice(-4)
        : '',
      deviceId: integrationsMap.whatsapp?.config?.deviceId || '',
    },
    email: {
      enabled: integrationsMap.email?.enabled ?? false,
      configured: !!(integrationsMap.email?.config?.host || process.env.SMTP_HOST),
      host: integrationsMap.email?.config?.host || process.env.SMTP_HOST || '',
      port: integrationsMap.email?.config?.port || process.env.SMTP_PORT || 587,
      user: integrationsMap.email?.config?.user
        ? '••••••••' + String(integrationsMap.email.config.user).slice(-4)
        : '',
      from: integrationsMap.email?.config?.from || process.env.SMTP_FROM || '',
      secure: integrationsMap.email?.config?.secure ?? false,
    },
  }
})
