import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Message } from "@/lib/db/models/Message";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) {
      return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);
    }

    await connectToDatabase();

    const messages = await Message.find({ userId: auth.session!.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return createSuccessResponse({ messages });
  } catch (err: any) {
    console.error("GET /api/messages error:", err);
    return createErrorResponse("Failed to fetch message history", "INTERNAL_ERROR", 500);
  }
}
