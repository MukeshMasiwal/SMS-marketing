import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Contact } from "../../lib/db/models/Contact";
import { Campaign } from "../../lib/db/models/Campaign";
import { Message } from "../../lib/db/models/Message";
import { AuthenticatedRequest } from "../middleware/auth";

/**
 * Get list of all registered users (excluding sensitive password hash data)
 */
export async function getAdminUsers(_req: Request, res: Response) {
  try {
    const users = await User.find({})
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (err: any) {
    console.error("Admin getAdminUsers error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load users." },
    });
  }
}

/**
 * Get single user details and associated resource usage statistics
 */
export async function getAdminUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid user ID format." },
      });
    }

    const userId = new mongoose.Types.ObjectId(id);

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found." },
      });
    }

    const [contactCount, campaignCount, messageCount, recentCampaigns] = await Promise.all([
      Contact.countDocuments({ userId }).catch(() => 0),
      Campaign.countDocuments({ userId }).catch(() => 0),
      Message.countDocuments({ userId }).catch(() => 0),
      Campaign.find({ userId }).sort({ createdAt: -1 }).limit(5).catch(() => []),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          contactCount,
          campaignCount,
          messageCount,
        },
        recentCampaigns,
      },
    });
  } catch (err: any) {
    console.error("Admin getAdminUserById error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load user details." },
    });
  }
}

import { logAuditEvent } from "../services/auditService";

/**
 * Update user status (isActive toggle)
 */
export async function updateAdminUserStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid user ID format." },
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        error: { message: "Property 'isActive' must be a boolean." },
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: "User account not found." },
      });
    }

    const targetRole = (targetUser.role || "USER").toUpperCase();
    const callerRole = (req.user?.role || "USER").toUpperCase();

    // Security Rule: ADMIN can NEVER modify status of SUPER_ADMIN accounts
    if (callerRole === "ADMIN" && targetRole === "SUPER_ADMIN") {
      await logAuditEvent({
        actorId: req.user?.userId,
        actorRole: "ADMIN",
        actorEmail: req.user?.email || "admin",
        action: "ADMIN_ACTION_DENIED",
        targetType: "User",
        targetId: targetUser._id.toString(),
        metadata: {
          targetRole: "SUPER_ADMIN",
          attemptedAction: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
          reason: "Admins cannot modify Super Admin accounts",
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      }).catch(() => {});

      return res.status(403).json({
        success: false,
        error: { message: "Admins cannot modify Super Admin accounts" },
        message: "Admins cannot modify Super Admin accounts",
      });
    }

    // ADMIN cannot modify status of other ADMIN accounts without Super Admin privilege
    if (callerRole === "ADMIN" && targetRole === "ADMIN") {
      return res.status(403).json({
        success: false,
        error: { message: "Access denied. Admins cannot modify status of other Admin accounts. Super Admin required." },
      });
    }

    const currentUserId = req.user?.userId;
    if (currentUserId && currentUserId === id && isActive === false) {
      return res.status(403).json({
        success: false,
        error: { message: "You cannot disable your own active admin account." },
      });
    }

    targetUser.isActive = isActive;
    await targetUser.save();
    const user = targetUser.toObject();
    delete (user as any).passwordHash;

    return res.status(200).json({
      success: true,
      message: `User status updated to ${isActive ? "Active" : "Disabled"}.`,
      data: { user },
    });
  } catch (err: any) {
    console.error("Admin updateAdminUserStatus error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to update user status." },
    });
  }
}

/**
 * Delete user account protection for Admin route
 */
export async function deleteAdminUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid user ID format." },
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: "User account not found." },
      });
    }

    const targetRole = (targetUser.role || "USER").toUpperCase();
    const callerRole = (req.user?.role || "USER").toUpperCase();

    if (callerRole === "ADMIN" && targetRole === "SUPER_ADMIN") {
      await logAuditEvent({
        actorId: req.user?.userId,
        actorRole: "ADMIN",
        actorEmail: req.user?.email || "admin",
        action: "ADMIN_ACTION_DENIED",
        targetType: "User",
        targetId: targetUser._id.toString(),
        metadata: {
          targetRole: "SUPER_ADMIN",
          attemptedAction: "DELETE_USER",
          reason: "Admins cannot delete Super Admin accounts",
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      }).catch(() => {});

      return res.status(403).json({
        success: false,
        error: { message: "Admins cannot delete Super Admin accounts" },
        message: "Admins cannot delete Super Admin accounts",
      });
    }

    if (callerRole === "ADMIN" && targetRole === "ADMIN") {
      return res.status(403).json({
        success: false,
        error: { message: "Admins cannot delete Admin accounts. Super Admin required." },
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully.",
    });
  } catch (err: any) {
    console.error("Admin deleteAdminUser error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to delete user." },
    });
  }
}

/**
 * Role update protection for Admin route
 */
export async function updateAdminUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid user ID format." },
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: "User account not found." },
      });
    }

    const targetRole = (targetUser.role || "USER").toUpperCase();
    const callerRole = (req.user?.role || "USER").toUpperCase();

    if (callerRole === "ADMIN" && targetRole === "SUPER_ADMIN") {
      await logAuditEvent({
        actorId: req.user?.userId,
        actorRole: "ADMIN",
        actorEmail: req.user?.email || "admin",
        action: "ADMIN_ACTION_DENIED",
        targetType: "User",
        targetId: targetUser._id.toString(),
        metadata: {
          targetRole: "SUPER_ADMIN",
          attemptedAction: "CHANGE_USER_ROLE",
          reason: "Admins cannot modify Super Admin roles",
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      }).catch(() => {});

      return res.status(403).json({
        success: false,
        error: { message: "Admins cannot modify Super Admin roles" },
        message: "Admins cannot modify Super Admin roles",
      });
    }

    return res.status(403).json({
      success: false,
      error: { message: "Admins cannot modify user roles. Super Admin required." },
    });
  } catch (err: any) {
    console.error("Admin updateAdminUserRole error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to update user role." },
    });
  }
}

/**
 * Get high-level overview statistics for admin dashboard
 */
export async function getAdminStats(_req: Request, res: Response) {
  try {
    const [totalUsers, totalActiveUsers, totalContacts, totalCampaigns] = await Promise.all([
      User.countDocuments({}).catch(() => 0),
      User.countDocuments({ isActive: true }).catch(() => 0),
      Contact.countDocuments({}).catch(() => 0),
      Campaign.countDocuments({}).catch(() => 0),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalActiveUsers,
        totalContacts,
        totalCampaigns,
      },
    });
  } catch (err: any) {
    console.error("Admin getAdminStats error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load admin statistics." },
    });
  }
}
