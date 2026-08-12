import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { Contact } from "@/lib/db/models/Contact";
import { Campaign } from "@/lib/db/models/Campaign";
import { Message } from "@/lib/db/models/Message";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }
    
    await connectToDatabase();

    const [
      totalUsers,
      totalActiveUsers,
      totalContacts,
      totalCampaigns,
      messageStatsAgg
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Contact.countDocuments(),
      Campaign.countDocuments(),
      Message.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
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
        totalUsers,
        totalActiveUsers,
        totalContacts,
        totalCampaigns,
        totalMessages,
        delivered,
        failed,
        queued,
        sent,
        deliveryRate
      }
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load admin stats" } },
      { status: 500 }
    );
  }
}
