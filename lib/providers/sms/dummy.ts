import { randomUUID } from "crypto";
import { SmsProvider, SendSmsParams, SendSmsResult, MessageStatus } from "./types";

export class DummySmsProvider implements SmsProvider {
  
  // A simple in-memory map to track simulated statuses for getMessageStatus() testing
  private simulatedStatuses = new Map<string, MessageStatus>();

  async sendSms(params: SendSmsParams): Promise<SendSmsResult> {
    // 1. Validate basic input
    if (!params.recipient || !params.message) {
      return {
        success: false,
        status: "FAILED",
        provider: "dummy",
        errorMessage: "Recipient and message are required.",
      };
    }

    // 2. Generate a unique provider message ID
    const messageId = `dummy_${randomUUID()}`;

    // 3. Simulate a small network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 4. Deterministic behaviour based on recipient number
    // +910000000002 -> FAILED
    // +910000000003 -> SENT (stays stuck in sent)
    // Any other valid number -> QUEUED (progresses to DELIVERED)
    let initialStatus: MessageStatus = "QUEUED";
    let finalStatus: MessageStatus = "DELIVERED";
    let success = true;
    let errorMessage: string | undefined = undefined;

    if (params.recipient === "+910000000002") {
      initialStatus = "FAILED";
      finalStatus = "FAILED";
      success = false;
      errorMessage = "Simulated provider failure for test number.";
    } else if (params.recipient === "+910000000003") {
      initialStatus = "SENT";
      finalStatus = "SENT";
    }

    // Record the status so getMessageStatus can simulate progression
    // In a real dummy provider, we could schedule a timeout to transition QUEUED -> SENT -> DELIVERED
    this.simulatedStatuses.set(messageId, finalStatus);

    // 5. Return structured result
    return {
      success,
      messageId,
      status: initialStatus,
      provider: "dummy",
      errorMessage,
    };
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    // Simulate a network call
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return the final derived status, or FAILED if the ID doesn't exist
    return this.simulatedStatuses.get(messageId) || "FAILED";
  }
}
