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

    // Set customerId dari project jika tidak diisi manual
    if (!finalCustomerId) {
      finalCustomerId = project.customerId
    }
  }

  // Jika ada customerId tanpa projectId, verify customer exists
  if (customerId && !projectId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      throw createError({
        statusCode: 404,
        message: 'Customer tidak ditemukan',
      })
    }
  }

  const schedule = await prisma.maintenanceSchedule.create({
    data: {
      projectId: projectId || null,
      customerId: finalCustomerId || null,
      title,
      description: description || null,
      scheduledDate: new Date(scheduledDate),
      notes: notes || null,
      createdBy: user.id,
    },
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
