import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Campaign } from "@/lib/db/models/Campaign";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    await connectToDatabase();

    const campaign = await Campaign.findOne({ _id: id, userId: auth.session!.userId });
    if (!campaign) return createErrorResponse("Campaign not found", "NOT_FOUND", 404);

    if (campaign.status === "COMPLETED" || campaign.status === "FAILED" || campaign.status === "CANCELLED") {
      return createErrorResponse(`Cannot cancel a campaign in ${campaign.status} status.`, "FORBIDDEN", 403);
    }

    campaign.status = "CANCELLED";
    await campaign.save();

    return createSuccessResponse({ message: "Campaign cancelled.", campaign });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to cancel campaign", "INTERNAL_ERROR", 500);
  }
}
