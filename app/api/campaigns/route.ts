import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Campaign } from "@/lib/db/models/Campaign";
import { CampaignSchema } from "@/lib/validations/campaign";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";
import { resolveCampaignRecipients } from "@/lib/services/campaign-service";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    await connectToDatabase();

    const campaigns = await Campaign.find({ userId: auth.session!.userId })
      .select("name status recipientCount targetType createdAt scheduledAt")
      .sort({ createdAt: -1 });

    return createSuccessResponse({ campaigns });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to fetch campaigns", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json();
    const validatedData = CampaignSchema.safeParse(body);
    
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    await connectToDatabase();

    // Verify ownership and calculate preview count
    let previewCount = 0;
    try {
      const recipients = await resolveCampaignRecipients(validatedData.data as any, auth.session!.userId);
      previewCount = recipients.length;
    } catch (resolveErr: any) {
      return createErrorResponse(resolveErr.message, "UNAUTHORIZED", 403);
    }

    const campaign = await Campaign.create({
      userId: auth.session!.userId,
      ...validatedData.data,
      recipientCount: previewCount,
      status: "DRAFT",
    });

    return createSuccessResponse({ campaign }, 201);
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to create campaign", "INTERNAL_ERROR", 500);
  }
}
