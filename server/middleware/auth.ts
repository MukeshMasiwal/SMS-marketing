import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/tokenService";
import { User } from "../models/User";
import { Permission, hasPermission } from "../auth/permissions";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    email?: string;
  };
}

/**
 * Fast JWT verification middleware for ordinary user endpoints.
 * Does not hit MongoDB on every request to keep normal requests fast.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const tokenCookie = (req as any).cookies?.accessToken || (req as any).cookies?.token;
    const token =
      tokenCookie ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const payload = verifyAccessToken(token);
    if (!payload || !payload.sub) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid or expired access token" },
      });
    }

    const rawRole = (payload.role || "USER").toUpperCase();
    const role: "USER" | "ADMIN" | "SUPER_ADMIN" =
      rawRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : rawRole === "ADMIN" ? "ADMIN" : "USER";

    req.user = {
      userId: payload.sub,
      role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication failed" },
    });
  }
}

/**
 * Privileged authentication middleware for admin/super-admin operations.
 * Re-validates the database user status and role to prevent privilege escalation via stale token.
 */
export async function requirePrivilegedAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  await requireAuth(req, res, async () => {
    try {
      const dbUser = await User.findById(req.user?.userId).select("isActive role email");
      if (!dbUser) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "User account not found" },
        });
      }

      if (!dbUser.isActive) {
        return res.status(403).json({
          success: false,
          error: { code: "ACCOUNT_DISABLED", message: "Account is disabled" },
        });
      }

      // Sync role and email from database
      const dbRole = (dbUser.role || "USER").toUpperCase() as "USER" | "ADMIN" | "SUPER_ADMIN";
      req.user = {
        userId: dbUser._id.toString(),
        role: dbRole,
        email: dbUser.email,
      };

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Authorization re-validation failed" },
      });
    }
  });
}

/**
 * Middleware enforcing specific role(s)
 */
export function requireRole(...allowedRoles: Array<"USER" | "ADMIN" | "SUPER_ADMIN">) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    await requirePrivilegedAuth(req, res, () => {
      const userRole = req.user?.role || "USER";
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: `Access denied. Requires role: ${allowedRoles.join(" or ")}.` },
        });
      }
      next();
    });
  };
}

/**
 * Middleware enforcing SUPER_ADMIN role strictly
 */
export async function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  return requireRole("SUPER_ADMIN")(req, res, next);
}

/**
 * Middleware enforcing ADMIN or SUPER_ADMIN role (legacy compatibility)
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  return requireRole("ADMIN", "SUPER_ADMIN")(req, res, next);
}

/**
 * Middleware enforcing permission-based access control
 */
export function requirePermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    await requirePrivilegedAuth(req, res, () => {
      const userRole = req.user?.role || "USER";
      if (!hasPermission(userRole, permission)) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: `Access denied. Lacks required permission: ${permission}.` },
        });
      }
      next();
    });
  };
}
