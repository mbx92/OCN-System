export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Conversion ID is required',
    })
  }

  await prisma.unitConversion.delete({
    where: { id },
  })

  return { success: true }
})
