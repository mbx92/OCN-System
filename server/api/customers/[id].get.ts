import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID pelanggan tidak ditemukan',
        })
    }

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            projects: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    _count: { select: { payments: true } },
                },
            },
            _count: { select: { projects: true } },
        },
    })

    if (!customer) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Pelanggan tidak ditemukan',
        })
    }

    return customer
})
