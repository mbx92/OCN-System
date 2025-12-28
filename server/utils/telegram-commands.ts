/**
 * Telegram Bot Command Handlers
 */
import dayjs from 'dayjs'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
  }
}

/**
 * Process incoming Telegram update
 */
export async function processUpdate(update: TelegramUpdate) {
  const message = update.message
  if (!message?.text) return

  const chatId = message.chat.id
  const text = message.text.trim()

  // Parse command
  if (text.startsWith('/')) {
    const [command, ...args] = text.split(' ')
    const cmd = command.toLowerCase().replace('@', '').split('@')[0]

    switch (cmd) {
      case '/start':
      case '/help':
        return sendHelp(chatId)
      case '/jadwal':
        return sendMaintenanceSchedule(chatId)
      case '/garansi':
        return sendWarrantyClaims(chatId)
      case '/project':
        return sendProjectInfo(chatId, args.join(' '))
      case '/customer':
        return sendCustomerInfo(chatId, args.join(' '))
      case '/laporan':
        return sendDailyReport(chatId)
      default:
        return sendReply(chatId, '❓ Perintah tidak dikenal. Ketik /help untuk bantuan.')
    }
  }
}

/**
 * Send reply to Telegram
 */
async function sendReply(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })
}

/**
 * /help command
 */
async function sendHelp(chatId: number) {
  const text = `🤖 <b>OCN System Bot</b>

<b>Perintah tersedia:</b>
/jadwal - Jadwal maintenance hari ini & besok
/garansi - Klaim garansi pending
/project [nomor] - Info project tertentu
/customer [nama] - Cari customer
/laporan - Ringkasan harian
/help - Tampilkan bantuan ini`

  return sendReply(chatId, text)
}

/**
 * /jadwal command - Today & tomorrow's maintenance
 */
async function sendMaintenanceSchedule(chatId: number) {
  const today = dayjs().startOf('day').toDate()
  const dayAfterTomorrow = dayjs().add(2, 'day').startOf('day').toDate()

  const schedules = await prisma.maintenanceSchedule.findMany({
    where: {
      scheduledDate: {
        gte: today,
        lt: dayAfterTomorrow,
      },
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    },
    include: {
      project: { include: { customer: true } },
      customer: true,
    },
    orderBy: { scheduledDate: 'asc' },
    take: 10,
  })

  if (schedules.length === 0) {
    return sendReply(chatId, '📅 Tidak ada jadwal maintenance untuk hari ini & besok.')
  }

  let text = '🔧 <b>Jadwal Maintenance</b>\n\n'

  for (const s of schedules) {
    const date = dayjs(s.scheduledDate).format('DD MMM')
    const customer = s.project?.customer?.name || s.customer?.name || '-'
    const status = s.status === 'IN_PROGRESS' ? '🔄' : '📅'
    text += `${status} <b>${date}</b> - ${s.title}\n👤 ${customer}\n\n`
  }

  return sendReply(chatId, text)
}

/**
 * /garansi command - Pending warranty claims
 */
async function sendWarrantyClaims(chatId: number) {
  const claims = await prisma.warrantyClaim.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    include: {
      warranty: {
        include: {
          project: { include: { customer: true } },
        },
      },
    },
    orderBy: { claimDate: 'desc' },
    take: 10,
  })

  if (claims.length === 0) {
    return sendReply(chatId, '🛡️ Tidak ada klaim garansi pending.')
  }

  let text = '🛡️ <b>Klaim Garansi Pending</b>\n\n'

  for (const c of claims) {
    const date = dayjs(c.claimDate).format('DD MMM')
    const customer = c.warranty.project?.customer?.name || '-'
    const status = c.status === 'IN_PROGRESS' ? '🔄' : '⏳'
    text += `${status} <b>${c.claimNumber}</b>\n📅 ${date} | 👤 ${customer}\n📝 ${c.description.slice(0, 50)}${c.description.length > 50 ? '...' : ''}\n\n`
  }

  return sendReply(chatId, text)
}

/**
 * /project command - Project info
 */
async function sendProjectInfo(chatId: number, projectNumber: string) {
  if (!projectNumber) {
    return sendReply(chatId, '❗ Gunakan: /project [nomor project]\nContoh: /project PRJ-2412-001')
  }

  const project = await prisma.project.findFirst({
    where: {
      projectNumber: { contains: projectNumber, mode: 'insensitive' },
    },
    include: {
      customer: true,
      payments: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  })

  if (!project) {
    return sendReply(chatId, `❌ Project "${projectNumber}" tidak ditemukan.`)
  }

  const totalPaid = project.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(n)

  const text = `📁 <b>Project ${project.projectNumber}</b>

📋 <b>Judul:</b> ${project.title}
👤 <b>Customer:</b> ${project.customer.name}
📊 <b>Status:</b> ${project.status}
💰 <b>Budget:</b> ${formatCurrency(Number(project.budget))}
💵 <b>Terbayar:</b> ${formatCurrency(totalPaid)}`

  return sendReply(chatId, text)
}

/**
 * /customer command - Search customer
 */
async function sendCustomerInfo(chatId: number, name: string) {
  if (!name) {
    return sendReply(chatId, '❗ Gunakan: /customer [nama]\nContoh: /customer Budi')
  }

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: name, mode: 'insensitive' } },
        { companyName: { contains: name, mode: 'insensitive' } },
      ],
    },
    include: {
      _count: { select: { projects: true } },
    },
    take: 5,
  })

  if (customers.length === 0) {
    return sendReply(chatId, `❌ Customer "${name}" tidak ditemukan.`)
  }

  let text = '👥 <b>Hasil Pencarian Customer</b>\n\n'

  for (const c of customers) {
    text += `👤 <b>${c.name}</b>${c.companyName ? ` (${c.companyName})` : ''}\n📞 ${c.phone}\n📁 ${c._count.projects} project\n\n`
  }

  return sendReply(chatId, text)
}

/**
 * /laporan command - Daily summary
 */
async function sendDailyReport(chatId: number) {
  const today = dayjs().startOf('day').toDate()
  const tomorrow = dayjs().add(1, 'day').startOf('day').toDate()

  const [maintenanceToday, claimsPending, paymentsToday, projectsOngoing] = await Promise.all([
    prisma.maintenanceSchedule.count({
      where: {
        scheduledDate: { gte: today, lt: tomorrow },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    }),
    prisma.warrantyClaim.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
    }),
    prisma.payment.aggregate({
      where: { createdAt: { gte: today, lt: tomorrow } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.project.count({
      where: { status: 'ONGOING' },
    }),
  ])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(n)

  const text = `📊 <b>Laporan Harian</b>
📅 ${dayjs().format('DD MMMM YYYY')}

🔧 Maintenance hari ini: <b>${maintenanceToday}</b>
🛡️ Klaim garansi pending: <b>${claimsPending}</b>
📁 Project ongoing: <b>${projectsOngoing}</b>

💰 <b>Pembayaran Hari Ini</b>
📝 Transaksi: ${paymentsToday._count}
💵 Total: ${formatCurrency(Number(paymentsToday._sum.amount || 0))}`

  return sendReply(chatId, text)
}
