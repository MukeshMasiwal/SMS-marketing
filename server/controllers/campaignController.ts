import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { CampaignSchema } from "../validators/campaignValidator";
import {
  createCampaignDraft,
  getUserCampaigns,
  getCampaignById,
  updateCampaignDraft,
  deleteCampaignById,
} from "../services/campaignService";

export async function createCampaign(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const validated = CampaignSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validated.error.issues[0].message,
        },
      });
    }

    const campaign = await createCampaignDraft(userId, validated.data);
    return res.status(201).json({ success: true, campaign, data: { campaign } });
  } catch (err: any) {
    console.error("Error creating campaign:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to create campaign" },
    });
  }
}

export async function getCampaigns(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const search = req.query.search ? String(req.query.search) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;

    const campaigns = await getUserCampaigns(userId, { search, status });
    return res.json({ success: true, campaigns, data: { campaigns } });
  } catch (err: any) {
    console.error("Error fetching campaigns:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to fetch campaigns" },
    });
  }
}

export async function getCampaign(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const campaign = await getCampaignById(req.params.id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Campaign not found" },
      });
    }

    return res.json({ success: true, campaign, data: { campaign } });
  } catch (err: any) {
    console.error("Error fetching campaign:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to fetch campaign" },
    });
  }
}

export async function updateCampaign(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const validated = CampaignSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validated.error.issues[0].message,
        },
      });
    }

    const campaign = await updateCampaignDraft(req.params.id, userId, validated.data);
    return res.json({ success: true, campaign, data: { campaign } });
  } catch (err: any) {
    const status =
      err.message === "Campaign not found"
        ? 404
        : err.message.includes("Only draft")
        ? 403
        : 500;
    return res.status(status).json({
      success: false,
      error: { code: "CAMPAIGN_ERROR", message: err.message || "Failed to update campaign" },
    });
  }
}

export async function deleteCampaign(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    await deleteCampaignById(req.params.id, userId);
    return res.json({ success: true, message: "Campaign deleted successfully" });
  } catch (err: any) {
    const status =
      err.message === "Campaign not found"
        ? 404
        : err.message.includes("actively sending")
        ? 409
        : err.message.includes("Invalid")
        ? 400
        : 500;
    return res.status(status).json({
      success: false,
      error: { code: "CAMPAIGN_DELETE_ERROR", message: err.message || "Failed to delete campaign" },
    });
  }
}
