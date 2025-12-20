export default defineEventHandler(async () => {
  const technicians = await prisma.technician.findMany({
    orderBy: { name: 'asc' },
  })

  return technicians
})
