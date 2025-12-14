import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const category = query.category as string
    const search = query.search as string

    const where: any = {}

    if (category) {
        where.category = category
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
        ]
    }

    const products = await prisma.product.findMany({
        where,
        include: {
            stock: true,
        },
        orderBy: { name: 'asc' },
    })

    return products
})
