export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID asset diperlukan',
    })
  }

  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!asset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset tidak ditemukan',
      })
    }

    return asset
  } catch (error: any) {
    console.error('Error fetching asset:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil data asset',
    })
  }
})
