import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Message } from "@/lib/db/models/Message";
import { SendSmsSchema, normalizeIndianPhoneNumber } from "@/lib/validations/sms";
import { getSmsProvider } from "@/lib/providers/sms";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json().catch(() => null);
    if (!body) return createErrorResponse("Invalid JSON body", "VALIDATION_ERROR", 400);

    const validatedData = SendSmsSchema.safeParse(body);
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const { recipient, message: messageContent } = validatedData.data;

    const normalizedPhone = normalizeIndianPhoneNumber(recipient);
    if (!normalizedPhone) {
      return createErrorResponse("Invalid Indian phone number format.", "VALIDATION_ERROR", 400);
    }

    const provider = getSmsProvider();
    const result = await provider.sendSms({ recipient: normalizedPhone, message: messageContent });

    await connectToDatabase();

    await Message.create({
      messageId: result.messageId || `exotel_fail_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: auth.session!.userId,
      campaignId: undefined,
      recipient: normalizedPhone,
      message: messageContent,
      status: result.status,
      provider: "exotel",
      errorMessage: result.errorMessage,
    });

    if (!result.success) {
      return createErrorResponse(result.errorMessage || "Exotel SMS failed", "EXOTEL_SEND_FAILED", 400);
    }

    return createSuccessResponse({ result }, 201);
  } catch (err) {
    console.error("Internal SMS Route Error:", err);
    return createErrorResponse("Failed to process SMS request", "INTERNAL_ERROR", 500);
  }
}
