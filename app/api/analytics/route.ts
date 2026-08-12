import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Contact } from "@/lib/db/models/Contact";
import { Campaign } from "@/lib/db/models/Campaign";
import { Message } from "@/lib/db/models/Message";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }
    
    await connectToDatabase();
    const userId = auth.session!.userId;

    // 1. Total Contacts
    const totalContacts = await Contact.countDocuments({ userId });
    
    // 2. Total Campaigns
    const totalCampaigns = await Campaign.countDocuments({ userId });
    
    // 3. Message Status Aggregation
    const messageStatsAgg = await Message.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
    
    // Format delivery status for donut chart
    const deliveryStatus = [
      { name: "Delivered", value: delivered },
      { name: "Failed", value: failed },
      { name: "Sent", value: sent },
      { name: "Queued", value: queued }
    ].filter(item => item.value > 0); // Remove zero values for cleaner chart
    
    // 4. Messages Over Time (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const messagesOverTimeAgg = await Message.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Fill in missing days
    const messagesOverTime = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const match = messagesOverTimeAgg.find((m: any) => m._id === dateStr);
      messagesOverTime.push({
        date: dateStr,
        count: match ? match.count : 0
      });
    }

    // 5. Campaign Performance (Latest 10 campaigns)
    const recentCampaigns = await Campaign.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id name');
      
    const campaignIds = recentCampaigns.map((c: any) => c._id);
    
    const campaignPerformanceAgg = await Message.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          campaignId: { $in: campaignIds }
        }
      },
      {
        $group: {
          _id: { campaignId: "$campaignId", status: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const campaignPerformance = recentCampaigns.map((campaign: any) => {
      const deliveredCount = campaignPerformanceAgg.find((a: any) => 
        a._id.campaignId.toString() === campaign._id.toString() && a._id.status === "DELIVERED"
      )?.count || 0;
      
      const failedCount = campaignPerformanceAgg.find((a: any) => 
        a._id.campaignId.toString() === campaign._id.toString() && a._id.status === "FAILED"
      )?.count || 0;
      
      return {
        campaignId: campaign._id,
        name: campaign.name,
        delivered: deliveredCount,
        failed: failedCount
      };
    });
    
    // Reverse to show oldest to newest (left to right) on chart if preferred, 
    // but the spec says latest 10. Let's keep it sorted by latest first for now, 
    // or reverse for chronological visualization
    const campaignPerformanceReversed = campaignPerformance.reverse();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalContacts,
          totalCampaigns,
          totalMessages,
          deliveryRate,
          queued,
          sent,
          delivered,
          failed
        },
        deliveryStatus,
        messagesOverTime,
        campaignPerformance: campaignPerformanceReversed
      }
    });
    
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load analytics data" } },
      { status: 500 }
    );
  }
}
