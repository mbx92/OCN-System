// POST /api/utilities/fix-sisa-upah
// Fix double counting of technician remaining wage

export default defineEventHandler(async event => {
  try {
    const body = await readBody(event)
    const mode = body.mode || 'CHECK' // CHECK or EXECUTE

    const year = parseInt(body.year || new Date().getFullYear())
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    // Get all OTHER income that are sisa upah teknisi
    const sisaUpahTransactions = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'INCOME',
        category: 'OTHER',
        description: {
          contains: 'Sisa upah teknisi',
        },
      },
      orderBy: { date: 'asc' },
    })

    const totalAmount = sisaUpahTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)

    if (mode === 'CHECK') {
      return {
        success: true,
        mode: 'CHECK',
        message: `Ditemukan ${sisaUpahTransactions.length} transaksi sisa upah teknisi`,
        totalTransactions: sisaUpahTransactions.length,
        totalAmount,
        transactions: sisaUpahTransactions.map(tx => ({
          id: tx.id,
          date: tx.date,
          description: tx.description,
          amount: Number(tx.amount),
          reference: tx.referenceId,
        })),
      }
    }

    // EXECUTE mode
    if (sisaUpahTransactions.length === 0) {
      return {
        success: true,
        mode: 'EXECUTE',
        message: 'Tidak ada transaksi sisa upah teknisi yang perlu dihapus',
        deleted: 0,
      }
    }

    // Delete transactions
    const deleteResult = await prisma.cashTransaction.deleteMany({
      where: {
        id: {
          in: sisaUpahTransactions.map(tx => tx.id),
        },
      },
    })

    return {
      success: true,
      mode: 'EXECUTE',
      message: `Berhasil menghapus ${deleteResult.count} transaksi sisa upah teknisi`,
      deleted: deleteResult.count,
      totalAmount,
      deletedTransactions: sisaUpahTransactions.map(
        tx =>
          `${tx.date.toLocaleDateString('id-ID')} - ${tx.description} - Rp ${Number(tx.amount).toLocaleString('id-ID')}`
      ),
    }
  } catch (error: any) {
    console.error('Error fixing sisa upah:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fix sisa upah teknisi',
    })
  }
})
