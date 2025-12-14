import prisma from '~/server/utils/prisma'
import dayjs from 'dayjs'

export default defineEventHandler(async () => {
    const alerts: { id: string; type: string; message: string }[] = []
    const today = new Date()
    const thirtyDaysFromNow = dayjs().add(30, 'day').toDate()

    // Overdue payments
    const overduePayments = await prisma.payment.findMany({
        where: {
            status: 'PENDING',
            dueDate: { lt: today },
        },
        include: {
            project: {
                include: { customer: true },
            },
        },
        take: 5,
    })

    overduePayments.forEach((payment) => {
        alerts.push({
            id: `payment-${payment.id}`,
            type: 'error',
            message: `Pembayaran ${payment.project.projectNumber} dari ${payment.project.customer.name} telah jatuh tempo`,
        })
    })

    // Low stock alerts
    const lowStock = await prisma.stock.findMany({
        where: {
            product: { minStock: { gt: 0 } },
            available: { lte: 5 },
        },
        include: { product: true },
        take: 5,
    })

    lowStock.forEach((stock) => {
        if (stock.available <= stock.product.minStock) {
            alerts.push({
                id: `stock-${stock.id}`,
                type: 'warning',
                message: `Stok ${stock.product.name} rendah (${stock.available} tersisa)`,
            })
        }
    })

    // Expiring warranties
    const expiringWarranties = await prisma.warranty.findMany({
        where: {
            status: 'ACTIVE',
            endDate: {
                gte: today,
                lte: thirtyDaysFromNow,
            },
        },
        include: {
            project: {
                include: { customer: true },
            },
        },
        take: 5,
    })

    expiringWarranties.forEach((warranty) => {
        const daysLeft = dayjs(warranty.endDate).diff(today, 'day')
        alerts.push({
            id: `warranty-${warranty.id}`,
            type: 'info',
            message: `Garansi ${warranty.itemName} untuk ${warranty.project.customer.name} berakhir dalam ${daysLeft} hari`,
        })
    })

    // Projects over budget
    const overBudgetProjects = await prisma.project.findMany({
        where: {
            status: { in: ['ONGOING', 'PROCUREMENT'] },
        },
        include: { customer: true },
    })

    overBudgetProjects.forEach((project) => {
        const budgetUsed = (project.actualCost.toNumber() / project.budget.toNumber()) * 100
        if (budgetUsed >= 90) {
            alerts.push({
                id: `budget-${project.id}`,
                type: 'warning',
                message: `${project.projectNumber} sudah menggunakan ${budgetUsed.toFixed(0)}% budget`,
            })
        }
    })

    return alerts.slice(0, 10)
})
