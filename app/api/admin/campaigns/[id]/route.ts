import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Campaign } from "@/lib/db/models/Campaign";
import { Message } from "@/lib/db/models/Message";
import mongoose from "mongoose";
import "@/lib/db/models/User"; // Ensure User model is registered for populate

export async function GET(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }
    
    await connectToDatabase();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: { message: "Invalid campaign ID" } }, { status: 400 });
    }
    
    const campaignId = new mongoose.Types.ObjectId(id);
    
    const campaign = await Campaign.findById(campaignId).populate("userId", "name email");
    if (!campaign) {
      return NextResponse.json({ success: false, error: { message: "Campaign not found" } }, { status: 404 });
    }

    const messageStatsAgg = await Message.aggregate([
      { $match: { campaignId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    let totalMessages = 0;
    let delivered = 0;
    let failed = 0;
    let sent = 0;
    let queued = 0;
    
    messageStatsAgg.forEach((stat: any) => {
      totalMessages += stat.count;
      if (stat._id === "DELIVERED") delivered = stat.count;
      else if (stat._id === "FAILED") failed = stat.count;
      else if (stat._id === "SENT") sent = stat.count;
      else if (stat._id === "QUEUED") queued = stat.count;
    });
    
    const deliveryRate = totalMessages > 0 ? Math.round((delivered / totalMessages) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        stats: {
          totalMessages,
          delivered,
          failed,
          queued,
          sent,
          deliveryRate
        }
      }
    });
  } catch (error: any) {
    console.error("Admin campaign detail error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load campaign details" } },
      { status: 500 }
    );
  }
}
