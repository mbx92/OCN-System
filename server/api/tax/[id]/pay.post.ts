// POST /api/tax/:id/pay - Record tax payment
export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { paymentDate, paymentProof, billingCode, notes } = body

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Tax ID is required',
    })
  }

  if (!paymentDate) {
    throw createError({
      statusCode: 400,
      message: 'Payment date is required',
    })
  }

  // Get tax record
  const taxPayment = await prisma.taxPayment.findUnique({
    where: { id },
  })

  if (!taxPayment) {
    throw createError({
      statusCode: 404,
      message: 'Tax payment not found',
    })
  }

  if (taxPayment.status === 'PAID') {
    throw createError({
      statusCode: 400,
      message: 'Tax is already paid',
    })
  }

  if (taxPayment.status === 'EXEMPTED') {
    throw createError({
      statusCode: 400,
      message: 'Tax is exempted, no payment needed',
    })
  }

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  // Create cashflow transaction
  const cashTransaction = await prisma.cashTransaction.create({
    data: {
      type: 'EXPENSE',
      category: 'TAX',
      amount: -Number(taxPayment.taxAmount), // Negative for expense
      description: `PPh Final UMKM 0,5% - ${monthNames[taxPayment.month - 1]} ${taxPayment.year}`,
      reference: `TAX-${taxPayment.year}${String(taxPayment.month).padStart(2, '0')}`,
      referenceType: 'TaxPayment',
      referenceId: taxPayment.id,
      date: new Date(paymentDate),
    },
  })

  // Update tax record
  const updatedTax = await prisma.taxPayment.update({
    where: { id },
    data: {
      status: 'PAID',
      paymentDate: new Date(paymentDate),
      paymentProof,
      billingCode: billingCode || taxPayment.billingCode,
      notes: notes || taxPayment.notes,
      cashTransactionId: cashTransaction.id,
      updatedAt: new Date(),
    },
    include: {
      cashTransaction: true,
    },
  })

  return {
    success: true,
    taxPayment: {
      ...updatedTax,
      period: `${monthNames[updatedTax.month - 1]} ${updatedTax.year}`,
      omzet: Number(updatedTax.omzet),
      taxRate: Number(updatedTax.taxRate),
      taxAmount: Number(updatedTax.taxAmount),
    },
    cashTransaction,
  }
})
