// GET /api/utilities/verify-po-dates
// Verify if PO cashflow dates match with received dates

export default defineEventHandler(async event => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        status: 'RECEIVED',
      },
      orderBy: { receivedDate: 'asc' },
    })

    let correctDates = 0
    let wrongDates = 0
    const issues: any[] = []
    const samples: any[] = []

    for (const po of pos) {
      const cashTx = await prisma.cashTransaction.findFirst({
        where: {
          referenceId: po.id,
          referenceType: 'PurchaseOrder',
        },
      })

      if (!cashTx) continue

      const receivedDate = po.receivedDate
      const cashDate = cashTx.date

      const isSameDay =
        receivedDate &&
        receivedDate.getDate() === cashDate.getDate() &&
        receivedDate.getMonth() === cashDate.getMonth() &&
        receivedDate.getFullYear() === cashDate.getFullYear()

      if (isSameDay) {
        correctDates++
        if (samples.length < 5) {
          samples.push({
            poNumber: po.poNumber,
            receivedDate,
            cashDate,
            amount: Number(po.totalAmount),
          })
        }
      } else {
        wrongDates++
        issues.push({
          poNumber: po.poNumber,
          receivedDate,
          cashDate,
          amount: Number(po.totalAmount),
        })
      }
    }

    return {
      success: true,
      totalPO: pos.length,
      correctDates,
      wrongDates,
      issues,
      samples,
      message:
        wrongDates === 0
          ? 'Semua tanggal cashflow PO sudah benar'
          : `Ditemukan ${wrongDates} PO dengan tanggal cashflow yang salah`,
    }
  } catch (error: any) {
    console.error('Error verifying PO dates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify PO dates',
    })
  }
})
