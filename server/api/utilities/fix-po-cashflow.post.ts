// POST /api/utilities/fix-po-cashflow
// Fix cashflow for received PO that don't have cashflow record

export default defineEventHandler(async event => {
  try {
    const body = await readBody(event)
    const mode = body.mode || 'CHECK' // CHECK or EXECUTE

    // Get all RECEIVED POs
    const receivedPOs = await prisma.purchaseOrder.findMany({
      where: {
        status: 'RECEIVED',
      },
      include: {
        supplier: { select: { name: true } },
        project: { select: { projectNumber: true } },
      },
      orderBy: { receivedDate: 'asc' },
    })

    // Check which ones don't have cashflow
    const missingCashflow: typeof receivedPOs = []

    for (const po of receivedPOs) {
      const existingCashTx = await prisma.cashTransaction.findFirst({
        where: {
          referenceId: po.id,
          referenceType: 'PurchaseOrder',
        },
      })

      if (!existingCashTx) {
        missingCashflow.push(po)
      }
    }

    const totalAmount = missingCashflow.reduce((sum, po) => sum + Number(po.totalAmount), 0)

    if (mode === 'CHECK') {
      return {
        success: true,
        mode: 'CHECK',
        message: `Ditemukan ${missingCashflow.length} PO yang belum tercatat di cashflow`,
        totalPO: receivedPOs.length,
        missingCount: missingCashflow.length,
        totalAmount,
        missingPOs: missingCashflow.map(po => ({
          poNumber: po.poNumber,
          supplier: po.supplier.name,
          project: po.project?.projectNumber || 'Direct PO',
          amount: Number(po.totalAmount),
          receivedDate: po.receivedDate,
        })),
      }
    }

    // EXECUTE mode
    if (missingCashflow.length === 0) {
      return {
        success: true,
        mode: 'EXECUTE',
        message: 'Semua PO sudah tercatat di cashflow',
        created: 0,
      }
    }

    // Create cashflow transactions
    let created = 0
    const createdTransactions: string[] = []

    for (const po of missingCashflow) {
      const transactionDate = po.receivedDate || po.createdAt

      await prisma.cashTransaction.create({
        data: {
          type: 'EXPENSE',
          category: 'PO',
          amount: po.totalAmount,
          description: `Pembelian ${po.poNumber}`,
          reference: po.poNumber,
          referenceType: 'PurchaseOrder',
          referenceId: po.id,
          date: transactionDate,
        },
      })

      created++
      createdTransactions.push(
        `${po.poNumber} - ${transactionDate.toLocaleDateString('id-ID')} - Rp ${Number(po.totalAmount).toLocaleString('id-ID')}`
      )
    }

    return {
      success: true,
      mode: 'EXECUTE',
      message: `Berhasil membuat ${created} cashflow transactions`,
      created,
      totalAmount,
      createdTransactions,
    }
  } catch (error: any) {
    console.error('Error fixing PO cashflow:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fix PO cashflow',
    })
  }
})
