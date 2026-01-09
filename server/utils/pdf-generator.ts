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
    return null
  } catch {
    return null
  }
}

// Generate Invoice PDF Buffer - Matching frontend design
export const generateInvoicePdfBuffer = async (payment: any, company: any): Promise<Buffer> => {
  const settings = company?.settings || {}
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 15

  // Load logo
  const logoBase64 = await loadLogoBase64(settings.logo)

  // ===== HEADER SECTION =====
  // Logo on the left
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, yPos - 5, 15, 15)
  }

  // INVOICE title and company info
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 128, 128) // Teal color
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
  projectInfo.forEach(([label, colon, value], idx) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, rightCol, projY)
    doc.text(colon, rightCol + 18, projY)
    if (idx === 2) {
      // Tipe row - make value bold
      doc.setFont('helvetica', 'bold')
    }
    doc.text(String(value), rightCol + 21, projY)
    projY += 4
  })

  yPos = Math.max(yPos + 25, projY + 5)

  // ===== ITEMS TABLE =====
  const items = payment.project?.items || []
  const tableBody = items.map((item: any, idx: number) => [
    (idx + 1).toString(),
    item.product?.sku || '-',
    item.name || item.description || '-',
    item.quantity?.toString() || '0',
    item.unit || '-',
    formatNumber(item.price || item.unitPrice),
    formatNumber(item.totalPrice || item.subtotal),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['No.', 'Kode Item', 'Nama Item', 'Jml', 'Satuan', 'Harga', 'Total']],
    body: tableBody,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
      fontSize: 8,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { fontSize: 7 },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 5

  // Separator line
  doc.setLineWidth(0.5)
  doc.line(14, yPos, pageWidth - 14, yPos)
  yPos += 8

  // ===== FOOTER SECTION - 3 COLUMNS =====
  const items_arr = payment.project?.items || []
  const subTotal = items_arr.reduce(
    (sum: number, item: any) => sum + parseFloat(item.totalPrice || item.subtotal || 0),
    0
  )
  const kredit = Math.max(0, subTotal - parseFloat(payment.amount || 0))

  // Left column - Keterangan & Signatures
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Keterangan :', 14, yPos)
  yPos += 8

  doc.setFont('helvetica', 'normal')
  doc.text('Hormat Kami', 14, yPos)
  doc.text('Penerima', 50, yPos)

  // Add signature image if available
  if (settings.signature && settings.signature.startsWith('data:image')) {
    try {
      const gState = new (doc as any).GState({ opacity: 1 })
      doc.setGState(gState)
      doc.addImage(settings.signature, 'PNG', 8, yPos + 1, 35, 14)
    } catch (e) {
      console.error('Error adding signature:', e)
    }
  }

  // Add watermark stamp with logo only (30% transparent)
  if (logoBase64) {
    try {
      const stampGState = new (doc as any).GState({ opacity: 0.3 })
      doc.setGState(stampGState)
      const stampX = 32
      const stampY = yPos + 2
      doc.addImage(logoBase64, 'PNG', stampX - 10, stampY, 20, 20)
      const normalGState = new (doc as any).GState({ opacity: 1 })
      doc.setGState(normalGState)
    } catch (e) {
      console.error('Error adding stamp:', e)
    }
  }

  yPos += 18

  doc.setTextColor(0, 0, 0)
  doc.text('(....................)', 14, yPos)
  doc.text('(....................)', 50, yPos)
  yPos += 8

  // Terbilang
  doc.setFont('helvetica', 'bold')
  doc.text('Terbilang :', 14, yPos)
  doc.setFont('helvetica', 'normal')
  const terbilangText = terbilang(subTotal) + ' rupiah'
  doc.text(terbilangText, 14, yPos + 5, { maxWidth: 70 })
  yPos += 15

  // Bank Info
  if (settings.bankName || settings.bankAccount) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Informasi Pembayaran:', 14, yPos)
    yPos += 4
    doc.setFont('helvetica', 'normal')
    if (settings.bankName) {
      doc.text(`Bank: ${settings.bankName}`, 14, yPos)
      yPos += 4
    }
    if (settings.bankAccount) {
      doc.text(`No. Rekening: ${settings.bankAccount}`, 14, yPos)
      yPos += 4
    }
    if (settings.bankAccountName) {
      doc.text(`Atas Nama: ${settings.bankAccountName}`, 14, yPos)
      yPos += 4
    }
  }

  doc.setFontSize(7)
  doc.text(formatDateTime(new Date().toISOString()), 14, yPos + 2)

  // Middle column - Item info
  const footerMidCol = 90
  const footerY = (doc as any).lastAutoTable.finalY + 13
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Jml Item', footerMidCol, footerY)
  doc.text(':', footerMidCol + 22, footerY)
  doc.text(items_arr.length.toString(), footerMidCol + 30, footerY)

  doc.text('Metode Bayar', footerMidCol, footerY + 5)
  doc.text(':', footerMidCol + 22, footerY + 5)
  doc.text(payment.method || '-', footerMidCol + 30, footerY + 5)

  doc.text('Tanggal', footerMidCol, footerY + 10)
  doc.text(':', footerMidCol + 22, footerY + 10)
  doc.text(formatDateIndo(payment.paymentDate), footerMidCol + 30, footerY + 10)

  // Right column - Summary amounts
  const summaryCol = 145
  let summaryY = footerY

  doc.setFontSize(8)
  doc.text('Sub Total', summaryCol, summaryY)
  doc.text(':', summaryCol + 25, summaryY)
  doc.text(formatNumber(subTotal), pageWidth - 14, summaryY, { align: 'right' })
  summaryY += 5

  doc.setFont('helvetica', 'bold')
  doc.text('Total Akhir', summaryCol, summaryY)
  doc.text(':', summaryCol + 25, summaryY)
  doc.text(formatNumber(subTotal), pageWidth - 14, summaryY, { align: 'right' })
  summaryY += 5

  // Dibayar row
  doc.text(`Dibayar (${payment.method}):`, summaryCol, summaryY)
  doc.text(formatNumber(payment.amount), pageWidth - 14, summaryY, { align: 'right' })
  summaryY += 5

  doc.setFont('helvetica', 'normal')
  doc.text('Sisa:', summaryCol, summaryY)
  if (kredit > 0) {
    doc.setTextColor(255, 100, 0)
  }
  doc.text(formatNumber(kredit), pageWidth - 14, summaryY, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  summaryY += 8

  // User signature
  doc.setFont('helvetica', 'normal')
  doc.text(payment.receivedBy || 'ADMIN', pageWidth - 14, summaryY, { align: 'right' })

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}

