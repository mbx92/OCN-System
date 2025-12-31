export default defineEventHandler(async event => {
  const body = await readBody(event)

  // Get or create company record
  let company = await prisma.company.findFirst()

  const currentSettings = (company?.settings as any) || {}

  // Update telegram notification settings
  if (body.telegramNotifications) {
    currentSettings.telegramNotifications = body.telegramNotifications
  }

  if (company) {
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        settings: currentSettings,
      },
    })
  } else {
    company = await prisma.company.create({
      data: {
        name: 'OCN CCTV & Networking Solutions',
        settings: currentSettings,
      },
    })
  }

  return { success: true }
})
