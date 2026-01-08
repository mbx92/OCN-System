export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID paket tidak valid',
    })
  }

  const packageData = await prisma.package.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!packageData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Paket tidak ditemukan',
    })
  }

  return packageData
})
