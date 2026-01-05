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
  if (!message?.text) {
    console.log('[Telegram] No text message, ignoring')
    return
  }

  const chatId = message.chat.id
  const text = message.text.trim()
  
  console.log('[Telegram] Processing message from', chatId, ':', text)

  // Parse command
  if (text.startsWith('/')) {
    const [command, ...args] = text.split(' ')
    const cmd = command.toLowerCase().replace('@', '').split('@')[0]

    console.log('[Telegram] Command:', cmd)

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
      case '/stok':
        return sendStockOpname(chatId)
      case '/opname':
        return createStockOpname(chatId, args)
      case '/produk':
        return sendProductCatalog(chatId, args.join(' '))
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
  if (!token) {
    console.error('[Telegram] TELEGRAM_BOT_TOKEN not configured!')
    return
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    })

    const result = await response.json()
    
    if (!result.ok) {
      console.error('[Telegram] Send message failed:', result)
    } else {
      console.log('[Telegram] Message sent to', chatId)
    }
  } catch (error) {
    console.error('[Telegram] Error sending message:', error)
  }
}

/**
 * /help command
 */
async function sendHelp(chatId: number) {
  const text = `🤖 <b>OCN System Bot - Panduan Lengkap</b>

━━━━━━━━━━━━━━━━━━━━━━
<b>📋 PERINTAH TERSEDIA</b>
━━━━━━━━━━━━━━━━━━━━━━

📅 <b>/jadwal</b>
   Lihat jadwal maintenance hari ini & besok

🛡️ <b>/garansi</b>
   Daftar klaim garansi yang pending

📁 <b>/project [nomor]</b>
   Info detail project
   Contoh: /project PRJ-2412-001

👤 <b>/customer [nama]</b>
   Cari data customer
   Contoh: /customer Budi

� <b>/produk [nama/sku]</b>
   Lihat catalog produk
   Contoh: /produk camera

�📊 <b>/laporan</b>
   Ringkasan harian sistem

📦 <b>/stok</b>
   Stock opname terbaru (10 terakhir)

✏️ <b>/opname [SKU] [jumlah] [catatan]</b>
   Buat stock opname baru
   Contoh: /opname CAM-001 50 hasil hitung

❓ <b>/help</b>
   Tampilkan bantuan ini

━━━━━━━━━━━━━━━━━━━━━━
<b>🔔 NOTIFIKASI OTOMATIS</b>
━━━━━━━━━━━━━━━━━━━━━━

Bot akan mengirimkan notifikasi otomatis untuk:

✅ <b>Project Selesai</b>
   • Notifikasi project completed
   • Invoice PDF
   • Kwitansi PDF

💰 <b>Pembayaran Diterima</b>
   • Jumlah pembayaran
   • Tipe pembayaran
   • Info customer & project

💸 <b>Pengeluaran Baru</b>
   • Pengeluaran project
   • Pengeluaran operasional
   • Gaji/Upah
   • Pembelian asset

🔧 <b>Jadwal Maintenance</b>
   • Jadwal maintenance baru
   • Tanggal & customer
   • Info project terkait

🛡️ <b>Klaim Garansi</b>
   • Klaim garansi baru
   • Masalah yang dilaporkan
   • Info customer

📦 <b>Stock Opname</b>
   • Pencatatan stock opname
   • Selisih stok sistem vs aktual
   • Penyesuaian otomatis

━━━━━━━━━━━━━━━━━━━━━━
<b>⚙️ CARA SETUP</b>
━━━━━━━━━━━━━━━━━━━━━━

1. Buka menu Settings → Integrations
2. Atur Telegram Bot Token & Chat ID
3. Klik "Set Webhook" untuk aktivasi
4. Bot siap menerima perintah & kirim notifikasi!

<i>Powered by OCN CCTV & Networking Solutions</i>`

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
    orderBy: { reportedDate: 'desc' },
    take: 10,
  })

  if (claims.length === 0) {
    return sendReply(chatId, '🛡️ Tidak ada klaim garansi pending.')
  }

  let text = '🛡️ <b>Klaim Garansi Pending</b>\n\n'

  for (const c of claims) {
    const date = dayjs(c.reportedDate).format('DD MMM')
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

/**
 * /stok command - Recent stock opnames
 */
async function sendStockOpname(chatId: number) {
  const opnames = await prisma.stockOpname.findMany({
    include: {
      product: {
        select: {
          name: true,
          sku: true,
          unit: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  if (opnames.length === 0) {
    return sendReply(chatId, '📦 Belum ada stock opname yang tercatat.')
  }

  let text = '📦 <b>Stock Opname Terbaru</b>\n\n'

  for (const o of opnames) {
    const date = dayjs(o.createdAt).format('DD MMM HH:mm')
    const diffIcon = o.difference > 0 ? '📈' : o.difference < 0 ? '📉' : '✅'
    const diff = o.difference > 0 ? `+${o.difference}` : o.difference

    text += `${diffIcon} <b>${o.product.name}</b>\n📅 ${date} | 🏷️ ${o.product.sku}\n💾 Sistem: ${o.systemStock} → 📊 Aktual: ${o.actualStock}\nSelisih: ${diff} ${o.product.unit}\n\n`
  }

  return sendReply(chatId, text)
}

/**
 * /opname command - Create stock opname
 */
async function createStockOpname(chatId: number, args: string[]) {
  if (args.length < 2) {
    return sendReply(
      chatId,
      `❗ <b>Format salah!</b>

Gunakan: /opname [SKU] [jumlah] [catatan]

<b>Contoh:</b>
/opname CAM-001 50
/opname CAM-001 50 hasil hitung gudang`
    )
  }

  const [sku, actualStockStr, ...notesParts] = args
  const actualStock = parseInt(actualStockStr)

  if (isNaN(actualStock) || actualStock < 0) {
    return sendReply(chatId, '❌ Jumlah stok harus berupa angka positif!')
  }

  try {
    // Find product by SKU
    const product = await prisma.product.findFirst({
      where: { sku: { equals: sku, mode: 'insensitive' } },
    })

    if (!product) {
      return sendReply(chatId, `❌ Produk dengan SKU "${sku}" tidak ditemukan.`)
    }

    // Get or create stock
    let stock = await prisma.stock.findUnique({
      where: { productId: product.id },
    })

    if (!stock) {
      stock = await prisma.stock.create({
        data: {
          productId: product.id,
          quantity: 0,
          reserved: 0,
          available: 0,
        },
      })
    }

    const systemStock = stock.quantity
    const difference = actualStock - systemStock
    const notes = notesParts.join(' ') || null

    // Create stock opname
    const stockOpname = await prisma.stockOpname.create({
      data: {
        productId: product.id,
        systemStock,
        actualStock,
        difference,
        notes,
        createdBy: 'telegram-bot', // Special user ID for telegram
      },
    })

    // Update stock if there's difference
    if (difference !== 0) {
      await prisma.stock.update({
        where: { productId: product.id },
        data: {
          quantity: actualStock,
          available: stock.available + difference,
        },
      })

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          stockId: stock.id,
          type: difference > 0 ? 'OPNAME_IN' : 'OPNAME_OUT',
          quantity: Math.abs(difference),
          reference: `Stock Opname - ${stockOpname.id}`,
          notes: `Via Telegram Bot. ${notes || ''}`,
        },
      })
    }

    const diffIcon = difference > 0 ? '📈' : difference < 0 ? '📉' : '✅'
    const diffText = difference > 0 ? 'Kelebihan' : difference < 0 ? 'Kekurangan' : 'Sesuai'

    const successMsg = `✅ <b>Stock Opname Berhasil</b>

📦 <b>Produk:</b> ${product.name}
🏷️ <b>SKU:</b> ${product.sku}

💾 <b>Stok Sistem:</b> ${systemStock} ${product.unit}
📊 <b>Stok Aktual:</b> ${actualStock} ${product.unit}
${diffIcon} <b>Selisih:</b> ${difference > 0 ? '+' : ''}${difference} ${product.unit} (${diffText})${notes ? `\n\n📝 <b>Catatan:</b> ${notes}` : ''}`

    return sendReply(chatId, successMsg)
  } catch (error: any) {
    console.error('Error creating stock opname via Telegram:', error)
    return sendReply(chatId, `❌ Gagal membuat stock opname: ${error.message}`)
  }
}

/**
 * /produk command - Product catalog
 */
async function sendProductCatalog(chatId: number, search?: string) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const products = await prisma.product.findMany({
    where,
    include: {
      stock: true,
    },
    orderBy: { name: 'asc' },
    take: 15,
  })

  if (products.length === 0) {
    return sendReply(
      chatId,
      search
        ? `❌ Produk "${search}" tidak ditemukan.\n\nCoba gunakan: /produk untuk melihat semua produk`
        : '❌ Belum ada produk terdaftar.'
    )
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(n)

  let text = `📦 <b>Catalog Produk</b>${search ? ` - "${search}"` : ''}\n\n`

  for (const p of products) {
    const stock = p.stock?.quantity || 0
    const stockIcon = stock > 10 ? '✅' : stock > 0 ? '⚠️' : '❌'

    text += `${stockIcon} <b>${p.name}</b>\n🏷️ SKU: <code>${p.sku}</code>\n💰 ${formatCurrency(Number(p.sellingPrice))}\n💾 Stok: ${stock} ${p.unit}\n\n`
  }

  if (products.length === 15) {
    text += '<i>Menampilkan 15 produk pertama. Gunakan pencarian untuk hasil lebih spesifik.</i>'
  }

  return sendReply(chatId, text)
}
