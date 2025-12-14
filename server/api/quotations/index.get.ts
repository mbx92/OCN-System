import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const status = query.status as string
    const search = query.search as string

    const where: any = {}

    if (status) {
        where.status = status
    }

    if (search) {
        where.OR = [
            { quotationNo: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } },
        ]
    }

    const quotations = await prisma.quotation.findMany({
        where,
        include: {
            project: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    // Get customer data for each quotation
    const customerIds = [...new Set(quotations.map(q => q.customerId))]
    const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
    })
    const customerMap = new Map(customers.map(c => [c.id, c]))

    return quotations.map(q => ({
        ...q,
        customer: customerMap.get(q.customerId),
    }))
})
