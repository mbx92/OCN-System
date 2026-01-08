// API untuk generate PDF slip pembayaran teknisi
import { usePdfGenerator } from '~/composables/usePdfGenerator'
import dayjs from 'dayjs'

export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const { technicianId, period, startDate, endDate } = query

  if (!technicianId) {
    throw createError({
      statusCode: 400,
      message: 'Technician ID is required',
    })
  }

  try {
    // Fetch payment recap data
    const recapUrl = `/api/technicians/payment-recap?technicianId=${technicianId}`
    const params = new URLSearchParams()
    if (period) params.append('period', period as string)
    if (startDate) params.append('startDate', startDate as string)
    if (endDate) params.append('endDate', endDate as string)

    const recap: any = await $fetch(`${recapUrl}&${params.toString()}`)

    // Get company info
    const company = await prisma.company.findFirst()
    const companySettings = company?.settings as any

    // Generate HTML for PDF
    const html = generatePaymentSlipHTML(recap, companySettings)

    // Generate PDF using server-side PDF generator
    // For now, return HTML structure that will be converted to PDF on client
    return {
      success: true,
      data: {
        html,
        recap,
        filename: `Slip-Pembayaran-${recap.technician.name}-${recap.period.display}.pdf`,
      },
    }
  } catch (error: any) {
    console.error('Error generating payment slip PDF:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate payment slip PDF',
    })
  }
})

function generatePaymentSlipHTML(recap: any, companySettings: any) {
  const { technician, period, payments, cashAdvances, bonuses, summary } = recap

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 20px;
      color: #333;
    }
    .slip-container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #2563eb;
      font-size: 24px;
    }
    .header .period {
      margin: 5px 0;
      color: #666;
      font-size: 14px;
    }
    .tech-info {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .tech-info table {
      width: 100%;
    }
    .tech-info td {
      padding: 5px 0;
    }
    .tech-info td:first-child {
      font-weight: bold;
      width: 120px;
    }
    .section {
      margin: 20px 0;
    }
    .section-title {
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .items-table th {
      background: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-size: 12px;
      border-bottom: 2px solid #e5e7eb;
    }
    .items-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
    }
    .items-table .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    .summary {
      margin-top: 30px;
      background: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .summary-row.total {
      border-top: 2px solid #2563eb;
      margin-top: 10px;
      padding-top: 15px;
      font-weight: bold;
      font-size: 18px;
      color: #2563eb;
    }
    .summary-row .amount {
      font-family: 'Courier New', monospace;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #666;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .no-data {
      text-align: center;
      padding: 20px;
      color: #999;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="slip-container">
    <div class="header">
      <h1>SLIP PEMBAYARAN TEKNISI</h1>
      <div class="period">Periode: ${period.display}</div>
    </div>

    <div class="tech-info">
      <table>
        <tr>
          <td>Nama Teknisi</td>
          <td>: ${technician.name}</td>
        </tr>
        <tr>
          <td>ID / No. HP</td>
          <td>: ${technician.phone}</td>
        </tr>
        <tr>
          <td>Tipe</td>
          <td>: ${technician.type}</td>
        </tr>
      </table>
    </div>

    ${
      payments.length > 0
        ? `
    <div class="section">
      <div class="section-title">RINCIAN PEMBAYARAN</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>Proyek</th>
            <th>Keterangan</th>
            <th class="amount">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${payments
            .map(
              (payment: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${dayjs(payment.createdAt).format('DD/MM/YYYY')}</td>
            <td>${payment.project?.projectNumber || '-'}</td>
            <td>${payment.description || '-'}</td>
            <td class="amount">Rp ${Number(payment.amount).toLocaleString('id-ID')}</td>
          </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : '<div class="no-data">Tidak ada pembayaran dalam periode ini</div>'
    }

    ${
      bonuses.length > 0
        ? `
    <div class="section">
      <div class="section-title">BONUS</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>Jenis</th>
            <th>Keterangan</th>
            <th class="amount">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${bonuses
            .map(
              (bonus: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${dayjs(bonus.date).format('DD/MM/YYYY')}</td>
            <td>${bonus.bonusType}</td>
            <td>${bonus.description}</td>
            <td class="amount">Rp ${Number(bonus.amount).toLocaleString('id-ID')}</td>
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

    ${
      cashAdvances.length > 0
        ? `
    <div class="section">
      <div class="section-title">POTONGAN KAS BON</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>Keterangan</th>
            <th class="amount">Sisa Hutang</th>
          </tr>
        </thead>
        <tbody>
          ${cashAdvances
            .map(
              (advance: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${dayjs(advance.date).format('DD/MM/YYYY')}</td>
            <td>${advance.reason}</td>
            <td class="amount">Rp ${Number(advance.remainingAmount).toLocaleString('id-ID')}</td>
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
        <span>Total Pembayaran</span>
        <span class="amount">Rp ${Number(summary.totalPayments).toLocaleString('id-ID')}</span>
      </div>
      ${
        summary.totalBonuses > 0
          ? `
      <div class="summary-row">
        <span>Total Bonus</span>
        <span class="amount">+ Rp ${Number(summary.totalBonuses).toLocaleString('id-ID')}</span>
      </div>
      `
          : ''
      }
      ${
        summary.totalCashAdvances > 0
          ? `
      <div class="summary-row">
        <span>Potongan Kas Bon</span>
        <span class="amount">- Rp ${Number(summary.totalCashAdvances).toLocaleString('id-ID')}</span>
      </div>
      `
          : ''
      }
      <div class="summary-row total">
        <span>TOTAL BERSIH</span>
        <span class="amount">Rp ${Number(summary.netPayment).toLocaleString('id-ID')}</span>
      </div>
    </div>

    <div class="footer">
      <p>Dicetak pada: ${dayjs().format('DD MMMM YYYY HH:mm')}</p>
      <p>${companySettings?.name || 'PT. OCN System'}</p>
    </div>
  </div>
</body>
</html>
  `
}
