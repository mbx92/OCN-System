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

  const projectId = event.context.params?.id

  if (!projectId) {
    throw createError({
      statusCode: 400,
      message: 'ID proyek tidak valid',
    })
  }

  // Check if technician is assigned to this project
  const assignment = await prisma.projectTechnician.findFirst({
    where: {
      projectId,
      technicianId: technician.id,
    },
  })

  if (!assignment) {
    throw createError({
      statusCode: 403,
      message: 'Anda tidak memiliki akses ke proyek ini',
    })
  }

  // Get full project details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      technicians: {
        include: {
          technician: true,
        },
      },
    },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      message: 'Proyek tidak ditemukan',
    })
  }

  return {
    ...project,
    totalAmount: project.totalAmount.toNumber(),
    items: project.items.map(item => ({
      ...item,
      unitPrice: item.unitPrice.toNumber(),
      totalPrice: item.totalPrice.toNumber(),
    })),
    technicians: project.technicians.map(tech => ({
      ...tech,
      fee: tech.fee.toNumber(),
      isCurrentUser: tech.technicianId === technician.id,
    })),
  }
})
