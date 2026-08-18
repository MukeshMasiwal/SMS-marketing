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
    
    await connectToDatabase();
    
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: { message: "User not found" } }, { status: 404 });
    }

    const callerRole = (auth.session?.role || "USER").toUpperCase();
    const targetRole = (targetUser.role || "USER").toUpperCase();

    // Security Rule: ADMIN cannot modify SUPER_ADMIN status
    if (callerRole === "ADMIN" && targetRole === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "Admins cannot modify Super Admin accounts" }, message: "Admins cannot modify Super Admin accounts" },
        { status: 403 }
      );
    }

    // ADMIN cannot modify other ADMIN status
    if (callerRole === "ADMIN" && targetRole === "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "Admins cannot modify Admin accounts" } },
        { status: 403 }
      );
    }

    // Prevent self-disabling
    if (id === auth.session!.userId && body.isActive === false) {
      return NextResponse.json({ success: false, error: { message: "You cannot disable your own admin account." } }, { status: 403 });
    }

    // Safety Rule: Final Active Super Admin Protection
    if (targetRole === "SUPER_ADMIN" && body.isActive === false) {
      const activeSuperAdmins = await User.countDocuments({ role: "SUPER_ADMIN", isActive: true });
      if (activeSuperAdmins <= 1) {
        return NextResponse.json(
          { success: false, error: { message: "Cannot deactivate the final active Super Admin" }, message: "Cannot deactivate the final active Super Admin" },
          { status: 409 }
        );
      }
    }
    
    targetUser.isActive = body.isActive;
    await targetUser.save();

    const userObj = targetUser.toObject();
    delete (userObj as any).passwordHash;

    return NextResponse.json({
      success: true,
      data: { user: userObj }
    });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update user" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: { message: "Invalid user ID" } }, { status: 400 });
    }

    await connectToDatabase();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: { message: "User not found" } }, { status: 404 });
    }

    const callerRole = (auth.session?.role || "USER").toUpperCase();
    const targetRole = (targetUser.role || "USER").toUpperCase();

    // Security Rule: ADMIN cannot delete SUPER_ADMIN
    if (callerRole === "ADMIN" && targetRole === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "Admins cannot delete Super Admin accounts" }, message: "Admins cannot delete Super Admin accounts" },
        { status: 403 }
      );
    }

    // Safety Rule: Final Super Admin Protection
    if (targetRole === "SUPER_ADMIN") {
      const totalSuperAdmins = await User.countDocuments({ role: "SUPER_ADMIN" });
      if (totalSuperAdmins <= 1) {
        return NextResponse.json(
          { success: false, error: { message: "Cannot remove the final Super Admin" }, message: "Cannot remove the final Super Admin" },
          { status: 409 }
        );
      }
    }

    if (id === auth.session!.userId) {
      return NextResponse.json({ success: false, error: { message: "You cannot delete your own account." } }, { status: 403 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "User account deleted successfully."
    });
  } catch (error: any) {
    console.error("Admin user delete error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete user" } },
      { status: 500 }
    );
  }
}
