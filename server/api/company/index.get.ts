export default defineEventHandler(async () => {
  // Get the first (and only) company record, or create default if not exists
  let company = await prisma.company.findFirst()

  if (!company) {
    // Create default company settings
    company = await prisma.company.create({
      data: {
        name: 'OCN CCTV & Networking Solutions',
        settings: {
          address: '',
          phone: '',
          email: '',
          website: '',
          taxId: '',
          bankName: '',
          bankAccount: '',
          bankAccountName: '',
          logo: '',
          signature: '',
          invoicePrefix: 'INV',
          quotationPrefix: 'QUO',
          projectPrefix: 'PRJ',
          purchaseOrderPrefix: 'PO',
          defaultPaymentTerms: 14,
          defaultQuotationValidity: 30,
          businessCashPercentage: 30,
        },
      },
    })
  }

  const settings = company?.settings as any
  console.log(
    '[Company API] Get company, logo exists:',
    !!settings?.logo,
    'length:',
    settings?.logo?.length
  )

  return company
})
