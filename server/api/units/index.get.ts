export default defineEventHandler(async () => {
  const units = await prisma.unit.findMany({
    include: {
      conversions: {
        include: {
          toUnit: true,
        },
      },
      _count: {
        select: { conversions: true, convertedTo: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return units
})
