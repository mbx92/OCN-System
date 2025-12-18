import { z } from 'zod'

const expenseSchema = z.object({
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  amount: z.number().min(0, 'Jumlah tidak boleh negatif'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  date: z.string().datetime(), // Expect ISO string
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek tidak ditemukan',
    })
  }

  const result = expenseSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { description, amount, category, date } = result.data

  const expense = await prisma.projectExpense.create({
    data: {
      projectId: id,
      description,
      amount,
      category,
      date: new Date(date),
    },
  })

  // Update actual cost of project
  await prisma.project.update({
    where: { id },
    data: {
      actualCost: {
        increment: amount,
      },
    },
  })

  return expense
})
