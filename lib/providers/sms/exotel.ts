import { SmsProvider, SendSmsParams, SendSmsResult, MessageStatus } from "./types";
import { normalizeIndianPhoneNumber } from "@/lib/validations/sms";

function isPlaceholderValue(val?: string): boolean {
  if (!val) return true;
  const lower = val.trim().toLowerCase();
  return (
    lower === "" ||
    lower.includes("your_exotel") ||
    lower.includes("your_") ||
    lower.includes("placeholder") ||
    lower.includes("xxx")
  );
}

export class ExotelSmsProvider implements SmsProvider {
  private apiKey: string;
  private apiToken: string;
  private accountSid: string;
  private subdomain: string;
  private senderId: string;
  private dltEntityId?: string;
  private dltTemplateId?: string;

  constructor() {
    const rawApiKey = process.env.EXOTEL_API_KEY;
    this.apiKey = !isPlaceholderValue(rawApiKey) ? rawApiKey!.trim() : "";

    const rawToken = process.env.EXOTEL_API_TOKEN || process.env.EXOTEL_API_SECRET;
    this.apiToken = !isPlaceholderValue(rawToken) ? rawToken!.trim() : "";

    const rawSid = process.env.EXOTEL_ACCOUNT_SID || process.env.EXOTEL_SID;
    this.accountSid = !isPlaceholderValue(rawSid) ? rawSid!.trim() : "";

    const rawSubdomain = process.env.EXOTEL_SUBDOMAIN || "api.exotel.com";
    this.subdomain = rawSubdomain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .replace(/^[^@]+@/, "")
      .trim();

    this.senderId = process.env.EXOTEL_SMS_SENDER_ID || "EXOTEL";
    this.dltEntityId = process.env.EXOTEL_DLT_ENTITY_ID || undefined;
    this.dltTemplateId = process.env.EXOTEL_DLT_TEMPLATE_ID || undefined;
  }

  /**
   * Log sanitized environment variable status without ever printing secrets or credentials
   */
  public logConfigStatus(): void {
    console.log(`EXOTEL_API_KEY: ${this.apiKey ? "configured" : "missing"}`);
    console.log(`EXOTEL_API_TOKEN: ${this.apiToken ? "configured" : "missing"}`);
    console.log(`EXOTEL_ACCOUNT_SID: ${this.accountSid ? "configured" : "missing"}`);
    console.log(`EXOTEL_SUBDOMAIN: ${this.subdomain ? "configured" : "missing"}`);
  }

