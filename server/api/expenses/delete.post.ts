export default defineEventHandler(async event => {
  const body = await readBody(event)
  const { expenseId } = body

  if (!expenseId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID expense tidak ditemukan',
    })
  }

  // Check if expense exists
  const expense = await prisma.projectExpense.findUnique({
    where: { id: expenseId },
  })

  if (!expense) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Expense tidak ditemukan',
    })
  }

  // Delete the expense
  await prisma.projectExpense.delete({
    where: { id: expenseId },
  })

  return { success: true, message: 'Expense berhasil dihapus' }
})
