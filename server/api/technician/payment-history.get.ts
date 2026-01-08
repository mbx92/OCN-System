export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user || user.role !== 'TECHNICIAN') {
    throw createError({
      statusCode: 403,
      message: 'Akses hanya untuk teknisi',
    })
  }

  // Get technician profile
  const technician = await prisma.technician.findUnique({
    where: { userId: user.id },
  })

  if (!technician) {
    throw createError({
      statusCode: 404,
      message: 'Data teknisi tidak ditemukan',
    })
  }

  // Get payment history
  const payments = await prisma.technicianPayment.findMany({
    where: {
      technicianId: technician.id,
    },
    include: {
      projectTechnician: {
        include: {
          project: {
            select: {
              name: true,
              projectCode: true,
            },
          },
        },
      },
    },
    orderBy: {
      paymentDate: 'desc',
    },
  })

  return payments.map(payment => ({
    id: payment.id,
    amount: payment.amount.toNumber(),
    paymentDate: payment.paymentDate,
    notes: payment.notes,
    projectName: payment.projectTechnician.project.name,
    projectCode: payment.projectTechnician.project.projectCode,
  }))
})
