import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const body = await readBody(event)

  const { projectId, customerId, title, description, scheduledDate, notes } = body

  // Validasi: minimal title dan scheduledDate wajib
  if (!title || !scheduledDate) {
    throw createError({
      statusCode: 400,
      message: 'Judul dan tanggal jadwal wajib diisi',
    })
  }

  // Validasi: harus ada projectId ATAU customerId
  if (!projectId && !customerId) {
    throw createError({
      statusCode: 400,
      message: 'Pilih project atau customer untuk jadwal ini',
    })
  }

  // Jika ada projectId, verify project exists dan ambil customerId dari project
  let finalCustomerId = customerId
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, customerId: true },
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        message: 'Proyek tidak ditemukan',
      })
    }

    // Gunakan customerId dari project
    finalCustomerId = project.customerId
  }

  // Jika hanya ada customerId tanpa projectId, verify customer exists
  if (finalCustomerId && !projectId) {
    const customer = await prisma.customer.findUnique({
      where: { id: finalCustomerId },
    })

    if (!customer) {
      throw createError({
        statusCode: 404,
        message: 'Customer tidak ditemukan',
      })
    }
  }

  // Final validation: pastikan ada finalCustomerId
  if (!finalCustomerId) {
    throw createError({
      statusCode: 400,
      message: 'Customer harus ada (dari project atau dipilih langsung)',
    })
  }

  const schedule = await prisma.maintenanceSchedule.create({
    data: {
      projectId: projectId || null,
      customerId: finalCustomerId,
      title,
      description: description || null,
      scheduledDate: new Date(scheduledDate),
      notes: notes || null,
      createdBy: user.id,
    },
    include: {
      project: projectId
        ? {
            include: {
              customer: true,
            },
          }
        : false,
      customer: finalCustomerId && !projectId ? true : false,
      createdByUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Send Telegram notification
  const customerName = schedule.project?.customer?.name || schedule.customer?.name
  notifyMaintenanceSchedule({
    title: schedule.title,
    scheduledDate: schedule.scheduledDate,
    customerName: customerName || undefined,
    projectNumber: schedule.project?.projectNumber,
  })

  return schedule
})
