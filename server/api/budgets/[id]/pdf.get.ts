import { generateBudgetPdfBuffer } from '../../../utils/pdf-generator'

export default defineEventHandler(async event => {
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
      message: 'Budget ID required',
    })
  }

  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      approvedByUser: true,
    },
  })

  if (!budget) {
    throw createError({
      statusCode: 404,
      message: 'Budget not found',
    })
  }

  const company = await prisma.company.findFirst()

  try {
    // Generate PDF buffer
    const pdfBuffer = await generateBudgetPdfBuffer(budget, company)

    // Return PDF as response
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(
      event,
      'Content-Disposition',
      `attachment; filename="Budget-${budget.budgetNumber}.pdf"`
    )

    return pdfBuffer
  } catch (error: any) {
    console.error('Error generating budget PDF:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate budget PDF',
    })
  }
})
