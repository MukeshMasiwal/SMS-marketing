import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Message } from "@/lib/db/models/Message";
import { ExotelSendSmsSchema, normalizeIndianPhoneNumber } from "@/lib/validations/sms";
import { getSmsProvider } from "@/lib/providers/sms";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce authentication
    const auth = await requireAuth(req);
    if (auth.error) {
      return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);
    }

    // 2. Parse and validate JSON request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return createErrorResponse("Invalid JSON payload", "VALIDATION_ERROR", 400);
    }

    const validatedData = ExotelSendSmsSchema.safeParse(body);
    if (!validatedData.success) {
      const issue = validatedData.error.issues[0];
      return createErrorResponse(issue?.message || "Invalid input parameters", "VALIDATION_ERROR", 400);
    }

    const { to, message: messageContent } = validatedData.data;

    // 3. Normalize Indian phone number (+91XXXXXXXXXX)
    const normalizedPhone = normalizeIndianPhoneNumber(to);
    if (!normalizedPhone) {
      return createErrorResponse(
        "Invalid Indian phone number format. Must be a 10-digit Indian mobile number (e.g. +919876543210).",
        "VALIDATION_ERROR",
        400
      );
    }

    // 4. Send SMS via Exotel SMS Provider
    const provider = getSmsProvider();
    const result = await provider.sendSms({ recipient: normalizedPhone, message: messageContent });

    // 5. Connect to MongoDB and save Message log
    await connectToDatabase();

    const msgLog = await Message.create({
      messageId: result.messageId || `exotel_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: auth.session!.userId,
      campaignId: undefined,
      recipient: normalizedPhone,
      message: messageContent,
      status: result.status,
      provider: "exotel",
      errorMessage: result.errorMessage,
    });

    if (!result.success) {
      return createErrorResponse(
        result.errorMessage || "Exotel rejected the SMS request.",
        "EXOTEL_SEND_FAILED",
        400
      );
    }

    // 6. Return success response to browser
    return createSuccessResponse(
      {
        success: true,
        provider: "exotel",
        message: "SMS accepted by Exotel",
        messageId: result.messageId,
        status: result.status,
        log: {
          id: msgLog._id,
          recipient: msgLog.recipient,
          status: msgLog.status,
          createdAt: msgLog.createdAt,
        },
      },
      201
    );
  } catch (err: any) {
    console.error("Error in /api/sms/exotel/send:", err);
    return createErrorResponse(
      err.message || "Failed to process Exotel SMS send request",
      "INTERNAL_ERROR",
      500
    );
  }
}
