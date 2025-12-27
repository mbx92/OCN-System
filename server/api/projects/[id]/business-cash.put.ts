import { z } from 'zod'

const schema = z.object({
  businessCashPercentage: z.number().min(0).max(100),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required',
    })
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.errors[0].message,
    })
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      businessCashPercentage: result.data.businessCashPercentage,
    },
  })

  return project
})
