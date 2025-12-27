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

  const body = await readBody(event)

  const { type, category, description, amount, date, projectId, receipt } = body

  // Validate expense type if provided
  if (type) {
    const validTypes = ['PROJECT', 'OPERATIONAL', 'SALARY', 'ASSET']
    if (!validTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid expense type',
      })
    }
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

    // Update expense
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(category && { category }),
        ...(description && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(projectId !== undefined && { projectId: projectId || null }),
        ...(receipt !== undefined && { receipt: receipt || null }),
      },
      include: {
        project: {
          select: {
            projectNumber: true,
            title: true,
          },
        },
        createdByUser: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'UPDATE_EXPENSE',
        entity: 'Expense',
        entityId: expense.id,
        metadata: {
          type: expense.type,
          amount: expense.amount,
        },
        ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
      },
    })

    return expense
  } catch (error: any) {
    console.error('Error updating expense:', error)
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update expense',
    })
  }
})
