// API untuk mendapatkan rekap pembayaran teknisi per periode
import dayjs from 'dayjs'

export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const { technicianId, period, startDate, endDate } = query

  if (!technicianId) {
    throw createError({
      statusCode: 400,
      message: 'Technician ID is required',
    })
  }

  try {
    // Determine date range
    let start: Date
    let end: Date

    if (period) {
      // Format: YYYY-MM
      const [year, month] = (period as string).split('-')
      start = dayjs(`${year}-${month}-01`).startOf('month').toDate()
      end = dayjs(`${year}-${month}-01`).endOf('month').toDate()
    } else if (startDate && endDate) {
      start = new Date(startDate as string)
      end = new Date(endDate as string)
    } else {
      // Default to current month
      start = dayjs().startOf('month').toDate()
      end = dayjs().endOf('month').toDate()
    }

    // Get technician info
    const technician = await prisma.technician.findUnique({
      where: { id: technicianId as string },
      select: {
        id: true,
        name: true,
        phone: true,
        type: true,
      },
    })

    if (!technician) {
      throw createError({
        statusCode: 404,
        message: 'Technician not found',
      })
    }

    // Get payments dalam periode
    const payments = await prisma.technicianPayment.findMany({
      where: {
        technicianId: technicianId as string,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        project: {
          select: {
            projectNumber: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get cash advances (kas bon) dalam periode
    const cashAdvances = await prisma.technicianCashAdvance.findMany({
      where: {
        technicianId: technicianId as string,
        date: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['UNPAID', 'PARTIALLY_PAID'],
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Get bonuses dalam periode
    const bonuses = await prisma.technicianBonus.findMany({
      where: {
        technicianId: technicianId as string,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Calculate totals
    const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    const totalCashAdvances = cashAdvances.reduce(
      (sum, advance) => sum + Number(advance.remainingAmount),
      0
    )
    const totalBonuses = bonuses.reduce((sum, bonus) => sum + Number(bonus.amount), 0)

    const netPayment = totalPayments + totalBonuses - totalCashAdvances

    return {
      technician,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        display:
          period || `${dayjs(start).format('DD MMM YYYY')} - ${dayjs(end).format('DD MMM YYYY')}`,
      },
      payments,
      cashAdvances,
      bonuses,
      summary: {
        totalPayments,
        totalCashAdvances,
        totalBonuses,
        netPayment,
      },
    }
  } catch (error: any) {
    console.error('Error fetching payment recap:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch payment recap',
    })
  }
})
