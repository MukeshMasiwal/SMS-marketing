export type MessageStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED";

export interface SendSmsParams {
  recipient: string;
  message: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  status: MessageStatus;
  provider: string;
  errorMessage?: string;
}

export interface SmsProvider {
  /**
   * Sends an SMS message using the provider.
   * Returns a structured result with the provider's message ID and initial status.
   */
  sendSms(params: SendSmsParams): Promise<SendSmsResult>;

  /**
   * Fetches the latest status of a message directly from the provider.
   * Note: This does NOT read from the local application database.
   */
  getMessageStatus(messageId: string): Promise<MessageStatus>;
}
