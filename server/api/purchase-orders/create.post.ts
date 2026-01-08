import { z } from 'zod'
import dayjs from 'dayjs'

const createPoSchema = z.object({
  supplierId: z.string().min(1, 'Supplier wajib dipilih'),
  projectItemIds: z.array(z.string()).min(1, 'Minimal 1 item harus dipilih'),
  shippingCost: z.number().min(0, 'Ongkos kirim tidak boleh negatif').optional().default(0),
  otherCosts: z.number().min(0, 'Biaya lain tidak boleh negatif').optional().default(0),
  notes: z.string().optional(),
})

export default defineEventHandler(async event => {
  const body = await readBody(event)

  const result = createPoSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { supplierId, projectItemIds, shippingCost, otherCosts, notes } = result.data

  // Verify supplier exists
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  })
  if (!supplier) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Supplier tidak ditemukan',
    })
  }

  // Get project items
  const projectItems = await prisma.projectItem.findMany({
    where: {
      id: { in: projectItemIds },
      needsPo: true,
      poStatus: 'PENDING',
    },
    include: {
      product: true,
      project: true,
    },
  })

  if (projectItems.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tidak ada item valid yang bisa di-PO',
    })
  }

  // Generate PO number: PO-YYYYMM-XXX
  const yearMonth = dayjs().format('YYYYMM')
  const lastPo = await prisma.purchaseOrder.findFirst({
    where: {
      poNumber: { startsWith: `PO-${yearMonth}` },
    },
    orderBy: { poNumber: 'desc' },
  })

  let sequence = 1
  if (lastPo) {
    const lastSeq = parseInt(lastPo.poNumber.split('-')[2], 10)
    sequence = isNaN(lastSeq) ? 1 : lastSeq + 1
  }
  const poNumber = `PO-${yearMonth}-${String(sequence).padStart(3, '0')}`

  // Group items by productId ONLY (tidak peduli price beda di project berbeda)
  // Untuk 1 PO ke supplier yang sama, produk sama harus jadi 1 baris
  const groupedItems = new Map<string, {
    projectItemIds: string[]
    productId: string
    name: string
    quantity: number
    prices: number[] // Track all prices untuk ambil yang tertinggi
    price: number
    total: number
  }>()

  projectItems.forEach(item => {
    const price = Number(item.cost || 0)
    const key = item.productId // Group by product only
    
    if (groupedItems.has(key)) {
      const existing = groupedItems.get(key)!
      existing.projectItemIds.push(item.id)
      existing.quantity += item.quantity
      existing.prices.push(price)
      // Update price to highest (aman untuk margin)
      existing.price = Math.max(existing.price, price)
      existing.total = existing.quantity * existing.price
    } else {
      groupedItems.set(key, {
        projectItemIds: [item.id],
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        prices: [price],
        price: price,
        total: item.quantity * price,
      })
    }
  })

  // Convert map to array untuk PO items
  const poItemsData = Array.from(groupedItems.values()).map(group => ({
    projectItemId: group.projectItemIds[0], // Reference first item
    productId: group.productId,
    name: group.name,
    quantity: group.quantity, // Quantity sudah dijumlahkan
    price: group.price, // Pakai harga tertinggi untuk safety margin
    total: group.total,
  }))

  const subtotal = poItemsData.reduce((sum, item) => sum + item.total, 0)
  const totalAmount = subtotal + shippingCost + otherCosts

  // Get unique project ID (if all items from same project)
  const projectIds = [...new Set(projectItems.map(i => i.projectId))]
  const projectId = projectIds.length === 1 ? projectIds[0] : null

  // Create PO with items in transaction
  const po = await prisma.$transaction(async tx => {
    // Create PO
    const newPo = await tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        projectId,
        subtotal,
        shippingCost,
        otherCosts,
        totalAmount,
        notes,
        status: 'DRAFT',
        items: {
          create: poItemsData,
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    })

    // Update project items poStatus to ORDERED
    await tx.projectItem.updateMany({
      where: { id: { in: projectItemIds } },
      data: { poStatus: 'ORDERED' },
    })

    return newPo
  })

  return po
})
