import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Campaign } from "@/lib/db/models/Campaign";
import "@/lib/db/models/User"; // Ensure User model is registered for populate

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }
    
    await connectToDatabase();
    
    const campaigns = await Campaign.find({})
      .populate("userId", "name email")
      .select("name status recipientCount targetType createdAt scheduledAt userId")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: { campaigns }
    });
  } catch (error: any) {
    console.error("Admin campaigns error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load campaigns" } },
      { status: 500 }
    );
  }
}
