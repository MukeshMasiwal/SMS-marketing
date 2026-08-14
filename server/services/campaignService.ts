import mongoose from "mongoose";
import { Campaign, ICampaign } from "../models/Campaign";
import { Message } from "../../lib/db/models/Message";
import { getSmsStats } from "../utils/sms";

export interface CreateCampaignDTO {
  name: string;
  message: string;
  targetType?: string;
  targetGroupIds?: string[];
  targetContactIds?: string[];
}

export interface UpdateCampaignDTO {
  name?: string;
  message?: string;
  targetType?: string;
  targetGroupIds?: string[];
  targetContactIds?: string[];
}

export async function createCampaignDraft(
  userId: string,
  data: CreateCampaignDTO
): Promise<ICampaign> {
  const stats = getSmsStats(data.message);

  const campaign = await Campaign.create({
    userId: new mongoose.Types.ObjectId(userId),
    name: data.name,
    message: data.message,
    status: "draft",
    targetType: (data.targetType as any) || "GROUP",
    targetGroupIds: data.targetGroupIds || [],
    targetContactIds: data.targetContactIds || [],
    characterCount: stats.characterCount,
    segmentCount: stats.segmentCount,
    encoding: stats.encoding,
    recipientCount: 0,
  });

  return campaign;
}

export async function getUserCampaigns(
  userId: string,
  options?: { search?: string; status?: string }
): Promise<ICampaign[]> {
  const filter: any = { userId: new mongoose.Types.ObjectId(userId) };

  if (options?.search) {
    filter.name = { $regex: options.search, $options: "i" };
  }

  if (options?.status && options.status !== "ALL" && options.status !== "all") {
    filter.status = options.status.toLowerCase();
  }

  return Campaign.find(filter).sort({ createdAt: -1 });
}

export async function getCampaignById(
  campaignId: string,
  userId: string
): Promise<ICampaign | null> {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    return null;
  }

  return Campaign.findOne({
    _id: campaignId,
    userId: new mongoose.Types.ObjectId(userId),
  });
}

export async function updateCampaignDraft(
  campaignId: string,
  userId: string,
  data: UpdateCampaignDTO
): Promise<ICampaign> {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    throw new Error("Invalid campaign ID");
  }

  const campaign = await Campaign.findOne({
    _id: campaignId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const currentStatus = (campaign.status || "").toLowerCase();
  if (currentStatus !== "draft") {
    throw new Error("Only draft campaigns can be edited");
  }

  if (data.name !== undefined) campaign.name = data.name;
  if (data.message !== undefined) {
    campaign.message = data.message;
    const stats = getSmsStats(data.message);
    campaign.characterCount = stats.characterCount;
    campaign.segmentCount = stats.segmentCount;
    campaign.encoding = stats.encoding;
  }

  if (data.targetType) campaign.targetType = data.targetType as any;
  if (data.targetGroupIds) campaign.targetGroupIds = data.targetGroupIds as any;
  if (data.targetContactIds) campaign.targetContactIds = data.targetContactIds as any;

  await campaign.save();
  return campaign;
}

export async function deleteCampaignById(
  campaignId: string,
  userId: string
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    throw new Error("Invalid campaign ID");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const campaign = await Campaign.findOne({
    _id: campaignId,
    userId: userObjectId,
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const currentStatus = (campaign.status || "").toLowerCase();
  if (currentStatus === "sending") {
    throw new Error("Cannot delete campaign while it is actively sending.");
  }

  // Delete campaign document
  await Campaign.deleteOne({ _id: campaignId, userId: userObjectId });

  // Delete related Message log records
  await Message.deleteMany({ campaignId: campaignId, userId: userObjectId });
}
