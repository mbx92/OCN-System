export default defineEventHandler(async () => {
  const conversions = await prisma.unitConversion.findMany({
    include: {
      fromUnit: true,
      toUnit: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return conversions
})
