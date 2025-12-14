import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const search = query.search as string || ''

    const where = search
        ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { companyName: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' as const } },
            ],
        }
        : {}

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            include: {
                _count: { select: { projects: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.customer.count({ where }),
    ])

    return {
        data: customers,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
})
