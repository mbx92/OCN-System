import { z } from 'zod'

const clearPendingPoSchema = z.object({
  mode: z.enum(['CHECK', 'SIMPLE', 'FULL']),
})

export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user || user.role !== 'OWNER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Hanya owner yang dapat menjalankan utility ini',
    })
  }

  const body = await readBody(event)
  const result = clearPendingPoSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { mode } = result.data

  try {
    // Find all items with PENDING PO status on completed projects
    const pendingItems = await prisma.projectItem.findMany({
      where: {
        poStatus: 'PENDING',
        project: {
          status: {
            in: ['COMPLETED', 'PAID', 'CLOSED'],
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            status: true,
            createdAt: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            purchasePrice: true,
          },
        },
      },
      orderBy: [{ project: { createdAt: 'asc' } }, { addedAt: 'asc' }],
    })

    if (pendingItems.length === 0) {
      return {
        success: true,
        mode,
        message: 'No pending PO items found on completed projects.',
        itemsFound: 0,
        itemsProcessed: 0,
        items: [],
      }
    }

    const itemsWithMissingCost = pendingItems.filter(
      i => Number(i.cost) === 0 && Number(i.totalCost) === 0
    )

    // Format items for response
    const formattedItems = pendingItems.map(i => ({
      projectNumber: i.project.projectNumber,
      projectStatus: i.project.status,
      itemName: i.name,
      quantity: i.quantity,
      cost: Number(i.cost),
      totalCost: Number(i.totalCost),
      hasProduct: !!i.product,
      costOk: Number(i.totalCost) > 0,
    }))

    // CHECK mode - just return data
    if (mode === 'CHECK') {
      return {
        success: true,
        mode: 'CHECK',
        message: 'Data retrieved successfully (no changes made)',
        itemsFound: pendingItems.length,
        itemsWithMissingCost: itemsWithMissingCost.length,
        itemsWithProduct: pendingItems.filter(i => i.product).length,
        items: formattedItems,
      }
    }

    // SIMPLE mode - just clear status
    if (mode === 'SIMPLE') {
      // Fix missing costs first
      if (itemsWithMissingCost.length > 0) {
        for (const item of itemsWithMissingCost) {
          if (item.product?.purchasePrice) {
            const cost = Number(item.product.purchasePrice)
            const totalCost = cost * item.quantity

            await prisma.projectItem.update({
              where: { id: item.id },
              data: { cost, totalCost },
            })
          }
        }
      }

      // Update all pending items to NONE
      const updateResult = await prisma.projectItem.updateMany({
        where: {
          poStatus: 'PENDING',
          project: { status: { in: ['COMPLETED', 'PAID', 'CLOSED'] } },
        },
        data: { needsPo: false, poStatus: 'NONE' },
      })

      return {
        success: true,
        mode: 'SIMPLE',
        message: `Updated ${updateResult.count} items (cleared status only)`,
        itemsFound: pendingItems.length,
        itemsProcessed: updateResult.count,
        items: formattedItems,
      }
    }

    // FULL mode - create backdated PO
    if (mode === 'FULL') {
      // Check if we have a default supplier
      let defaultSupplier = await prisma.supplier.findFirst({
        where: { name: { contains: 'Default', mode: 'insensitive' } },
      })

      if (!defaultSupplier) {
        // Create default supplier for historical data
        defaultSupplier = await prisma.supplier.create({
          data: {
            name: 'Supplier Historis (Data Manual)',
            phone: '-',
            email: null,
            address: 'Digunakan untuk data historis sebelum sistem PO',
          },
        })
      }

      // Group items by project
      const projectGroups = pendingItems.reduce(
        (acc, item) => {
          const key = item.project.id
          if (!acc[key]) {
            acc[key] = {
              project: item.project,
              items: [],
            }
          }
          acc[key].items.push(item)
          return acc
        },
        {} as Record<
          string,
          { project: (typeof pendingItems)[0]['project']; items: typeof pendingItems }
        >
      )

      let totalPOCreated = 0
      let totalItemsProcessed = 0
      const createdPOs: string[] = []

      for (const [, group] of Object.entries(projectGroups)) {
        const { project, items } = group

        // Use project completion date or created date for backdating
        const poDate = project.createdAt
        const yearMonth = poDate.toISOString().slice(0, 7).replace('-', '')

        // Generate PO number
        const existingPOCount = await prisma.purchaseOrder.count({
          where: {
            poNumber: { startsWith: `PO-${yearMonth}` },
          },
        })
        const poNumber = `PO-${yearMonth}-${String(existingPOCount + 1).padStart(3, '0')}`

        // Fill missing costs
        for (const item of items) {
          if (Number(item.cost) === 0 && item.product?.purchasePrice) {
            const cost = Number(item.product.purchasePrice)
            await prisma.projectItem.update({
              where: { id: item.id },
              data: { cost, totalCost: cost * item.quantity },
            })
            item.cost = cost as any
            item.totalCost = (cost * item.quantity) as any
          }
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + Number(item.totalCost), 0)

        // Create the PO
        await prisma.purchaseOrder.create({
          data: {
            poNumber,
            projectId: project.id,
            supplierId: defaultSupplier.id,
            subtotal,
            shippingCost: 0,
            otherCosts: 0,
            totalAmount: subtotal,
            status: 'RECEIVED',
            receivedDate: poDate,
            notes: `PO historis - dibuat otomatis untuk proyek ${project.projectNumber}`,
            createdAt: poDate,
            items: {
              create: items.map(item => ({
                projectItemId: item.id,
                productId: item.product?.id || null,
                name: item.name,
                quantity: item.quantity,
                price: Number(item.cost) || 0,
                total: Number(item.totalCost) || 0,
                receivedQty: item.quantity,
              })),
            },
          },
        })

        // Update project items
        await prisma.projectItem.updateMany({
          where: { id: { in: items.map(i => i.id) } },
          data: { needsPo: false, poStatus: 'RECEIVED' },
        })

        createdPOs.push(`${project.projectNumber}: ${poNumber}`)
        totalPOCreated++
        totalItemsProcessed += items.length
      }

      return {
        success: true,
        mode: 'FULL',
        message: `Created ${totalPOCreated} backdated PO with ${totalItemsProcessed} items`,
        itemsFound: pendingItems.length,
        itemsProcessed: totalItemsProcessed,
        poCreated: totalPOCreated,
        createdPOs,
        items: formattedItems,
      }
    }

    return {
      success: false,
      message: 'Invalid mode',
    }
  } catch (error: any) {
    console.error('Error clearing pending PO:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to process pending PO',
    })
  }
})