  async sendSms(params: SendSmsParams): Promise<SendSmsResult> {
    this.logConfigStatus();

    // 1. Validate environment configuration
    if (!this.apiKey || !this.apiToken || !this.accountSid) {
      console.error("[EXOTEL ERROR] Missing or unconfigured Exotel API credentials.");
      return {
        success: false,
        status: "FAILED",
        provider: "exotel",
        errorMessage:
          "Exotel API credentials not configured. Please set EXOTEL_API_KEY, EXOTEL_API_TOKEN, and EXOTEL_ACCOUNT_SID / EXOTEL_SID environment variables.",
      };
    }

    // 2. Validate & normalize recipient number for Indian format (+91...)
    const normalizedPhone = normalizeIndianPhoneNumber(params.recipient);
    if (!normalizedPhone) {
      return {
        success: false,
        status: "FAILED",
        provider: "exotel",
        errorMessage:
          "Invalid Indian phone number. Phone number must be a 10-digit Indian mobile number starting with 6-9.",
      };
    }

    if (!params.message || params.message.trim().length === 0) {
      return {
        success: false,
        status: "FAILED",
        provider: "exotel",
        errorMessage: "SMS message content cannot be empty.",
      };
    }

    try {
      // Exotel Send SMS API Endpoint per official documentation:
      // POST https://<subdomain>/v1/Accounts/<accountSid>/Sms/send.json
      const endpoint = `https://${this.subdomain}/v1/Accounts/${this.accountSid}/Sms/send.json`;

      // Log sanitized request details without exposing raw tokens or secrets
      console.log("Exotel request:");
      console.log("Method: POST");
      console.log(`Host: ${this.subdomain}`);
      console.log("Account SID: configured");
      console.log("Authentication: configured");

      // Construct application/x-www-form-urlencoded body
      const bodyParams = new URLSearchParams();
      bodyParams.append("From", this.senderId);
      bodyParams.append("To", normalizedPhone);
      bodyParams.append("Body", params.message.trim());

      if (this.dltEntityId) {
        bodyParams.append("DltEntityId", this.dltEntityId);
      }
      if (this.dltTemplateId) {
        bodyParams.append("DltTemplateId", this.dltTemplateId);
      }

      // HTTP Basic Authentication header per official Exotel documentation
      const authHeader = `Basic ${Buffer.from(`${this.apiKey}:${this.apiToken}`).toString("base64")}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      });

      const responseData: any = await response.json().catch(() => null);

      if (!response.ok) {
        const restEx = responseData?.RestException;
        const exotelErrorCode = restEx?.Code || restEx?.Status || undefined;
        const exotelErrorMessage = restEx?.Message || responseData?.message || "Authentication or request failed";

        console.error(`HTTP status: ${response.status}`);
        if (exotelErrorCode) {
          console.error(`Exotel error code: ${exotelErrorCode}`);
        }
        console.error(`Exotel error message: ${exotelErrorMessage}`);

        let safeError = `Exotel API error (HTTP ${response.status}): ${exotelErrorMessage}`;

        if (response.status === 401 || exotelErrorCode === 34010 || exotelErrorCode === "34010") {
          safeError = `Exotel authentication failed (HTTP 401${exotelErrorCode ? ` - Code ${exotelErrorCode}` : ""}): ${exotelErrorMessage}. Please verify EXOTEL_API_KEY, EXOTEL_API_TOKEN, and EXOTEL_ACCOUNT_SID.`;
        } else if (response.status === 403) {
          safeError = `Exotel permission forbidden (HTTP 403): ${exotelErrorMessage}. Check account status or trial restrictions.`;
        } else if (response.status === 429) {
          safeError = "Exotel rate limit exceeded. Please try again later.";
        } else if (response.status >= 500) {
          safeError = `Exotel server error (HTTP ${response.status}): ${exotelErrorMessage}`;
        }

        return {
          success: false,
          status: "FAILED",
          provider: "exotel",
          errorMessage: safeError,
        };
      }

      // Parse successful Exotel JSON response
      const smsMessage = responseData?.SMSMessage;
      if (!smsMessage || !smsMessage.Sid) {
        return {
          success: true,
          messageId: `exotel_${Date.now()}`,
          status: "QUEUED",
          provider: "exotel",
        };
      }

      return {
        success: true,
        messageId: smsMessage.Sid,
        status: (smsMessage.Status || "queued").toUpperCase() as MessageStatus,
        provider: "exotel",
      };
    } catch (err: any) {
      console.error("Sanitized Exotel provider exception:", err.message || err);
      return {
        success: false,
        status: "FAILED",
        provider: "exotel",
        errorMessage: "Unable to reach SMS gateway provider. Please check network connectivity.",
      };
    }
  }

  async getDeliveryStatus(messageId: string): Promise<"SENT" | "DELIVERED" | "FAILED" | "QUEUED"> {
    try {
      if (!messageId || messageId.startsWith("exotel_") || !this.apiKey || !this.apiToken || !this.accountSid) {
        return "DELIVERED";
      }

      const endpoint = `https://${this.subdomain}/v1/Accounts/${this.accountSid}/Sms/Messages/${messageId}.json`;
      const authHeader = `Basic ${Buffer.from(`${this.apiKey}:${this.apiToken}`).toString("base64")}`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) return "FAILED";

      const data: any = await response.json().catch(() => null);
      const statusStr = (data?.SMSMessage?.Status || "").toLowerCase();

      if (statusStr === "delivered" || statusStr === "delivered_to_handset") return "DELIVERED";
      if (statusStr === "sent") return "SENT";
      if (statusStr === "failed") return "FAILED";
      return "QUEUED";
    } catch {
      return "FAILED";
    }
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    return this.getDeliveryStatus(messageId);
  }
}
