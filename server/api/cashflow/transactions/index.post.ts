export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const body = await readBody(event)
  const { type, category, amount, description, reference, referenceType, referenceId, date } = body

  if (!type || !category || !amount || !description) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  const validTypes = ['INCOME', 'EXPENSE']
  if (!validTypes.includes(type)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid transaction type',
    })
  }

  try {
    const transaction = await prisma.cashTransaction.create({
      data: {
        type,
        category,
        amount: parseFloat(amount),
        description,
        reference: reference || null,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        date: date ? new Date(date) : new Date(),
        createdBy: user.id,
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'CASH_TRANSACTION',
        entityId: transaction.id,
        metadata: {
          type,
          category,
          amount,
          description,
          reference,
        },
      },
    })

    return {
      success: true,
      data: transaction,
      message: 'Cash transaction created successfully',
    }
  } catch (error: any) {
    console.error('Error creating cash transaction:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create cash transaction',
    })
  }
})
