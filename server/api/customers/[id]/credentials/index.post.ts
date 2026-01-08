// POST /api/customers/[id]/credentials - Add credential
import { z } from 'zod'

const credentialSchema = z.object({
  deviceName: z.string().min(1, 'Nama device wajib diisi'),
  deviceType: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
  port: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async event => {
  const customerId = getRouterParam(event, 'id')

  if (!customerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer ID required',
    })
  }

  const body = await readBody(event)
  const result = credentialSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const credential = await prisma.customerCredential.create({
    data: {
      customerId,
      deviceName: result.data.deviceName,
      deviceType: result.data.deviceType || null,
      ipAddress: result.data.ipAddress || null,
      username: result.data.username,
      password: result.data.password,
      port: result.data.port || null,
      image: result.data.image || null,
      notes: result.data.notes || null,
    },
  })

  return credential
})
