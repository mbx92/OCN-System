import { z } from 'zod'

const requestSchema = z.object({
  mode: z.enum(['CHECK', 'EXECUTE']),
})

interface TransactionData {
  id: string
  description: string
  amount: number
  currentDate: string
  projectDate: string | null
  projectNumber: string
  projectStatus: string
  needsUpdate: boolean
}

export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  // Only admin can run this utility
  if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
    throw createError({
      statusCode: 403,
      message: 'Hanya Admin/Owner yang dapat menjalankan utilitas ini',
    })
  }

  const body = await readBody(event)
  const validation = requestSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request data',
    })
  }

  const { mode } = validation.data

  try {
    // Cari transaksi cashflow yang merupakan sisa upah teknisi
    const transactions = await prisma.cashTransaction.findMany({
      where: {
        type: 'INCOME',
        category: 'OTHER',
        description: {
          contains: 'Sisa upah teknisi',
        },
        referenceType: 'Project',
      },
      orderBy: {
        date: 'desc',
      },
    })

    const transactionsData: TransactionData[] = []
    let needsUpdateCount = 0

    // Process each transaction
    for (const tx of transactions) {
      let project = null
      if (tx.referenceId) {
        project = await prisma.project.findUnique({
          where: { id: tx.referenceId },
          select: {
            id: true,
            projectNumber: true,
            endDate: true,
            status: true,
          },
        })
      }

      const projectDate = project?.endDate
      const needsUpdate = projectDate ? tx.date.getTime() !== projectDate.getTime() : false

      if (needsUpdate) {
        needsUpdateCount++
      }

      transactionsData.push({
        id: tx.id,
        description: tx.description,
        amount: Number(tx.amount),
        currentDate: tx.date.toISOString(),
        projectDate: projectDate?.toISOString() || null,
        projectNumber: project?.projectNumber || tx.reference || 'N/A',
        projectStatus: project?.status || 'N/A',
        needsUpdate,
      })
    }

    // Mode CHECK: hanya return data
    if (mode === 'CHECK') {
      return {
        success: true,
        mode: 'CHECK',
        message: `Ditemukan ${transactions.length} transaksi sisa upah teknisi`,
        totalTransactions: transactions.length,
        needsUpdateCount,
        alreadyCorrectCount: transactions.length - needsUpdateCount,
        transactions: transactionsData,
      }
    }

    // Mode EXECUTE: update data
    let updated = 0
    let skipped = 0
    const updatedTransactions: string[] = []

    for (const txData of transactionsData) {
      if (txData.needsUpdate && txData.projectDate) {
        await prisma.cashTransaction.update({
          where: { id: txData.id },
          data: {
            date: new Date(txData.projectDate),
          },
        })
        updated++
        updatedTransactions.push(`${txData.projectNumber} (${txData.description})`)
      } else {
        skipped++
      }
    }

    return {
      success: true,
      mode: 'EXECUTE',
      message: `Berhasil mengupdate ${updated} transaksi`,
      totalTransactions: transactions.length,
      updated,
      skipped,
      updatedTransactions,
    }
  } catch (error: any) {
    console.error('Error in fix-remaining-wage-date:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Gagal memproses data',
    })
  }
})
