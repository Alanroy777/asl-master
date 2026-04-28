export async function createSmtpTransporter() {
    const nodemailer = await import('nodemailer')
    const port = parseInt(process.env.EMAIL_SERVER_PORT || '587')
    return nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
        },
    })
}

export const OTP_EMAIL_TEMPLATE = (email: string, otp: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your OTP Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#18181b;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">ASL Learning</h1>
              <p style="margin:4px 0 0;color:#a1a1aa;font-size:13px;">American Sign Language Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#18181b;font-size:20px;font-weight:600;">Your password reset OTP</h2>
              <p style="margin:0 0 28px;color:#71717a;font-size:14px;line-height:1.6;">
                Use the code below to reset the password for <strong style="color:#18181b;">\${email}</strong>.
              </p>
              <!-- OTP Box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#f4f4f5;border:2px dashed #d4d4d8;border-radius:12px;padding:20px 40px;text-align:center;">
                    <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#18181b;font-family:monospace;">\${otp}</span>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 20px;"/>
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
                ⏱ This OTP expires in <strong>10 minutes</strong>.<br/>
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #f0f0f0;">
              <p style="margin:0;color:#a1a1aa;font-size:11px;">
                &copy; \${new Date().getFullYear()} ASL Learning Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
