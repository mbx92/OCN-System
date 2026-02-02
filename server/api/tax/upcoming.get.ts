// GET /api/tax/upcoming - Get upcoming tax payments (for reminders)
export default defineEventHandler(async () => {
  const today = new Date()
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(today.getDate() + 7)

  // Get unpaid taxes with due date in the next 7 days
  const upcomingTaxes = await prisma.taxPayment.findMany({
    where: {
      status: { in: ['UNPAID', 'OVERDUE'] },
    },
    orderBy: { dueDate: 'asc' },
  })

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  const result = upcomingTaxes.map(tax => {
    const dueDate = new Date(tax.dueDate)
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      id: tax.id,
      period: `${monthNames[tax.month - 1]} ${tax.year}`,
      year: tax.year,
      month: tax.month,
      dueDate: tax.dueDate,
      taxAmount: Number(tax.taxAmount),
      daysUntilDue,
      status: tax.status,
      isUrgent: daysUntilDue <= 7 && daysUntilDue >= 0,
      isOverdue: daysUntilDue < 0,
    }
  })

  // Separate urgent and overdue
  const urgent = result.filter(t => t.isUrgent)
  const overdue = result.filter(t => t.isOverdue)
  const upcoming = result.filter(t => !t.isUrgent && !t.isOverdue)

  return {
    urgent,
    overdue,
    upcoming,
    totalUnpaid: result.reduce((sum, t) => sum + t.taxAmount, 0),
  }
})
