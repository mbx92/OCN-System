export default defineEventHandler(async () => {
  // Get integrations config from company settings or return defaults
  const company = await prisma.company.findFirst()

  const settings = (company?.settings as any) || {}

  return {
    telegram: {
      enabled: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
      configured: !!process.env.TELEGRAM_BOT_TOKEN,
      // Don't expose actual token, just show if configured
      botToken: process.env.TELEGRAM_BOT_TOKEN
        ? '••••••••' + process.env.TELEGRAM_BOT_TOKEN.slice(-4)
        : '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      notifications: settings.telegramNotifications || {
        newProject: true,
        projectCompleted: true,
        paymentReceived: true,
        maintenanceSchedule: true,
        warrantyClaim: true,
      },
    },
    midtrans: {
      enabled: false,
      configured: !!process.env.MIDTRANS_SERVER_KEY,
      serverKey: process.env.MIDTRANS_SERVER_KEY
        ? '••••••••' + process.env.MIDTRANS_SERVER_KEY.slice(-4)
        : '',
      clientKey: process.env.MIDTRANS_CLIENT_KEY
        ? '••••••••' + process.env.MIDTRANS_CLIENT_KEY.slice(-4)
        : '',
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    },
    whatsapp: {
      enabled: false,
      configured: false,
    },
  }
})
