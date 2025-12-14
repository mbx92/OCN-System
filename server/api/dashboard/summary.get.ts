import prisma from '~/server/utils/prisma'
import dayjs from 'dayjs'

export default defineEventHandler(async () => {
    const startOfMonth = dayjs().startOf('month').toDate()
    const endOfMonth = dayjs().endOf('month').toDate()

    // Active projects count
    const activeProjects = await prisma.project.count({
        where: {
            status: { in: ['QUOTATION', 'APPROVED', 'PROCUREMENT', 'ONGOING'] },
        },
    })

    // Ongoing projects
    const ongoingProjects = await prisma.project.count({
        where: { status: 'ONGOING' },
    })

    // Monthly revenue (paid projects this month)
    const paidThisMonth = await prisma.payment.aggregate({
        where: {
            status: 'PAID',
            paidDate: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
        _sum: { amount: true },
    })

    // Paid projects count
    const paidProjects = await prisma.project.count({
        where: {
            status: { in: ['PAID', 'CLOSED'] },
            updatedAt: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
    })

    // Pending payments
    const pendingPayments = await prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
    })

    // Overdue payments
    const overdueCount = await prisma.payment.count({
        where: {
            status: 'PENDING',
            dueDate: { lt: new Date() },
        },
    })

    // Total customers
    const totalCustomers = await prisma.customer.count()

    // New customers this month
    const newCustomers = await prisma.customer.count({
        where: {
            createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
    })

    return {
        activeProjects,
        ongoingProjects,
        monthlyRevenue: paidThisMonth._sum.amount?.toNumber() || 0,
        paidProjects,
        pendingPayments: pendingPayments._sum.amount?.toNumber() || 0,
        overdueCount,
        totalCustomers,
        newCustomers,
    }
})
