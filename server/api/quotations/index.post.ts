import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import dayjs from 'dayjs'

const quotationSchema = z.object({
    customerId: z.string().min(1, 'Pelanggan harus dipilih'),
    title: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().optional().nullable(),
        name: z.string().min(1),
        quantity: z.number().min(1),
        unit: z.string().min(1),
        price: z.number().min(0),
    })).min(1, 'Minimal 1 item'),
    validDays: z.number().default(14),
    notes: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const result = quotationSchema.safeParse(body)
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: result.error.errors[0].message,
        })
    }

    // Generate quotation number
    const startOfMonth = dayjs().startOf('month').toDate()
    const endOfMonth = dayjs().endOf('month').toDate()
    const count = await prisma.quotation.count({
        where: {
            createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
    })
    const quotationNo = `QT-${dayjs().format('YYYYMM')}-${String(count + 1).padStart(3, '0')}`

    // Calculate total
    const items = result.data.items.map(item => ({
        ...item,
        total: item.quantity * item.price,
    }))
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0)

    const quotation = await prisma.quotation.create({
        data: {
            quotationNo,
            customerId: result.data.customerId,
            title: result.data.title || null,
            items,
            totalAmount,
            validUntil: dayjs().add(result.data.validDays, 'day').toDate(),
            notes: result.data.notes || null,
            status: 'DRAFT',
        },
        include: {
            project: true,
        },
    })

    return quotation
})
