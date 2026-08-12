import { ISMSProvider, SMSResult } from "./provider";

export class DummySMSProvider implements ISMSProvider {
  async sendMessage(to: string, body: string): Promise<SMSResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Basic validation
    if (!to || !body) {
      return {
        success: false,
        status: "FAILED",
        error: { code: "VALIDATION_ERROR", message: "Phone number and body are required." },
      };
    }

    // Deterministic test failure numbers
    if (to === "+910000000002") {
      return {
        success: false,
        status: "FAILED",
        error: { code: "SIMULATED_FAILURE", message: "Number is blocked or invalid (simulated)." },
        providerResponse: { details: "Simulated error for test number +910000000002" },
      };
    }

    // Deterministic test success or default success
    const isSpecialSuccess = to === "+910000000001";
    const simulatedMessageId = `msg_dummy_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      success: true,
      status: "SENT",
      providerMessageId: simulatedMessageId,
      providerResponse: {
        info: isSpecialSuccess ? "Simulated special success" : "Simulated standard success",
        deliveredAt: new Date().toISOString(),
      },
    };
  }
}
