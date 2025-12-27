import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Expense ID is required',
    })
  }

  try {
    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Expense not found',
      })
    }

    // Delete expense
    await prisma.expense.delete({
      where: { id },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'DELETE_EXPENSE',
        entity: 'Expense',
        entityId: id,
        metadata: {
          type: existingExpense.type,
          amount: existingExpense.amount,
        },
        ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
      },
    })

    return {
      success: true,
      message: 'Expense deleted successfully',
    }
  } catch (error: any) {
    console.error('Error deleting expense:', error)
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete expense',
    })
  }
})
