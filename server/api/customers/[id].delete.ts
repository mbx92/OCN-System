import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID pelanggan tidak ditemukan',
        })
    }

    // Check if customer has projects
    const projectCount = await prisma.project.count({
        where: { customerId: id },
    })

    if (projectCount > 0) {
        throw createError({
            statusCode: 400,
            statusMessage: `Tidak dapat menghapus pelanggan. Masih ada ${projectCount} proyek terkait.`,
        })
    }

    await prisma.customer.delete({
        where: { id },
    })

    return { success: true }
})
