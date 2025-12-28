import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export const usePdfGenerator = () => {
  const generating = ref(false)

  const downloadPdf = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error('Element not found:', elementId)
      return
    }

    generating.value = true

    try {
      // Create a hidden iframe to render content without DaisyUI CSS
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:absolute;left:-9999px;width:850px;height:1200px;border:none;'
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Could not access iframe document')
      }

      // Write minimal HTML with inline styles only
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: Arial, Helvetica, sans-serif;
              color: #000000 !important;
            }
            body {
              background: #ffffff;
              padding: 30px;
              font-size: 12px;
              line-height: 1.4;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              padding: 8px 6px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              font-weight: bold;
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
            }
            .font-mono {
              font-family: monospace;
            }
            .font-bold {
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .text-xs {
              font-size: 10px;
            }
            .text-sm {
              font-size: 11px;
            }
            .text-lg {
              font-size: 14px;
            }
            .text-xl {
              font-size: 16px;
            }
            .text-2xl {
              font-size: 20px;
            }
            .text-3xl {
              font-size: 24px;
            }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .mt-2 { margin-top: 8px; }
            .mt-4 { margin-top: 16px; }
            .pt-2 { padding-top: 8px; }
            .pt-4 { padding-top: 16px; }
            .pb-2 { padding-bottom: 8px; }
            .px-2 { padding-left: 8px; padding-right: 8px; }
            .px-4 { padding-left: 16px; padding-right: 16px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .py-4 { padding-top: 16px; padding-bottom: 16px; }
            .gap-2 { gap: 8px; }
            .gap-4 { gap: 16px; }
            .flex { display: flex; }
            .items-start { align-items: flex-start; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .w-full { width: 100%; }
            .border { border: 1px solid #ddd; }
            .border-2 { border: 2px solid #333; }
            .border-b { border-bottom: 1px solid #ddd; }
            .border-b-2 { border-bottom: 2px solid #333; }
            .border-t { border-top: 1px solid #ddd; }
            .border-t-2 { border-top: 2px solid #333; }
            .border-y-2 { border-top: 2px solid #333; border-bottom: 2px solid #333; }
            .rounded { border-radius: 4px; }
            .italic { font-style: italic; }
            img { max-width: 64px; height: auto; }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              font-size: 10px;
              font-weight: bold;
              border: 1px solid #333;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
        </html>
      `)
      iframeDoc.close()

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 300))

      // Capture the iframe body
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
        windowWidth: 800,
      })

      // Remove iframe
      document.body.removeChild(iframe)

      // Calculate dimensions for A4
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')

      // Add image with margin
      const margin = 5
      const contentWidth = imgWidth - margin * 2
      const scaledHeight = imgHeight * (contentWidth / imgWidth)

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, scaledHeight)

      // Handle multi-page if needed
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

      // Download the PDF
      pdf.save(`${filename}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    } finally {
      generating.value = false
    }
  }

  return {
    generating,
    downloadPdf,
  }
}
