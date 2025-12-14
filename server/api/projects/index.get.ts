import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const status = query.status as string
    const search = query.search as string

    const where: any = {}

    if (status && status !== 'all') {
        where.status = status
    }

    if (search) {
        where.OR = [
            { projectNumber: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
        ]
    }

    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            include: {
                customer: true,
                _count: {
                    select: { payments: true, expenses: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.project.count({ where }),
    ])

    return {
        data: projects,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
})
