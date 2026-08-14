import nodemailer from "nodemailer";

export interface SmtpConnectionResult {
  connected: boolean;
  error?: string;
}

export function createSmtpTransporter() {
  const host = process.env.SMTP_HOST || "localhost";
  const port = parseInt(process.env.SMTP_PORT || "1025", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === "true";

  const transportOptions: nodemailer.TransportOptions = {
    host,
    port,
    secure,
  } as any;

  // Support both authenticated SMTP (production) and unauthenticated SMTP (Mailpit/MailHog local dev)
  if (user && pass) {
    (transportOptions as any).auth = { user, pass };
  }

  return nodemailer.createTransport(transportOptions);
}

export const smtpTransporter = createSmtpTransporter();

export async function verifySmtpConnection(): Promise<SmtpConnectionResult> {
  try {
    const host = process.env.SMTP_HOST || "localhost";
    const port = process.env.SMTP_PORT || "1025";
    
    // Attempt verification with transporter
    await smtpTransporter.verify();
    console.log(`✅ SMTP server connection successful (${host}:${port})`);
    return { connected: true };
  } catch (err: any) {
    const sanitizedError = err.message || "Unknown SMTP connection error";
    console.warn(`⚠️ SMTP server connection failed (${sanitizedError})`);
    console.warn("⚠️ SMTP email features are currently unavailable.");
    return { connected: false, error: sanitizedError };
  }
}

export async function checkEmailService(): Promise<{ smtp: "connected" | "unavailable" }> {
  try {
    await smtpTransporter.verify();
    return { smtp: "connected" };
  } catch {
    return { smtp: "unavailable" };
  }
}
