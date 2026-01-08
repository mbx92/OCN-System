import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async event => {
  const id = event.context.params!.id
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  try {
    // Get PO with items
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            projectItem: true,
          },
        },
      },
    })

    if (!po) {
      throw createError({ statusCode: 404, message: 'PO tidak ditemukan' })
    }

    // Only allow cancellation of DRAFT PO
    if (po.status !== 'DRAFT') {
      throw createError({
        statusCode: 400,
        message: 'Hanya PO dengan status DRAFT yang bisa dibatalkan',
      })
    }

    // Use transaction to delete PO and update related project items
    await prisma.$transaction(async tx => {
      // Update ALL project items back to PENDING yang punya productId yang sama dengan PO items
      for (const item of po.items) {
        if (item.productId) {
          // Find all project items yang punya produk yang sama (tidak peduli harga)
          // dan sudah di-mark sebagai ORDERED (dari PO ini)
          const relatedProjectItems = await tx.projectItem.findMany({
            where: {
              productId: item.productId,
              poStatus: 'ORDERED',
              needsPo: true,
            },
          })

          // Update semua related items kembali ke PENDING
          if (relatedProjectItems.length > 0) {
            await tx.projectItem.updateMany({
              where: {
                id: { in: relatedProjectItems.map(i => i.id) },
              },
              data: {
                poStatus: 'PENDING',
              },
            })
          }
        }
      }

      // Delete PO items first (cascade may handle this, but being explicit)
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      })

      // Delete the PO
      await tx.purchaseOrder.delete({
        where: { id },
      })
    })

    return {
      success: true,
      message: 'PO berhasil dibatalkan',
    }
  } catch (error: any) {
    console.error('Error cancelling PO:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Gagal membatalkan PO',
    })
  }
})
