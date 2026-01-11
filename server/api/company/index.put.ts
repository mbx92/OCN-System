import { z } from 'zod'

const companySchema = z.object({
  name: z.string().min(1, 'Nama perusahaan wajib diisi'),
  settings: z.object({
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    website: z.string().optional(),
    taxId: z.string().optional(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    bankAccountName: z.string().optional(),
    logo: z.string().optional(),
    signature: z.string().optional(),
    invoicePrefix: z.string().optional(),
    quotationPrefix: z.string().optional(),
    projectPrefix: z.string().optional(),
    purchaseOrderPrefix: z.string().optional(),
    defaultPaymentTerms: z.number().min(0).optional(),
    defaultQuotationValidity: z.number().min(0).optional(),
    businessCashPercentage: z.number().min(0).max(100).optional(),
  }),
})

export default defineEventHandler(async event => {
  const body = await readBody(event)

  const result = companySchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]?.message || 'Data tidak valid',
    })
  }

  console.log(
    '[Company] Updating company settings, logo exists:',
    !!result.data.settings.logo,
    'length:',
    result.data.settings.logo?.length
  )

  // Get existing company or create new
  let company = await prisma.company.findFirst()

  if (company) {
    // Update existing company
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: result.data.name,
        settings: result.data.settings,
      },
    })
  } else {
    // Create new company
    company = await prisma.company.create({
      data: {
        name: result.data.name,
        settings: result.data.settings,
      },
    })
  }

  return company
})
