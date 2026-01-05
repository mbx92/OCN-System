import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Format number to Indonesian format
const formatNumber = (num: any) => {
  return new Intl.NumberFormat('id-ID').format(parseFloat(num || 0))
}

// Format date to Indonesian format (27 Des 2025)
const formatDateIndo = (date: string) => {
  if (!date) return '-'
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ]
  const d = new Date(date)
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const formatDateTime = (date: string) => {
  if (!date) return '-'
  const d = new Date(date)
  return (
    d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  )
}

// Convert number to Indonesian words
const terbilang = (angka: number): string => {
  const huruf = [
    '',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
  ]

  angka = Math.floor(angka)
  if (angka < 12) return huruf[angka]
  if (angka < 20) return huruf[angka - 10] + ' belas'
  if (angka < 100) return huruf[Math.floor(angka / 10)] + ' puluh ' + huruf[angka % 10]
  if (angka < 200) return 'seratus ' + terbilang(angka - 100)
  if (angka < 1000) return huruf[Math.floor(angka / 100)] + ' ratus ' + terbilang(angka % 100)
  if (angka < 2000) return 'seribu ' + terbilang(angka - 1000)
  if (angka < 1000000)
    return terbilang(Math.floor(angka / 1000)) + ' ribu ' + terbilang(angka % 1000)
  if (angka < 1000000000)
    return terbilang(Math.floor(angka / 1000000)) + ' juta ' + terbilang(angka % 1000000)
  if (angka < 1000000000000)
    return terbilang(Math.floor(angka / 1000000000)) + ' milyar ' + terbilang(angka % 1000000000)
  return (
    terbilang(Math.floor(angka / 1000000000000)) + ' triliun ' + terbilang(angka % 1000000000000)
  )
}

const getPaymentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    DP: 'DOWN PAYMENT',
    FULL: 'LUNAS',
    INSTALLMENT: 'CICILAN',
    SETTLEMENT: 'PELUNASAN',
  }
  return labels[type] || type
}

// Load logo as base64
const loadLogoBase64 = async (companyLogo?: string): Promise<string | null> => {
  try {
    if (companyLogo && companyLogo.startsWith('data:image')) {
      return companyLogo
    }
    // Return null if no logo - jsPDF can handle this gracefully
    return null
  } catch {
    return null
  }
}

