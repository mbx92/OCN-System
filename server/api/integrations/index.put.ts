export default defineEventHandler(async event => {
  const body = await readBody(event)

  // Handle integration enable/disable and config updates
  if (body.integration) {
    const { name, enabled, config } = body.integration

    await prisma.integrationSetting.upsert({
      where: { name },
      update: {
        enabled: enabled ?? undefined,
        config: config ?? undefined,
      },
      create: {
        name,
        enabled: enabled ?? false,
        config: config ?? {},
      },
    })

    return { success: true, message: `Integrasi ${name} berhasil diperbarui` }
  }

  // Handle telegram notification settings (legacy, stored in company settings)
  if (body.telegramNotifications) {
    let company = await prisma.company.findFirst()
    const currentSettings = (company?.settings as any) || {}
    currentSettings.telegramNotifications = body.telegramNotifications

    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { settings: currentSettings },
      })
    } else {
      await prisma.company.create({
        data: {
          name: 'OCN CCTV & Networking Solutions',
          settings: currentSettings,
        },
      })
    }

    return { success: true, message: 'Pengaturan notifikasi Telegram berhasil disimpan' }
  }

  return { success: false, message: 'No valid data provided' }
})
