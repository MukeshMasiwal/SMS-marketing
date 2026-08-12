import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";
import { getUserQuota } from "@/lib/services/quota-service";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) {
      return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);
    }

    await connectToDatabase();
    
    // Fetch user safely based on session token
    const user = await User.findById(auth.session!.userId).select("-passwordHash").populate("packageId");
    
    if (!user) {
      return createErrorResponse("User not found", "USER_NOT_FOUND", 404);
    }
    
    let quota = null;
    let pkg = null;
    
    try {
      quota = await getUserQuota(user._id);
      if (user.packageId) {
        const p = user.packageId as any;
        pkg = {
          id: p._id,
          name: p.name,
          messageLimit: p.messageLimit
        };
      }
    } catch (err) {
      // If no package assigned, leave as null
    }

    return createSuccessResponse({ 
      user,
      package: pkg,
      smsUsage: quota ? {
        limit: quota.limit,
        used: quota.used,
        remaining: quota.remaining,
        percentage: quota.percentage
      } : null
    });
  } catch {
    return createErrorResponse("Failed to fetch user data", "INTERNAL_ERROR", 500);
  }
}
