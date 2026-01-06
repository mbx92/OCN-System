import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
  secure?: boolean
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

// Get email config from database or environment
export async function getEmailConfig(): Promise<EmailConfig | null> {
  const setting = await prisma.integrationSetting.findUnique({
    where: { name: 'email' },
  })

  if (setting?.enabled && setting.config) {
    const config = setting.config as any
    if (config.host && config.user && config.pass) {
      return {
        host: config.host,
        port: Number(config.port) || 587,
        user: config.user,
        pass: config.pass,
        from: config.from || config.user,
        secure: config.secure ?? false,
      }
    }
  }

  // Fallback to environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      secure: process.env.SMTP_SECURE === 'true',
    }
  }

  return null
}

// Create transporter based on config
function createTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })
}

// Send email
export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; message: string }> {
  const config = await getEmailConfig()

  if (!config) {
    return { success: false, message: 'Email belum dikonfigurasi' }
  }

  try {
    const transporter = createTransporter(config)

    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    })

    return { success: true, message: 'Email berhasil dikirim' }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, message: error.message || 'Gagal mengirim email' }
  }
}

// Test email connection
export async function testEmailConnection(
  config: EmailConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter(config)
    await transporter.verify()
    return { success: true, message: 'Koneksi SMTP berhasil' }
  } catch (error: any) {
    console.error('SMTP connection test error:', error)
    return { success: false, message: error.message || 'Gagal terhubung ke SMTP server' }
  }
}

// Send invoice email
export async function sendInvoiceEmail(
  to: string,
  invoiceData: {
    invoiceNumber: string
    customerName: string
    amount: string
    dueDate: string
  }
): Promise<{ success: boolean; message: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">OCN System - Invoice</h2>
      <p>Yth. ${invoiceData.customerName},</p>
      <p>Berikut adalah invoice untuk Anda:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f3f4f6;">
          <td style="padding: 10px; border: 1px solid #e5e7eb;">No. Invoice</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${invoiceData.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">Total</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${invoiceData.amount}</td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 10px; border: 1px solid #e5e7eb;">Jatuh Tempo</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${invoiceData.dueDate}</td>
        </tr>
      </table>
      <p>Terima kasih atas kepercayaan Anda.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        OCN CCTV & Networking Solutions<br>
        Email ini dikirim secara otomatis dari sistem OCN.
      </p>
    </div>
  `

  return sendEmail({
    to,
    subject: `Invoice ${invoiceData.invoiceNumber} - OCN System`,
    html,
  })
}
