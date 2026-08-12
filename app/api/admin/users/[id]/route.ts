import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { Contact } from "@/lib/db/models/Contact";
import { Campaign } from "@/lib/db/models/Campaign";
import { Message } from "@/lib/db/models/Message";
import mongoose from "mongoose";

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
      return NextResponse.json({ success: false, error: { message: "Invalid user ID" } }, { status: 400 });
    }
    
    const userId = new mongoose.Types.ObjectId(id);
    
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "User not found" } }, { status: 404 });
    }

    const [
      contactCount,
      campaignCount,
      messageCount,
      recentCampaigns
    ] = await Promise.all([
      Contact.countDocuments({ userId }),
      Campaign.countDocuments({ userId }),
      Message.countDocuments({ userId }),
      Campaign.find({ userId }).sort({ createdAt: -1 }).limit(5)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        user,
        stats: {
          contactCount,
          campaignCount,
          messageCount
        },
        recentCampaigns
      }
    });
  } catch (error: any) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load user details" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }
    
    const body = await req.json();
    
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ success: false, error: { message: "isActive must be a boolean" } }, { status: 400 });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: { message: "Invalid user ID" } }, { status: 400 });
    }
    
    if (id === auth.session!.userId && body.isActive === false) {
      return NextResponse.json({ success: false, error: { message: "You cannot disable your own admin account." } }, { status: 403 });
    }
    
    await connectToDatabase();
    
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: body.isActive },
      { new: true }
    ).select("-passwordHash");
    
    if (!user) {
      return NextResponse.json({ success: false, error: { message: "User not found" } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update user" } },
      { status: 500 }
    );
  }
}
