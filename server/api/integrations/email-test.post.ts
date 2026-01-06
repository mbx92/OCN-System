import { testEmailConnection, getEmailConfig, sendEmail } from '../../utils/email'

export default defineEventHandler(async event => {
  const body = await readBody(event)

  // If config provided in body, test that config directly
  if (body.config) {
    const result = await testEmailConnection({
      host: body.config.host,
      port: Number(body.config.port) || 587,
      user: body.config.user,
      pass: body.config.pass,
      from: body.config.from || body.config.user,
      secure: body.config.secure ?? false,
    })

    // If test successful and sendTest is true, send a test email
    if (result.success && body.sendTest && body.testEmail) {
      const sendResult = await sendEmail({
        to: body.testEmail,
        subject: 'Test Email dari OCN System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">🎉 Test Email Berhasil!</h2>
            <p>Selamat! Konfigurasi SMTP Anda sudah benar.</p>
            <p>Email ini dikirim dari sistem OCN pada ${new Date().toLocaleString('id-ID')}.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              OCN CCTV & Networking Solutions
            </p>
          </div>
        `,
      })

      return sendResult
    }

    return result
  }

  // Test saved configuration
  const config = await getEmailConfig()
  if (!config) {
    return { success: false, message: 'Email SMTP belum dikonfigurasi' }
  }

  return testEmailConnection(config)
})
