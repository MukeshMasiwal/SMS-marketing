import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Campaign } from "@/lib/db/models/Campaign";
import { Message } from "@/lib/db/models/Message";
import { CampaignSchema } from "@/lib/validations/campaign";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";
import { resolveCampaignRecipients } from "@/lib/services/campaign-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    await connectToDatabase();

    const campaign = await Campaign.findOne({ _id: id, userId: auth.session!.userId })
      .populate("targetGroupIds", "name")
      .populate("targetContactIds", "name phone");

    if (!campaign) {
      return createErrorResponse("Campaign not found", "NOT_FOUND", 404);
    }

    // Get statistics from Message collection if sent
    const messages = await Message.find({ campaignId: campaign._id }).select("status recipient errorMessage createdAt");

    return createSuccessResponse({ campaign, messages });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to fetch campaign", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json();
    const validatedData = CampaignSchema.safeParse(body);
    
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    await connectToDatabase();

    const campaign = await Campaign.findOne({ _id: id, userId: auth.session!.userId });
    if (!campaign) return createErrorResponse("Campaign not found", "NOT_FOUND", 404);

    if (campaign.status !== "DRAFT") {
      return createErrorResponse("Only DRAFT campaigns can be edited.", "FORBIDDEN", 403);
    }

    // Resolve again to recalculate preview count and verify ownership of new targets
    let previewCount = 0;
    try {
      const recipients = await resolveCampaignRecipients(validatedData.data as any, auth.session!.userId);
      previewCount = recipients.length;
    } catch (resolveErr: any) {
      return createErrorResponse(resolveErr.message, "UNAUTHORIZED", 403);
    }

    // Update
    campaign.name = validatedData.data.name;
    campaign.message = validatedData.data.message;
    campaign.targetType = validatedData.data.targetType;
    campaign.targetGroupIds = validatedData.data.targetGroupIds as any;
    campaign.targetContactIds = validatedData.data.targetContactIds as any;
    campaign.recipientCount = previewCount;

    await campaign.save();

    return createSuccessResponse({ campaign });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to update campaign", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    await connectToDatabase();

    const campaign = await Campaign.findOne({ _id: id, userId: auth.session!.userId });
    if (!campaign) return createErrorResponse("Campaign not found", "NOT_FOUND", 404);

    if (campaign.status !== "DRAFT") {
      return createErrorResponse("Only DRAFT campaigns can be deleted.", "FORBIDDEN", 403);
    }

    await campaign.deleteOne();

    return createSuccessResponse({ message: "Campaign deleted successfully" });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to delete campaign", "INTERNAL_ERROR", 500);
  }
}
