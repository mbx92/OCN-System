import { generateReceiptPdfBuffer } from '../../../utils/pdf-generator'

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
      message: 'Project ID required',
    })
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      payments: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      message: 'Project not found',
    })
  }

  const company = await prisma.company.findFirst()

  const latestPayment = project.payments[project.payments.length - 1]
  if (!latestPayment) {
    throw createError({
      statusCode: 404,
      message: 'No payment found for this project',
    })
  }

  // Prepare payment data with project included
  const paymentWithProject = {
    ...latestPayment,
    project: project,
  }

  try {
    // Generate PDF buffer
    const pdfBuffer = await generateReceiptPdfBuffer(paymentWithProject, company)

    // Return PDF as response
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(
      event,
      'Content-Disposition',
      `attachment; filename="Kwitansi-${project.projectNumber}.pdf"`
    )

    return pdfBuffer
  } catch (error: any) {
    console.error('Error generating receipt PDF:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate receipt PDF',
    })
  }
})
