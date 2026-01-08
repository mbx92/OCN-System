export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID pembayaran tidak valid',
    })
  }

  const payment: any = await prisma.payment.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          customer: true,
          quotations: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      },
    },
  })

  if (!payment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pembayaran tidak ditemukan',
    })
  }

  // Get company settings for branding
  const company = await prisma.company.findFirst()

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  }

  // Calculate subtotal from quotation items
  let subtotal = 0
  let taxAmount = 0
  const quotation = payment.project?.quotations?.[0]
  const items = (quotation?.items as any[]) || []

  items.forEach((item: any) => {
    const itemTotal = Number(item.quantity) * Number(item.price)
    subtotal += itemTotal
  })

  // Calculate tax if applicable (from company settings JSON)
  const settings = company?.settings as any
  if (settings?.taxRate) {
    taxAmount = subtotal * (Number(settings.taxRate) / 100)
  }

  const totalBeforeDiscount = subtotal + taxAmount
  const totalAfterDiscount = totalBeforeDiscount - Number(payment.discount || 0)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${payment.paymentNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      padding: 40px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 1px solid #ddd;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-left h1 {
      font-size: 32px;
      margin-bottom: 5px;
    }
    .header-left p {
      opacity: 0.9;
      font-size: 14px;
    }
    .header-right {
      text-align: right;
    }
    .invoice-number {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .invoice-date {
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #667eea;
      text-transform: uppercase;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .info-box p {
      margin-bottom: 5px;
      font-size: 14px;
    }
    .info-box strong {
      display: inline-block;
      width: 120px;
      color: #666;
      font-weight: 500;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-paid { background: #d4edda; color: #155724; }
    .status-unpaid { background: #fff3cd; color: #856404; }
    .status-partial { background: #d1ecf1; color: #0c5460; }
    .status-overdue { background: #f8d7da; color: #721c24; }
    .status-cancelled { background: #e2e3e5; color: #383d41; }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .items-table th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #dee2e6;
      font-size: 14px;
    }
    .items-table .text-right {
      text-align: right;
    }
    .items-table .text-center {
      text-align: center;
    }
    .summary {
      margin-top: 30px;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .summary-row.total {
      border-top: 2px solid #dee2e6;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
      color: #667eea;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #dee2e6;
      font-size: 13px;
      color: #666;
    }
    .notes {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-top: 20px;
      border-radius: 4px;
    }
    .notes strong {
      display: block;
      margin-bottom: 5px;
      color: #856404;
    }
    @media print {
      body { padding: 0; }
      .invoice-container { border: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="header-left">
        <h1>INVOICE</h1>
        <p>${company?.name || 'PT. Oase Cipta Nusa'}</p>
      </div>
      <div class="header-right">
        <div class="invoice-number">${payment.paymentNumber}</div>
        <div class="invoice-date">${formatDate(payment.createdAt)}</div>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <div class="info-grid">
          <div class="info-box">
            <div class="section-title">Kepada</div>
            <p><strong>Nama:</strong> ${payment.project?.customer.name || '-'}</p>
            <p><strong>Telepon:</strong> ${payment.project?.customer.phone || '-'}</p>
            <p><strong>Alamat:</strong> ${payment.project?.customer.address || '-'}</p>
          </div>
          <div class="info-box">
            <div class="section-title">Detail Invoice</div>
            <p><strong>No. Project:</strong> ${payment.project?.projectNumber || '-'}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span></p>
            ${payment.dueDate ? `<p><strong>Jatuh Tempo:</strong> ${formatDate(payment.dueDate)}</p>` : ''}
            ${payment.paidDate ? `<p><strong>Tgl Bayar:</strong> ${formatDate(payment.paidDate)}</p>` : ''}
          </div>
        </div>
      </div>

      ${
        items.length > 0
          ? `
      <div class="section">
        <div class="section-title">Detail Item</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Item</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Harga</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name || item.description || '-'}</td>
                <td class="text-center">${item.quantity} ${item.unit || ''}</td>
                <td class="text-right">${formatCurrency(Number(item.price))}</td>
                <td class="text-right">${formatCurrency(Number(item.quantity) * Number(item.price))}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <div class="summary">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${
          taxAmount > 0
            ? `
        <div class="summary-row">
          <span>Pajak (${settings?.taxRate || 0}%)</span>
          <span>${formatCurrency(taxAmount)}</span>
        </div>
        `
            : ''
        }
        ${
          Number(payment.discount || 0) > 0
            ? `
        <div class="summary-row">
          <span>Diskon${payment.discountNote ? ` (${payment.discountNote})` : ''}</span>
          <span>-${formatCurrency(Number(payment.discount || 0))}</span>
        </div>
        `
            : ''
        }
        <div class="summary-row total">
          <span>TOTAL</span>
          <span>${formatCurrency(Number(payment.amount))}</span>
        </div>
      </div>

      ${
        payment.notes
          ? `
      <div class="notes">
        <strong>Catatan:</strong>
        ${payment.notes}
      </div>
      `
          : ''
      }
    </div>

    <div class="footer">
      <p><strong>${company?.name || 'PT. Oase Cipta Nusa'}</strong></p>
      ${settings?.address ? `<p>${settings.address}</p>` : ''}
      ${settings?.phone ? `<p>Telp: ${settings.phone}</p>` : ''}
      ${settings?.email ? `<p>Email: ${settings.email}</p>` : ''}
    </div>
  </div>
</body>
</html>
`

  return html
})
