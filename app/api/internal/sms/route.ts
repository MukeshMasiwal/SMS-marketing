import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Message } from "@/lib/db/models/Message";
import { SendSmsSchema } from "@/lib/validations/sms";
import { getSmsProvider } from "@/lib/providers/sms";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json();
    const validatedData = SendSmsSchema.safeParse(body);
    
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const { recipient, message: messageContent } = validatedData.data;

    // 1. Get the configured SMS provider (e.g. Dummy)
    const provider = getSmsProvider();

    // 2. Call the provider to send the SMS
    // The provider only handles simulation/network, it doesn't touch the DB.
    const result = await provider.sendSms({ recipient, message: messageContent });

    // 3. Connect to DB and save the Message log
    await connectToDatabase();

    await Message.create({
      messageId: result.messageId || `failed_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: auth.session!.userId,
      campaignId: undefined, // Internal testing endpoint doesn't link to a campaign yet
      recipient,
      message: messageContent,
      status: result.status,
      provider: result.provider,
      errorMessage: result.errorMessage,
    });

    // 4. Return the provider's result to the client
    return createSuccessResponse({ result }, 201);
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to process internal SMS request", "INTERNAL_ERROR", 500);
  }
}
