export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Unit ID is required',
    })
  }

  await prisma.unit.delete({
    where: { id },
  })

  return { success: true }
})