// Generate Invoice PDF Buffer
export const generateInvoicePdfBuffer = async (payment: any, company: any): Promise<Buffer> => {
  const settings = company?.settings || {}
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 15

  // Load logo
  const logoBase64 = await loadLogoBase64(settings.logo)

  // ===== HEADER SECTION =====
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, yPos - 5, 15, 15)
  }

  // INVOICE title and company info
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 128, 128)
  doc.text('INVOICE', 32, yPos + 2)

  doc.setFontSize(10)
  doc.setTextColor(0, 128, 128)
  doc.text(company?.name || 'OCN CCTV & Networking Solutions', 32, yPos + 8)

  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.text(settings.address || '-', 32, yPos + 13)
  doc.text(settings.phone || '-', 32, yPos + 17)

  // Middle column - Transaction Info
  const midCol = 95
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  const transInfo = [
    ['No Transaksi', ':', payment.paymentNumber || '-'],
    ['Tanggal', ':', formatDateTime(payment.paymentDate)],
    ['Pelanggan', ':', payment.project?.customer?.name || '-'],
    ['Alamat', ':', payment.project?.customer?.address || '-'],
  ]

  let transY = yPos
  transInfo.forEach(([label, colon, value]) => {
    doc.text(label, midCol, transY)
    doc.text(colon, midCol + 22, transY)
    doc.text(String(value).substring(0, 35), midCol + 25, transY)
    transY += 4
  })

  // Right column - Project Info
  const rightCol = 160
  const typeLabel = getPaymentTypeLabel(payment.type)
  const projectInfo = [
    ['No. Project', ':', payment.project?.projectNumber || '-'],
    ['User', ':', payment.receivedBy || 'ADMIN'],
    ['Tipe', ':', typeLabel],
  ]

  let projY = yPos
  projectInfo.forEach(([label, colon, value]) => {
    doc.text(label, rightCol, projY)
    doc.text(colon, rightCol + 16, projY)
    doc.text(String(value).substring(0, 20), rightCol + 19, projY)
    projY += 4
  })

  yPos += 24

  // ===== ITEMS TABLE =====
  const items = payment.project?.items || []
  const tableData = items.map((item: any, index: number) => [
    (index + 1).toString(),
    item.description || '-',
    formatNumber(item.quantity),
    item.unit || 'pcs',
    formatNumber(item.unitPrice),
    formatNumber(item.subtotal),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Deskripsi', 'Qty', 'Satuan', 'Harga Satuan', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 128, 128],
      textColor: 255,
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 60 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 35 },
      5: { halign: 'right', cellWidth: 35 },
    },
    bodyStyles: {
      fontSize: 8,
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY || yPos + 40

  // ===== SUMMARY SECTION =====
  let summaryY = finalY + 10
  const summaryCol = 140

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal || 0), 0)
  const ppn = parseFloat(payment.project?.ppn || 0)
  const pph = parseFloat(payment.project?.pph || 0)
  const discount = parseFloat(payment.project?.discount || 0)
  const adjustment = parseFloat(payment.project?.adjustment || 0)
  const total = parseFloat(payment.project?.total || 0)

  // All previous payments for this project
  const allPayments = payment.project?.payments || []
  const totalPaid = allPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0)
  const kredit = total - totalPaid

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  // Subtotal
  doc.text('Subtotal:', summaryCol, summaryY)
  doc.text(formatNumber(subtotal), pageWidth - 14, summaryY, { align: 'right' })
  summaryY += 5

  // PPN
  if (ppn > 0) {
    doc.text('PPN:', summaryCol, summaryY)
    doc.text(formatNumber(ppn), pageWidth - 14, summaryY, { align: 'right' })
    summaryY += 5
  }

  // PPH
  if (pph > 0) {
    doc.text('PPH:', summaryCol, summaryY)
    doc.text(formatNumber(pph), pageWidth - 14, summaryY, { align: 'right' })
    summaryY += 5
  }

  // Discount
  if (discount > 0) {
    doc.text('Diskon:', summaryCol, summaryY)
    doc.text(`(${formatNumber(discount)})`, pageWidth - 14, summaryY, { align: 'right' })
    summaryY += 5
  }

  // Adjustment
  if (adjustment !== 0) {
    doc.text('Penyesuaian:', summaryCol, summaryY)
    doc.text(formatNumber(adjustment), pageWidth - 14, summaryY, { align: 'right' })
    summaryY += 5
  }

  // Total (with highlight)
  doc.setFillColor(0, 128, 128)
  doc.rect(summaryCol - 2, summaryY - 4, pageWidth - summaryCol - 10, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL:', summaryCol, summaryY)
  doc.text(formatNumber(total), pageWidth - 14, summaryY, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  summaryY += 8

  // Dibayar row (no highlight)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dibayar (${payment.method}):`, summaryCol, summaryY)
  doc.text(formatNumber(payment.amount), pageWidth - 14, summaryY, { align: 'right' })
  summaryY += 5

  doc.text('Sisa:', summaryCol, summaryY)
  if (kredit > 0) {
    doc.setTextColor(255, 100, 0)
  }
  doc.text(formatNumber(kredit), pageWidth - 14, summaryY, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  summaryY += 8

  // User signature
  doc.text(payment.receivedBy || 'ADMIN', pageWidth - 14, summaryY, { align: 'right' })

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}

// Generate Receipt PDF Buffer
export const generateReceiptPdfBuffer = async (payment: any, company: any): Promise<Buffer> => {
  const settings = company?.settings || {}
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Load logo
  const logoBase64 = await loadLogoBase64(settings.logo)

  // ===== HEADER SECTION =====
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, yPos - 8, 18, 18)
  }

  // Company name and KWITANSI title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 128, 128)
  doc.text(company?.name || 'OCN CCTV & Networking Solutions', 35, yPos)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(settings.address || '-', 35, yPos + 5)
  doc.text(`Telp: ${settings.phone || '-'}`, 35, yPos + 9)

  // KWITANSI title on right
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('KWITANSI', pageWidth - 14, yPos + 2, { align: 'right' })

  yPos += 20

  // Horizontal line separator
  doc.setDrawColor(0, 128, 128)
  doc.setLineWidth(0.5)
  doc.line(14, yPos, pageWidth - 14, yPos)

  yPos += 8

  // ===== RECEIPT DETAILS =====
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const leftCol = 20
  const colonCol = 62
  const valueCol = 68

  const receiptInfo = [
    ['Nomor', ':', payment.paymentNumber || '-'],
    ['Tanggal', ':', formatDateIndo(payment.paymentDate)],
    ['Telah Terima Dari', ':', payment.project?.customer?.name || '-'],
    ['Alamat', ':', payment.project?.customer?.address || '-'],
    ['Uang Sejumlah', ':', `Rp ${formatNumber(payment.amount)}`],
    ['Terbilang', ':', `${terbilang(parseFloat(payment.amount)).toUpperCase()} RUPIAH`],
    ['Untuk Pembayaran', ':', payment.project?.name || '-'],
    ['No. Project', ':', payment.project?.projectNumber || '-'],
    ['Metode Pembayaran', ':', payment.method || '-'],
  ]

  receiptInfo.forEach(([label, colon, value]) => {
    doc.text(label, leftCol, yPos)
    doc.text(colon, colonCol, yPos)
    doc.text(String(value), valueCol, yPos)
    yPos += 6
  })

  yPos += 10

  // ===== PAYMENT SUMMARY TABLE =====
  const items = payment.project?.items || []
  const subtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal || 0), 0)
  const ppn = parseFloat(payment.project?.ppn || 0)
  const pph = parseFloat(payment.project?.pph || 0)
  const discount = parseFloat(payment.project?.discount || 0)
  const adjustment = parseFloat(payment.project?.adjustment || 0)
  const total = parseFloat(payment.project?.total || 0)

  const allPayments = payment.project?.payments || []
  const totalPaid = allPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0)
  const sisa = total - totalPaid

  const summaryData = [
    ['Total Project', formatNumber(total)],
    ['Dibayar', formatNumber(payment.amount)],
    ['Sisa', formatNumber(sisa)],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Keterangan', 'Jumlah']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 128, 128],
      textColor: 255,
      fontSize: 9,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 100 },
      1: { halign: 'right', cellWidth: 78 },
    },
    bodyStyles: {
      fontSize: 9,
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY || yPos + 30

  // ===== SIGNATURE SECTION =====
  yPos = finalY + 15

  const sigLeftCol = 40
  const sigRightCol = pageWidth - 60

  doc.setFontSize(9)
  doc.text('Yang Menerima,', sigLeftCol, yPos, { align: 'center' })
  doc.text('Hormat Kami,', sigRightCol, yPos, { align: 'center' })

  yPos += 20

  // Signature lines
  doc.line(sigLeftCol - 25, yPos, sigLeftCol + 25, yPos)
  doc.line(sigRightCol - 25, yPos, sigRightCol + 25, yPos)

  yPos += 5

  doc.text(payment.project?.customer?.name || '(.....................)', sigLeftCol, yPos, {
    align: 'center',
  })
  doc.text(payment.receivedBy || 'ADMIN', sigRightCol, yPos, { align: 'center' })

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}