// Generate Receipt PDF Buffer - Matching frontend design
export const generateReceiptPdfBuffer = async (payment: any, company: any): Promise<Buffer> => {
  const settings = company?.settings || {}
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Load logo
  const logoBase64 = await loadLogoBase64(settings.logo)

  // ===== HEADER SECTION =====
  // Logo on the left
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, yPos - 8, 18, 18)
  }

  // Company info next to logo
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 128, 128)
  doc.text(company?.name || 'OCN CCTV & Networking', 35, yPos - 2)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Tel: ' + (settings.phone || '-'), 35, yPos + 3)
  doc.text(settings.address || '-', 35, yPos + 7)
  doc.text(settings.email || '-', 35, yPos + 11)

  // Right side - Kwitansi No with box
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Kwitansi No :', 120, yPos)

  // Box for payment number
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(155, yPos - 5, 40, 8)
  doc.setFontSize(10)
  doc.setFont('courier', 'bold')
  doc.text(payment.paymentNumber || '-', 175, yPos, { align: 'center' })

  // Payment type badge below
  const typeLabel = getPaymentTypeLabel(payment.type)
  doc.setFillColor(200, 255, 200)
  doc.roundedRect(165, yPos + 5, 20, 6, 1, 1, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 100, 0)
  doc.text(typeLabel, 175, yPos + 9, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  yPos += 25

  // ===== DITERIMA DARI ROW =====
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Diterima dari', 14, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(':', 45, yPos)
  doc.setFont('helvetica', 'bold')
  doc.text(payment.project?.customer?.name || '-', 50, yPos)

  // Right side - Tanggal
  doc.setFont('helvetica', 'normal')
  doc.text('Tanggal', 140, yPos)
  doc.text(':', 160, yPos)
  doc.text(formatDateIndo(payment.paymentDate), 165, yPos)

  yPos += 10

  // ===== JUMLAH UANG =====
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Jumlah Uang :', 14, yPos)
  yPos += 5

  // Large amount box
  doc.setDrawColor(0, 128, 128)
  doc.setLineWidth(0.8)
  doc.rect(14, yPos, pageWidth - 28, 20)

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 128, 128)
  doc.text(`Rp  ${formatNumber(payment.amount)}`, pageWidth / 2, yPos + 13, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  yPos += 28

  // ===== TERBILANG =====
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Terbilang', 14, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(':', 45, yPos)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(0, 128, 128)
  const terbilangText = terbilang(parseFloat(payment.amount || 0)) + ' rupiah'
  doc.text(terbilangText, 50, yPos)
  doc.setTextColor(0, 0, 0)

  yPos += 8

  // Dotted line
  doc.setLineDashPattern([1, 1], 0)
  doc.setLineWidth(0.3)
  doc.line(14, yPos, pageWidth - 14, yPos)
  doc.setLineDashPattern([], 0)
  yPos += 8

  // ===== UNTUK PEMBAYARAN =====
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Untuk Pembayaran', 14, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(':', 50, yPos)
  const paymentDesc = `${getPaymentTypeLabel(payment.type)} - Project ${payment.project?.projectNumber || '-'} (${payment.project?.title || payment.project?.name || '-'})`
  doc.text(paymentDesc, 55, yPos, { maxWidth: 130 })

  yPos += 10

  // Dotted line
  doc.setLineDashPattern([1, 1], 0)
  doc.line(14, yPos, pageWidth - 14, yPos)
  doc.setLineDashPattern([], 0)
  yPos += 10

  // ===== FOOTER - 3 COLUMNS =====
  const items = payment.project?.items || []
  const subTotal = items.reduce(
    (sum: number, item: any) => sum + parseFloat(item.totalPrice || item.subtotal || 0),
    0
  )
  const kredit = Math.max(0, subTotal - parseFloat(payment.amount || 0))

  // Left column - Amount details
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  let leftY = yPos

  doc.text('Total Project', 14, leftY)
  doc.text(': Rp', 45, leftY)
  doc.text(formatNumber(subTotal), 80, leftY, { align: 'right' })
  leftY += 6

  doc.text('Jumlah Dibayar', 14, leftY)
  doc.text(': Rp', 45, leftY)
  doc.setFont('helvetica', 'bold')
  doc.text(formatNumber(payment.amount), 80, leftY, { align: 'right' })
  leftY += 6

  doc.setFont('helvetica', 'normal')
  doc.text('Sisa Pembayaran', 14, leftY)
  doc.text(': Rp', 45, leftY)
  doc.text(formatNumber(kredit), 80, leftY, { align: 'right' })
  leftY += 8

  // Bank Info
  if (settings.bankName || settings.bankAccount) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('Transfer ke:', 14, leftY)
    leftY += 3
    doc.setFont('helvetica', 'normal')
    if (settings.bankName) {
      doc.text(`${settings.bankName}`, 14, leftY)
      leftY += 3
    }
    if (settings.bankAccount) {
      doc.text(`${settings.bankAccount}`, 14, leftY)
      leftY += 3
    }
    if (settings.bankAccountName) {
      doc.text(`a.n. ${settings.bankAccountName}`, 14, leftY)
      leftY += 3
    }
  }

  // Middle column - Payment methods
  const midX = 100
  let midY = yPos
  const methods = ['CASH', 'TRANSFER', 'QRIS', 'CARD']
  const methodLabels = ['Cash', 'Transfer', 'QRIS', 'Kartu Debit/Kredit']

  doc.setFontSize(9)
  methods.forEach((method, idx) => {
    const isSelected = payment.method === method
    if (isSelected) {
      doc.circle(midX, midY, 2, 'F')
    } else {
      doc.circle(midX, midY, 2, 'S')
    }
    doc.text(methodLabels[idx], midX + 5, midY + 1)
    midY += 6
  })

  // Right column - Signature
  const sigX = 165
  let sigY = yPos
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Kerobokan, ${formatDateIndo(payment.paymentDate)}`, sigX, sigY, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // Add signature image if available
  if (settings.signature && settings.signature.startsWith('data:image')) {
    try {
      const gState = new (doc as any).GState({ opacity: 1 })
      doc.setGState(gState)
      doc.addImage(settings.signature, 'PNG', sigX - 20, sigY + 2, 40, 15)
      sigY += 18
    } catch (e) {
      console.error('Error adding signature to receipt:', e)
      sigY += 20
    }
  } else {
    sigY += 20
  }

  doc.setLineWidth(0.3)
  doc.line(sigX - 25, sigY, sigX + 25, sigY)
  sigY += 4
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Authorized Signature', sigX, sigY, { align: 'center' })

  // Add watermark stamp with logo only (30% transparent)
  if (logoBase64) {
    try {
      const stampGState = new (doc as any).GState({ opacity: 0.3 })
      doc.setGState(stampGState)
      const stampX = 130
      const stampY = yPos + 5
      doc.addImage(logoBase64, 'PNG', stampX - 12, stampY, 24, 24)
      const normalGState = new (doc as any).GState({ opacity: 1 })
      doc.setGState(normalGState)
    } catch (e) {
      console.error('Error adding stamp to receipt:', e)
    }
  }

  // Notes if any
  if (payment.notes) {
    yPos = Math.max(leftY, midY, sigY) + 10
    doc.setLineDashPattern([], 0)
    doc.setLineWidth(0.3)
    doc.line(14, yPos - 5, pageWidth - 14, yPos - 5)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Catatan:', 14, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(payment.notes, 35, yPos)
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}
