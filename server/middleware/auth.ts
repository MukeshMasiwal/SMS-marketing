import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/tokenService";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: "user" | "admin";
  };
}

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

    req.user = {
      userId: payload.sub,
      role: (payload.role || "user").toLowerCase() as "user" | "admin",
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication failed" },
    });
  }
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  await requireAuth(req, res, () => {
    const role = (req.user?.role || "").toLowerCase();
    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied. Admin role required." },
      });
    }
    next();
  });
}
