import { smtpTransporter } from "../config/email";

export async function sendVerificationOtpEmail(
  toEmail: string,
  userName: string,
  otp: string,
  expiresMinutes: number = 10
): Promise<void> {
  const from = process.env.SMTP_FROM || `"SMS Marketing" <no-reply@smsmarketing.com>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 700; color: #ffffff; margin: 0; }
          .subtitle { font-size: 14px; color: #a1a1aa; margin-top: 4px; }
          .otp-box { background-color: #09090b; border: 1px solid #3f3f46; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #6366f1; }
          .info { font-size: 14px; color: #d4d4d8; line-height: 1.6; }
          .warning { font-size: 12px; color: #71717a; margin-top: 24px; border-top: 1px solid #27272a; padding-top: 16px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="title">SMS Marketing Platform</h1>
            <p class="subtitle">Email Verification Code</p>
          </div>
          <p class="info">Hello <strong>${userName}</strong>,</p>
          <p class="info">Thank you for registering with SMS Marketing. Your 6-digit verification code is:</p>
          
          <div class="otp-box">${otp}</div>
          
          <p class="info">This code expires in <strong>${expiresMinutes} minutes</strong>. If you did not create an account, you can safely ignore this email.</p>
          
          <div class="warning">
            For your security, do not share this code with anyone.
          </div>
        </div>
      </body>
    </html>
  `;

  await smtpTransporter.sendMail({
    from,
    to: toEmail,
    subject: "Verify your SMS Marketing account",
    html,
  });
}

export async function sendPasswordResetOtpEmail(
  toEmail: string,
  userName: string,
  otp: string,
  expiresMinutes: number = 10
): Promise<void> {
  const from = process.env.SMTP_FROM || `"SMS Marketing" <no-reply@smsmarketing.com>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 700; color: #ffffff; margin: 0; }
          .subtitle { font-size: 14px; color: #a1a1aa; margin-top: 4px; }
          .otp-box { background-color: #09090b; border: 1px solid #3f3f46; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #ef4444; }
          .info { font-size: 14px; color: #d4d4d8; line-height: 1.6; }
          .warning { font-size: 12px; color: #71717a; margin-top: 24px; border-top: 1px solid #27272a; padding-top: 16px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="title">SMS Marketing Platform</h1>
            <p class="subtitle">Password Reset Request</p>
          </div>
          <p class="info">Hello <strong>${userName}</strong>,</p>
          <p class="info">Your password reset code is:</p>
          
          <div class="otp-box">${otp}</div>
          
          <p class="info">This code expires in <strong>${expiresMinutes} minutes</strong>. If you did not request a password reset, ignore this email and consider changing your password if you suspect unauthorized access.</p>
          
          <div class="warning">
            Never share this code with anyone. SMS Marketing staff will never ask for your OTP.
          </div>
        </div>
      </body>
    </html>
  `;

  await smtpTransporter.sendMail({
    from,
    to: toEmail,
    subject: "Reset your SMS Marketing password",
    html,
  });
}
