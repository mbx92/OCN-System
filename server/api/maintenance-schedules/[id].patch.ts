export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID jadwal tidak valid',
    })
  }

  const existing = await prisma.maintenanceSchedule.findUnique({
    where: { id },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Jadwal tidak ditemukan',
    })
  }

  const { projectId, customerId, title, description, scheduledDate, status, completedDate, notes } =
    body

  const updateData: any = {}

  if (projectId !== undefined) updateData.projectId = projectId || null
  if (customerId !== undefined) updateData.customerId = customerId || null
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate)
  if (status !== undefined) updateData.status = status
  if (notes !== undefined) updateData.notes = notes

  // Auto-set completedDate when status is COMPLETED
  if (status === 'COMPLETED' && !existing.completedDate) {
    updateData.completedDate = new Date()
  } else if (completedDate !== undefined) {
    updateData.completedDate = completedDate ? new Date(completedDate) : null
  }

  const schedule = await prisma.maintenanceSchedule.update({
    where: { id },
    data: updateData,
    include: {
      project: {
        include: {
          customer: true,
        },
      },
      customer: true,
      createdByUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return schedule
})
