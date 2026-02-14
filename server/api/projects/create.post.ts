import dayjs from 'dayjs'

// API endpoint to create project without quotation
export default defineEventHandler(async event => {
  const body = await readBody(event)

  // Validate required fields
  if (!body.customerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer ID wajib diisi',
    })
  }

  if (!body.title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Judul project wajib diisi',
    })
  }

  // Get customer
  const customer = await prisma.customer.findUnique({
    where: { id: body.customerId },
  })

  if (!customer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pelanggan tidak ditemukan',
    })
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

  // Process items if provided
  const items = body.items || []
  let totalBudget = body.budget || 0

  // If items provided, calculate budget from items
  if (items.length > 0) {
    totalBudget = items.reduce((sum: number, item: any) => {
      return sum + (item.total || item.quantity * item.price)
    }, 0)
  }

  // Fetch product costs and stock for items that have productId
  const productIds = items.map((item: any) => item.productId).filter(Boolean)
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

  const projectItemsData = items.map((item: any) => {
    let cost = item.cost || 0
    let needsPo = false
    let currentStock = 0
    let reservedStock = 0

    if (item.productId) {
      const product = productMap.get(item.productId)
      if (product) {
        // Use product purchase price if cost not provided
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
    } else {
      // For custom items without productId, check if needsPo is explicitly set
      needsPo = item.needsPo || false
    }

    // Build the item data
    const itemData: any = {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      price: item.price,
      totalPrice: item.total || item.quantity * item.price,
      cost: cost,
      totalCost: item.quantity * cost,
      type: item.type || 'QUOTATION', // Default to QUOTATION type
      needsPo,
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
        customerId: body.customerId,
        title: body.title,
        description: body.description || null,
        budget: totalBudget,
        status: body.status || 'APPROVED',
        createdAt: projectDate.toDate(),
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        items:
          items.length > 0
            ? {
                create: projectItemsData,
              }
            : undefined,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // 2. Update Stocks (Increment Reserved and Recalculate Available)
    for (const stockUpdate of stockUpdates) {
      const currentProduct = await tx.product.findUnique({
        where: { id: stockUpdate.productId },
        include: { stock: true },
      })

      if (currentProduct?.stock) {
        const newReserved = currentProduct.stock.reserved + stockUpdate.increment
        const newAvailable = currentProduct.stock.quantity - newReserved

        await tx.stock.update({
          where: { id: currentProduct.stock.id },
          data: {
            reserved: newReserved,
            available: newAvailable,
          },
        })
      }
    }

    return newProject
  })

  return project
})
