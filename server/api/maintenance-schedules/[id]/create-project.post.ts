export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID jadwal tidak valid',
    })
  }

  // Read body for budget
  const body = await readBody(event).catch(() => ({}))
  const budget = Number(body?.budget) || 0

  // Get maintenance schedule
  const schedule = await prisma.maintenanceSchedule.findUnique({
    where: { id },
    include: {
      project: {
        include: { customer: true },
      },
      customer: true,
    },
  })

  if (!schedule) {
    throw createError({
      statusCode: 404,
      message: 'Jadwal tidak ditemukan',
    })
  }

  // Must be completed
  if (schedule.status !== 'COMPLETED') {
    throw createError({
      statusCode: 400,
      message: 'Jadwal harus dalam status SELESAI untuk membuat project',
    })
  }

  // Check if already has result project
  if (schedule.resultProjectId) {
    throw createError({
      statusCode: 400,
      message: 'Project untuk maintenance ini sudah dibuat sebelumnya',
    })
  }

  // Get customer ID from schedule or source project
  const customerId = schedule.customerId || schedule.project?.customerId
  if (!customerId) {
    throw createError({
      statusCode: 400,
      message: 'Customer tidak ditemukan untuk jadwal ini',
    })
  }

  // Generate project number
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `MNT-${year}${month}`

  const lastProject = await prisma.project.findFirst({
    where: {
      projectNumber: { startsWith: prefix },
      status: { not: 'CANCELLED' },
    },
    orderBy: { projectNumber: 'desc' },
  })

  let sequence = 1
  if (lastProject) {
    const lastSeq = parseInt(lastProject.projectNumber.slice(-3))
    sequence = lastSeq + 1
  }

  const projectNumber = `${prefix}-${String(sequence).padStart(3, '0')}`

  // Create project with budget from request
  const project = await prisma.project.create({
    data: {
      projectNumber,
      customerId,
      title: `Maintenance: ${schedule.title}`,
      description: schedule.description || `Project dari maintenance jadwal ${schedule.id}`,
      status: 'ONGOING',
      budget: budget,
      startDate: now,
    },
    include: {
      customer: true,
    },
  })

  // Update maintenance schedule with result project
  await prisma.maintenanceSchedule.update({
    where: { id },
    data: { resultProjectId: project.id },
  })

  return project
})
