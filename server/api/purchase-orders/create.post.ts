import { z } from 'zod'
import dayjs from 'dayjs'

const createPoSchema = z.object({
  supplierId: z.string().min(1, 'Supplier wajib dipilih'),
  projectItemIds: z.array(z.string()).min(1, 'Minimal 1 item harus dipilih'),
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

  const { supplierId, projectItemIds, notes } = result.data

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

  // Calculate items and total
  const poItemsData = projectItems.map(item => ({
    projectItemId: item.id,
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.cost || 0, // Use cost as purchase price
    total: item.quantity * Number(item.cost || 0),
  }))

  const totalAmount = poItemsData.reduce((sum, item) => sum + item.total, 0)

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
