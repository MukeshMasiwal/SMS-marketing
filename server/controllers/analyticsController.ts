import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth";
import { Contact } from "../../lib/db/models/Contact";
import { Group } from "../../lib/db/models/Group";
import { Campaign } from "../../lib/db/models/Campaign";
import { Message } from "../../lib/db/models/Message";

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totalContacts, totalGroups, totalCampaigns, messageStats] = await Promise.all([
      Contact.countDocuments({ userId: userObjectId }),
      Group.countDocuments({ userId: userObjectId }),
      Campaign.countDocuments({ userId: userObjectId }),
      Message.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    let totalMessages = 0;
    let delivered = 0;
    let failed = 0;
    let sent = 0;
    let queued = 0;

    messageStats.forEach((stat: any) => {
      totalMessages += stat.count;
      if (stat._id === "DELIVERED") delivered = stat.count;
      else if (stat._id === "FAILED") failed = stat.count;
      else if (stat._id === "SENT") sent = stat.count;
      else if (stat._id === "QUEUED") queued = stat.count;
    });

    const deliveryRate = totalMessages > 0 ? Number(((delivered / totalMessages) * 100).toFixed(1)) : 0;

    return res.json({
      success: true,
      contacts: totalContacts,
      groups: totalGroups,
      campaigns: totalCampaigns,
      deliveryRate,
      data: {
        summary: {
          totalContacts,
          totalGroups,
          totalCampaigns,
          totalMessages,
          deliveryRate,
          queued,
          sent,
          delivered,
          failed,
        },
      },
    });
  } catch (err: any) {
    console.error("Analytics error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to load analytics" },
    });
  }
}
