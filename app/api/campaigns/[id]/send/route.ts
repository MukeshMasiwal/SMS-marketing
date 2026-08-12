import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Campaign } from "@/lib/db/models/Campaign";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";
import { executeCampaign } from "@/lib/services/campaign-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    await connectToDatabase();

    const campaign = await Campaign.findOne({ _id: id, userId: auth.session!.userId });
    if (!campaign) return createErrorResponse("Campaign not found", "NOT_FOUND", 404);

    if (campaign.status !== "DRAFT") {
      return createErrorResponse("Only DRAFT campaigns can be sent.", "FORBIDDEN", 403);
    }

    // In a real production system with massive campaigns, we would push to a queue here.
    // For this MVP, we execute synchronously but asynchronously await it without blocking 
    // the HTTP response (or we block and wait depending on MVP limitations).
    // The user requested: "The current MVP does NOT have a real background job system. 
    // Therefore campaign execution happens within the server execution context."
    // We will await the execution here so the client knows it finished (for small datasets).
    
    await executeCampaign(id, auth.session!.userId);

    // Fetch the final state
    const finalCampaign = await Campaign.findById(id);

    return createSuccessResponse({ message: "Campaign executed.", campaign: finalCampaign });
  } catch (err: any) {
    console.error("Execute campaign error:", err);
    
    if (err.message === "INSUFFICIENT_SMS_QUOTA") {
      return createErrorResponse("You do not have enough SMS quota to send this campaign.", "INSUFFICIENT_SMS_QUOTA", 403);
    }
    
    if (err.message === "No SMS package is assigned to this account.") {
      return createErrorResponse(err.message, "NO_PACKAGE_ASSIGNED", 403);
    }

    return createErrorResponse(err.message || "Failed to execute campaign", "INTERNAL_ERROR", 500);
  }
}
