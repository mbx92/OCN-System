// Auto-update overdue invoices
export default defineEventHandler(async () => {
  const now = new Date()

  // Find all invoices that are past due date and not yet paid
  const overdueInvoices = await prisma.payment.updateMany({
    where: {
      status: {
        in: ['UNPAID', 'PARTIAL'],
      },
      dueDate: {
        lt: now,
      },
    },
    data: {
      status: 'OVERDUE',
    },
  })

  return {
    success: true,
    updated: overdueInvoices.count,
    message: `${overdueInvoices.count} invoice(s) marked as overdue`,
  }
})
