import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { verifyToken } from "./jwt";

export * from "./jwt";

export async function requireAuth(req: NextRequest) {
  const token =
    req.cookies.get("accessToken")?.value ||
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }

  const session = await verifyToken(token);
  if (!session) {
    return { error: "Invalid or expired token", status: 401 };
  }

  // Active User Validation Requirement
  await connectToDatabase();
  const user = await User.findById(session.userId).select("isActive role");
  
  if (!user) {
    return { error: "User not found", status: 401 };
  }
  
  if (!user.isActive) {
    return { error: "Account is disabled", status: 403 };
  }

  // Sync role with DB to prevent privilege escalation via stale token
  session.role = user.role;

  return { session };
}

export async function requireRole(req: NextRequest, role: "USER" | "ADMIN" | "SUPER_ADMIN") {
  const auth = await requireAuth(req);
  if (auth.error) return auth;

  const userRole = (auth.session!.role || "").toUpperCase();
  const targetRole = role.toUpperCase();

  if (userRole === "SUPER_ADMIN") return auth;
  if (targetRole === "ADMIN" && userRole === "ADMIN") return auth;
  if (targetRole === "USER") return auth;

  return { error: "Forbidden", status: 403 };
}
