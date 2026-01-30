import { generateBudgetPdfBuffer } from '../../../utils/pdf-generator'

export default defineEventHandler(async event => {
  console.log('[Budget PDF] ====== PDF ENDPOINT HIT ======')
  console.log('[Budget PDF] Request URL:', event.node.req.url)
  console.log('[Budget PDF] Request method:', event.node.req.method)

  const user = event.context.user
  console.log('[Budget PDF] User:', user ? user.id : 'NO USER')

  if (!user) {
    console.log('[Budget PDF] ERROR: Unauthorized - no user in context')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const id = getRouterParam(event, 'id')
  console.log('[Budget PDF] Budget ID from param:', id)

  if (!id) {
    console.log('[Budget PDF] ERROR: No budget ID provided')
    throw createError({
      statusCode: 400,
      message: 'Budget ID required',
    })
  }

  console.log('[Budget PDF] Fetching budget from database...')
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
    },
  })

  console.log('[Budget PDF] Budget found:', budget ? budget.budgetNumber : 'NOT FOUND')

  if (!budget) {
    console.log('[Budget PDF] ERROR: Budget not found in database')
    throw createError({
      statusCode: 404,
      message: 'Budget not found',
    })
  }

  const company = await prisma.company.findFirst()
  console.log('[Budget PDF] Company:', company ? company.name : 'NOT FOUND')

  try {
    console.log('[Budget PDF] Generating PDF buffer...')
    // Generate PDF buffer
    const pdfBuffer = await generateBudgetPdfBuffer(budget, company)
    console.log('[Budget PDF] PDF buffer generated, size:', pdfBuffer?.length || 0)

    // Return PDF as response
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(
      event,
      'Content-Disposition',
      `attachment; filename="Budget-${budget.budgetNumber}.pdf"`
    )

    console.log('[Budget PDF] SUCCESS - returning PDF')
    return pdfBuffer
  } catch (error: any) {
    console.error('[Budget PDF] ERROR generating PDF:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate budget PDF',
    })
  }
})
