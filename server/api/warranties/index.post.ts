import { z } from 'zod'

const createWarrantySchema = z.object({
  projectId: z.string().min(1, 'Proyek wajib dipilih'),
  warrantyMonths: z.number().min(1).default(12),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async event => {
  const body = await readBody(event)

  const result = createWarrantySchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const data = result.data

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Proyek tidak ditemukan',
    })
  }

  // Check if warranty already exists for this project
  const existingWarranty = await prisma.warranty.findFirst({
    where: { projectId: data.projectId },
  })

  if (existingWarranty) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Garansi untuk proyek ini sudah ada',
    })
  }

  // Generate warranty number: WAR-YYYYMM-XXX
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `WAR-${year}${month}-`

  const lastWarranty = await prisma.warranty.findFirst({
    where: { warrantyNumber: { startsWith: prefix } },
    orderBy: { warrantyNumber: 'desc' },
  })

  let sequence = 1
  if (lastWarranty) {
    const lastSeq = parseInt(lastWarranty.warrantyNumber.slice(-3))
    sequence = lastSeq + 1
  }

  const warrantyNumber = `${prefix}${String(sequence).padStart(3, '0')}`

  // Calculate dates
  const startDate = project.endDate || now
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + data.warrantyMonths)

  const warranty = await prisma.warranty.create({
    data: {
      warrantyNumber,
      projectId: data.projectId,
      startDate,
      endDate,
      warrantyMonths: data.warrantyMonths,
      notes: data.notes || null,
    },
    include: {
      project: {
        select: {
          id: true,
          projectNumber: true,
          title: true,
        },
      },
    },
  })

  return warranty
})
