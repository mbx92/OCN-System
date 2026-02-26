import dayjs from 'dayjs'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID penawaran tidak ditemukan',
    })
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id },
  })

  if (!quotation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Penawaran tidak ditemukan',
    })
  }

  if (quotation.status !== 'DRAFT' && quotation.status !== 'SENT') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Penawaran sudah tidak bisa disetujui',
    })
  }

  // Check if quotation already has a project
  if (quotation.projectId) {
    // Quotation already approved, return existing project
    const existingProject = await prisma.project.findUnique({
      where: { id: quotation.projectId },
      include: {
        customer: true,
        items: true,
      },
    })

    if (existingProject) {
      return existingProject
    }
  }

  // Use custom date if provided (backdate), otherwise use now
  const projectDate = body?.projectDate ? dayjs(body.projectDate) : dayjs()

  // Generate unique project number based on selected date (backdate support)
  let projectNumber = ''
  let isUnique = false
  let attempt = 0

  while (!isUnique && attempt < 10) {
    const startOfMonth = projectDate.startOf('month').toDate()
    const endOfMonth = projectDate.endOf('month').toDate()
    const count = await prisma.project.count({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELLED' },
      },
    })
    projectNumber = `PRJ-${projectDate.format('YYYYMM')}-${String(count + 1 + attempt).padStart(3, '0')}`

    // Check if this number already exists
    const existing = await prisma.project.findUnique({
      where: { projectNumber },
    })

    if (!existing) {
      isUnique = true
    } else {
      attempt++
    }
  }

  if (!isUnique) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal generate nomor project unik',
    })
  }

  // Get customer
  const customer = await prisma.customer.findUnique({
    where: { id: quotation.customerId },
  })

  if (!customer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pelanggan tidak ditemukan',
    })
  }

  // Create project from quotation
  const items = quotation.items as any[]

  // Fetch product costs and stock
  const productIds = items.map(item => item.productId).filter(Boolean)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      purchasePrice: true,
      isService: true,
      stock: true,
    },
  })

  // Map for easy access
  const productMap = new Map(products.map(p => [p.id, p]))

  // Prepare Stock Updates
  const stockUpdates: { productId: string; increment: number }[] = []

  const projectItemsData = items.map(item => {
    // Use cost from quotation item first (e.g., from budget conversion)
    let cost = item.cost ? Number(item.cost) : 0
    let needsPo = false
    let currentStock = 0
    let reservedStock = 0

    if (item.productId) {
      const product = productMap.get(item.productId)
      if (product) {
        // Only use product purchase price if cost not already set
        if (!item.cost) {
          cost = Number(product.purchasePrice)
        }

        // Only check stock for physical products, not services
        if (!product.isService) {
          currentStock = product.stock?.quantity || 0
          reservedStock = product.stock?.reserved || 0

          const available = currentStock - reservedStock
          if (available < item.quantity) {
            needsPo = true
          }

          // Prepare stock update (increment reserved)
          stockUpdates.push({
            productId: item.productId,
            increment: item.quantity,
          })
        }
      }
    }

    // Build the item data - use connect for product relation if productId exists
    const itemData: any = {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      price: item.price,
      totalPrice: item.total || item.quantity * item.price,
      cost: cost,
      totalCost: item.quantity * cost,
      type: 'QUOTATION',
      needsPo, // Flag for PO
      poStatus: needsPo ? 'PENDING' : 'NONE',
    }

    // Only connect product if productId exists
    if (item.productId) {
      itemData.product = { connect: { id: item.productId } }
    }

    return itemData
  })

  // Transaction to ensure atomicity
  const project = await prisma.$transaction(async tx => {
    // 1. Create Project
    const newProject = await tx.project.create({
      data: {
        projectNumber,
        customerId: quotation.customerId,
        title: quotation.title || `Project untuk ${customer.name}`,
        budget: quotation.totalAmount,
        status: 'APPROVED',
        createdAt: projectDate.toDate(), // Use custom date (backdate support)
        items: {
          create: projectItemsData,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    })

    // 2. Update Quotation Status & Link
    await tx.quotation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        projectId: newProject.id,
      },
    })

    // 3. Update Stocks (Increment Reserved and Recalculate Available)
    for (const update of stockUpdates) {
      // Get current stock values
      const existingStock = await tx.stock.findUnique({
        where: { productId: update.productId },
      })

      if (existingStock) {
        const newReserved = existingStock.reserved + update.increment
        const newAvailable = existingStock.quantity - newReserved

        await tx.stock.update({
          where: { productId: update.productId },
          data: {
            reserved: newReserved,
            available: newAvailable,
          },
        })

        // Record stock movement for reserve
        await tx.stockMovement.create({
          data: {
            productId: update.productId,
            stockId: existingStock.id,
            type: 'RESERVE',
            quantity: -update.increment,
            reference: projectNumber,
            notes: `Reserved for project`,
          },
        })
      } else {
        // Create new stock entry
        const newStock = await tx.stock.create({
          data: {
            productId: update.productId,
            quantity: 0,
            reserved: update.increment,
            available: -update.increment, // No stock yet, so available is negative
          },
        })

        // Record stock movement for reserve
        await tx.stockMovement.create({
          data: {
            productId: update.productId,
            stockId: newStock.id,
            type: 'RESERVE',
            quantity: -update.increment,
            reference: projectNumber,
            notes: `Reserved for project`,
          },
        })
      }
    }

    return newProject
  })

  return project
})
