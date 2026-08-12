import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ success: false, error: { message: auth.error } }, { status: auth.status });
    }
    
    await connectToDatabase();
    
    // Simple query without password hash
    const users = await User.find({})
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: { users }
    });
  } catch (error: any) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load users" } },
      { status: 500 }
    );
  }
}
