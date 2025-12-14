import prisma from '~/server/utils/prisma'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

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

    // Generate project number
    const startOfMonth = dayjs().startOf('month').toDate()
    const endOfMonth = dayjs().endOf('month').toDate()
    const count = await prisma.project.count({
        where: {
            createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
    })
    const projectNumber = `PRJ-${dayjs().format('YYYYMM')}-${String(count + 1).padStart(3, '0')}`

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

    const project = await prisma.project.create({
        data: {
            projectNumber,
            customerId: quotation.customerId,
            title: quotation.title || `Project untuk ${customer.name}`,
            budget: quotation.totalAmount,
            status: 'APPROVED',
            items: {
                create: items.map(item => ({
                    productId: item.productId || null,
                    name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    price: item.price,
                    totalPrice: item.total || item.quantity * item.price,
                    type: 'QUOTATION',
                })),
            },
        },
        include: {
            customer: true,
            items: true,
        },
    })

    // Update quotation
    await prisma.quotation.update({
        where: { id },
        data: {
            status: 'APPROVED',
            projectId: project.id,
        },
    })

    return project
})
