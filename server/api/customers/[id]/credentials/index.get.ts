// GET /api/customers/[id]/credentials - List customer credentials
export default defineEventHandler(async event => {
  const customerId = getRouterParam(event, 'id')

  if (!customerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer ID required',
    })
  }

  const credentials = await prisma.customerCredential.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  })

  return credentials
})
