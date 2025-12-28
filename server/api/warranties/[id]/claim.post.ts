import { z } from 'zod'

const createClaimSchema = z.object({
  description: z.string().min(1, 'Deskripsi keluhan wajib diisi'),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const warranty = await prisma.warranty.findUnique({
    where: { id },
  })

  if (!warranty) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Garansi tidak ditemukan',
    })
  }

  if (warranty.status === 'EXPIRED' || warranty.status === 'VOIDED') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Garansi sudah tidak aktif',
    })
  }

  const result = createClaimSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  // Generate claim number: CLM-YYYYMMDD-XXX
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `CLM-${dateStr}-`

  const lastClaim = await prisma.warrantyClaim.findFirst({
    where: { claimNumber: { startsWith: prefix } },
    orderBy: { claimNumber: 'desc' },
  })

  let sequence = 1
  if (lastClaim) {
    const lastSeq = parseInt(lastClaim.claimNumber.slice(-3))
    sequence = lastSeq + 1
  }

  const claimNumber = `${prefix}${String(sequence).padStart(3, '0')}`

  // Create claim and update warranty status
  const [claim] = await prisma.$transaction([
    prisma.warrantyClaim.create({
      data: {
        claimNumber,
        warrantyId: id,
        description: result.data.description,
      },
    }),
    prisma.warranty.update({
      where: { id },
      data: { status: 'CLAIMED' },
    }),
  ])

  // Send Telegram notification
  const warrantyWithProject = await prisma.warranty.findUnique({
    where: { id },
    include: {
      project: {
        include: { customer: true },
      },
    },
  })

  if (warrantyWithProject?.project) {
    notifyWarrantyClaim({
      issue: result.data.description,
      customerName: warrantyWithProject.project.customer.name,
      projectNumber: warrantyWithProject.project.projectNumber,
    })
  }

  return claim
})
