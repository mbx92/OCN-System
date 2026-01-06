import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const usePdfGenerator = () => {
  const generating = ref(false)

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

  // Fetch company settings
  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/company')
      if (response.ok) {
        return await response.json()
      }
      return null
    } catch {
      return null
    }
  }

  // Load logo image as base64 - can use company logo or default
  const loadLogoBase64 = async (companyLogo?: string): Promise<string | null> => {
    try {
      // If company has a logo (base64 or URL), use it
      if (companyLogo) {
        if (companyLogo.startsWith('data:image')) {
          return companyLogo
        }
        // It's a URL, fetch it
        const response = await fetch(companyLogo)
        const blob = await response.blob()
        return new Promise(resolve => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = () => resolve(null)
          reader.readAsDataURL(blob)
        })
      }
      // Fallback to default logo
      const response = await fetch('/logo.png')
      const blob = await response.blob()
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  // Generate Invoice PDF matching desired layout
  const downloadInvoicePdf = async (payment: any, filename: string) => {
    generating.value = true

    try {
      // Fetch company settings
      const company = await fetchCompanySettings()
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
        item.name || '-',
        item.quantity?.toString() || '0',
        item.unit || '-',
        formatNumber(item.price),
        formatNumber(item.totalPrice),
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
          1: { font: 'courier', fontSize: 7 },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'right', font: 'courier' },
          6: { halign: 'right', font: 'courier' },
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
        (sum: number, item: any) => sum + parseFloat(item.totalPrice || 0),
        0
      )
      const kredit = Math.max(0, subTotal - parseFloat(payment.amount || 0))

      // Left column - Keterangan & Signatures
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Keterangan :', 14, yPos)
      const keteranganY = yPos
      yPos += 8

      doc.setFont('helvetica', 'normal')
      doc.text('Hormat Kami', 14, yPos)
      doc.text('Penerima', 50, yPos)
      const signatureStartY = yPos

      // Debug: log settings
      console.log('Company settings:', settings)
      console.log('Signature exists:', !!settings.signature)
      console.log('Signature length:', settings.signature?.length)

      // Add signature image if available
      if (settings.signature && settings.signature.startsWith('data:image')) {
        try {
          // Reset opacity to full for signature
          const gState = new (doc as any).GState({ opacity: 1 })
          doc.setGState(gState)
          doc.addImage(settings.signature, 'PNG', 8, yPos + 1, 35, 14)
          console.log('Signature added successfully')
        } catch (e) {
          console.error('Error adding signature:', e)
        }
      }

      // Add watermark stamp with logo only (30% transparent)
      if (logoBase64) {
        try {
          // Set 30% transparency for stamp
          const stampGState = new (doc as any).GState({ opacity: 0.3 })
          doc.setGState(stampGState)

          // Add logo as stamp (larger, centered between signatures)
          const stampX = 32
          const stampY = yPos + 2
          doc.addImage(logoBase64, 'PNG', stampX - 10, stampY, 20, 20)

          // Reset opacity
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

      // Dibayar row (no highlight)
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

      // Save PDF
      doc.save(`${filename}.pdf`)
    } catch (error) {
      console.error('Error generating Invoice PDF:', error)
      throw error
    } finally {
      generating.value = false
    }
  }

  // Generate Receipt/Kwitansi PDF matching desired layout
  const downloadReceiptPdf = async (payment: any, filename: string) => {
    generating.value = true

    try {
      // Fetch company settings
      const company = await fetchCompanySettings()
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
      const paymentDesc = `${getPaymentTypeLabel(payment.type)} - Project ${payment.project?.projectNumber || '-'} (${payment.project?.title || '-'})`
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
        (sum: number, item: any) => sum + parseFloat(item.totalPrice || 0),
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
          // Set 30% transparency for stamp
          const stampGState = new (doc as any).GState({ opacity: 0.3 })
          doc.setGState(stampGState)

          // Add logo as stamp
          const stampX = 130
          const stampY = yPos + 5
          doc.addImage(logoBase64, 'PNG', stampX - 12, stampY, 24, 24)

          // Reset opacity
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

      // Save PDF
      doc.save(`${filename}.pdf`)
    } catch (error) {
      console.error('Error generating Receipt PDF:', error)
      throw error
    } finally {
      generating.value = false
    }
  }

  // Generate Report PDF - Generic report generator
  const downloadReportPdf = async (options: {
    title: string
    subtitle?: string
    period?: string
    summary?: { label: string; value: string }[]
    columns: {
      header: string
      key: string
      align?: 'left' | 'center' | 'right'
      format?: (val: any) => string
    }[]
    data: any[]
    filename: string
  }) => {
    generating.value = true

    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 15

      // Load logo
      const logoBase64 = await loadLogoBase64()

      // ===== HEADER SECTION =====
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, yPos - 5, 15, 15)
      }

      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 128, 128)
      doc.text(options.title, logoBase64 ? 32 : 14, yPos + 2)

      // Subtitle
      if (options.subtitle) {
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(options.subtitle, logoBase64 ? 32 : 14, yPos + 8)
      }

      // Period
      if (options.period) {
        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Periode: ${options.period}`,
          logoBase64 ? 32 : 14,
          yPos + (options.subtitle ? 14 : 8)
        )
      }

      // Print date on the right
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Dicetak: ${formatDateTime(new Date().toISOString())}`, pageWidth - 14, yPos, {
        align: 'right',
      })

      yPos += 25

      // ===== SUMMARY SECTION =====
      if (options.summary && options.summary.length > 0) {
        doc.setFillColor(245, 245, 245)
        doc.roundedRect(
          14,
          yPos - 5,
          pageWidth - 28,
          8 + Math.ceil(options.summary.length / 4) * 12,
          2,
          2,
          'F'
        )

        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)

        const cols = 4
        const colWidth = (pageWidth - 28) / cols
        options.summary.forEach((item, idx) => {
          const col = idx % cols
          const row = Math.floor(idx / cols)
          const x = 18 + col * colWidth
          const y = yPos + row * 12

          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 100, 100)
          doc.text(item.label, x, y)

          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0)
          doc.text(item.value, x, y + 5)
        })

        yPos += 8 + Math.ceil(options.summary.length / 4) * 12 + 5
      }

      // ===== DATA TABLE =====
      const headers = options.columns.map(col => col.header)
      const body = options.data.map(row =>
        options.columns.map(col => {
          const val = row[col.key]
          return col.format ? col.format(val) : String(val ?? '-')
        })
      )

      const columnStyles: Record<number, any> = {}
      options.columns.forEach((col, idx) => {
        if (col.align) {
          columnStyles[idx] = { halign: col.align }
        }
      })

      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: body,
        headStyles: {
          fillColor: [0, 128, 128],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        columnStyles,
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        margin: { left: 14, right: 14 },
        styles: {
          overflow: 'linebreak',
          cellPadding: 2,
        },
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      // Save PDF
      doc.save(`${options.filename}.pdf`)
    } catch (error) {
      console.error('Error generating Report PDF:', error)
      throw error
    } finally {
      generating.value = false
    }
  }

  // Legacy function for compatibility (uses html2canvas approach)
  const downloadPdf = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error('Element not found:', elementId)
      return
    }

    generating.value = true

    try {
      // Dynamic import html2canvas only when needed for legacy support
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')

      const margin = 5
      const contentWidth = imgWidth - margin * 2
      const scaledHeight = imgHeight * (contentWidth / imgWidth)

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, scaledHeight)

      if (scaledHeight > pageHeight - margin * 2) {
        let heightLeft = scaledHeight - (pageHeight - margin * 2)
        let position = -(pageHeight - margin * 2) + margin

        while (heightLeft > 0) {
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', margin, position, contentWidth, scaledHeight)
          heightLeft -= pageHeight - margin * 2
          position -= pageHeight - margin * 2
        }
      }

      pdf.save(`${filename}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    } finally {
      generating.value = false
    }
  }

  // Generate Quotation PDF using template settings
  const downloadQuotationPdf = async (quotation: any, filename: string) => {
    generating.value = true

    try {
      // Fetch company settings
      const company = await fetchCompanySettings()
      const settings = company?.settings || {}
      const template = settings.quotationTemplate || {
        headerText: 'SURAT PENAWARAN',
        openingText:
          'Dengan hormat, bersama ini kami mengajukan penawaran harga untuk pekerjaan sebagai berikut:',
        closingText:
          'Demikian penawaran ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.',
        termsText: '1. Harga berlaku 14 hari\n2. Pembayaran DP 50%\n3. Garansi 1 tahun',
        showLogo: true,
        showSignature: true,
        accentColor: '#1e40af',
      }

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 15

      // Parse accent color to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 30, g: 64, b: 175 }
      }
      const accentRgb = hexToRgb(template.accentColor || '#1e40af')

      // Load logo
      const logoBase64 = template.showLogo ? await loadLogoBase64(settings.logo) : null

      // ===== HEADER SECTION =====
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, yPos - 5, 18, 18)
      }

      // Company info
      const headerX = logoBase64 ? 35 : 14
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b)
      doc.text(company?.name || 'OCN CCTV & Networking Solutions', headerX, yPos)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(settings.address || '-', headerX, yPos + 5)
      doc.text(`Tel: ${settings.phone || '-'} | Email: ${settings.email || '-'}`, headerX, yPos + 9)

      yPos += 18

      // ===== TITLE SECTION =====
      // Accent line
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
      doc.setLineWidth(1)
      doc.line(14, yPos, pageWidth - 14, yPos)
      yPos += 8

      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b)
      doc.text(template.headerText || 'SURAT PENAWARAN', pageWidth / 2, yPos, { align: 'center' })
      yPos += 8

      // Quotation number and date
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(`No: ${quotation.quotationNo}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 5
      doc.setFontSize(9)
      doc.text(`Tanggal: ${formatDateIndo(quotation.createdAt)}`, pageWidth / 2, yPos, {
        align: 'center',
      })
      yPos += 10

      // ===== CUSTOMER INFO =====
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Kepada Yth.', 14, yPos)
      yPos += 5
      doc.setFont('helvetica', 'normal')
      doc.text(quotation.customer?.name || '-', 14, yPos)
      yPos += 4
      if (quotation.customer?.companyName) {
        doc.text(quotation.customer.companyName, 14, yPos)
        yPos += 4
      }
      if (quotation.customer?.address) {
        doc.text(quotation.customer.address, 14, yPos, { maxWidth: 80 })
        yPos += 8
      }
      yPos += 5

      // ===== OPENING TEXT =====
      doc.setFontSize(9)
      const openingLines = doc.splitTextToSize(template.openingText || '', pageWidth - 28)
      doc.text(openingLines, 14, yPos)
      yPos += openingLines.length * 4 + 5

      // ===== TITLE IF EXISTS =====
      if (quotation.title) {
        doc.setFont('helvetica', 'bold')
        doc.text(`Perihal: ${quotation.title}`, 14, yPos)
        yPos += 8
      }

      // ===== ITEMS TABLE =====
      const items = quotation.items || []
      const tableBody = items.map((item: any, idx: number) => [
        (idx + 1).toString(),
        item.name || '-',
        `${item.quantity || 0} ${item.unit || 'pcs'}`,
        formatNumber(item.price || 0),
        formatNumber(item.total || item.totalPrice || item.quantity * item.price || 0),
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['No.', 'Uraian / Item', 'Qty', 'Harga Satuan (Rp)', 'Jumlah (Rp)']],
        body: tableBody,
        foot: [
          [
            { content: '', colSpan: 3 },
            { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'right' } },
            {
              content: formatNumber(quotation.totalAmount || 0),
              styles: { fontStyle: 'bold', halign: 'right' },
            },
          ],
        ],
        headStyles: {
          fillColor: [accentRgb.r, accentRgb.g, accentRgb.b],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 9,
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        footStyles: {
          fillColor: [245, 245, 245],
          textColor: [0, 0, 0],
          fontSize: 10,
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { cellWidth: 70 },
          2: { halign: 'center', cellWidth: 25 },
          3: { halign: 'right', font: 'courier', cellWidth: 35 },
          4: { halign: 'right', font: 'courier', cellWidth: 35 },
        },
        margin: { left: 14, right: 14 },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3,
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10

      // ===== TERMS & CONDITIONS =====
      if (template.termsText) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Syarat & Ketentuan:', 14, yPos)
        yPos += 5
        doc.setFont('helvetica', 'normal')
        const termsLines = doc.splitTextToSize(
          template.termsText.replace(/\\n/g, '\n'),
          pageWidth - 28
        )
        doc.text(termsLines, 14, yPos)
        yPos += termsLines.length * 4 + 5
      }

      // ===== VALIDITY =====
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text(`Penawaran berlaku sampai: ${formatDateIndo(quotation.validUntil)}`, 14, yPos)
      yPos += 10

      // ===== CLOSING TEXT =====
      doc.setFont('helvetica', 'normal')
      const closingLines = doc.splitTextToSize(template.closingText || '', pageWidth - 28)
      doc.text(closingLines, 14, yPos)
      yPos += closingLines.length * 4 + 10

      // ===== SIGNATURE SECTION =====
      const sigX = pageWidth - 60
      doc.setFontSize(9)
      doc.text(
        `${settings.city || 'Kerobokan'}, ${formatDateIndo(new Date().toISOString())}`,
        sigX,
        yPos
      )
      yPos += 5
      doc.text('Hormat Kami,', sigX, yPos)

      // Add signature image if available
      if (
        template.showSignature &&
        settings.signature &&
        settings.signature.startsWith('data:image')
      ) {
        try {
          const gState = new (doc as any).GState({ opacity: 1 })
          doc.setGState(gState)
          doc.addImage(settings.signature, 'PNG', sigX - 5, yPos + 2, 40, 15)
          yPos += 20
        } catch (e) {
          console.error('Error adding signature to quotation:', e)
          yPos += 20
        }
      } else {
        yPos += 20
      }

      doc.setFont('helvetica', 'bold')
      doc.text(company?.name || 'OCN System', sigX, yPos)

      // ===== FOOTER =====
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      // Save PDF
      doc.save(`${filename}.pdf`)
    } catch (error) {
      console.error('Error generating Quotation PDF:', error)
      throw error
    } finally {
      generating.value = false
    }
  }

  return {
    generating,
    downloadPdf,
    downloadInvoicePdf,
    downloadReceiptPdf,
    downloadReportPdf,
    downloadQuotationPdf,
  }
}
