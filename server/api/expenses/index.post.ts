import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const body = await readBody(event)

  const { type, category, description, amount, date, projectId, receipt } = body

  // Validate required fields
  if (!type || !category || !description || !amount || !date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  // Validate expense type
  const validTypes = ['PROJECT', 'OPERATIONAL', 'SALARY', 'ASSET']
  if (!validTypes.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid expense type',
    })
  }

  // If type is PROJECT, validate projectId
  if (type === 'PROJECT' && !projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required for PROJECT expenses',
    })
  }

  try {
    // Create expense
    const expense = await prisma.expense.create({
      data: {
        type,
        category,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        projectId: projectId || null,
        receipt: receipt || null,
        createdBy: user.id,
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
        action: 'CREATE_EXPENSE',
        entity: 'Expense',
        entityId: expense.id,
        metadata: {
          type,
          category,
          amount,
        },
        ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
      },
    })

    return expense
  } catch (error: any) {
    console.error('Error creating expense:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create expense',
    })
  }
})
