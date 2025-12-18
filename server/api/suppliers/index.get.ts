export default defineEventHandler(async event => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
  })

  return suppliers
})
