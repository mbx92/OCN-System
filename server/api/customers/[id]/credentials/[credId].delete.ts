// DELETE /api/customers/[id]/credentials/[credId] - Delete credential
export default defineEventHandler(async event => {
  const customerId = getRouterParam(event, 'id')
  const credId = getRouterParam(event, 'credId')

  if (!customerId || !credId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer ID and Credential ID required',
    })
  }

  await prisma.customerCredential.delete({
    where: { id: credId },
  })

  return { success: true }
})
