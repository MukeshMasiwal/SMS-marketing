export interface SMSResult {
  success: boolean;
  providerMessageId?: string;
  status: "SENT" | "DELIVERED" | "FAILED";
  providerResponse?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  };
}

export interface ISMSProvider {
  sendMessage(to: string, body: string): Promise<SMSResult>;
}
