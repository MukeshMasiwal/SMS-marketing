import { Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../middleware/auth";
import { User } from "../models/User";
import { Contact } from "../../lib/db/models/Contact";
import { Campaign } from "../../lib/db/models/Campaign";
import { Message } from "../../lib/db/models/Message";
import { AuditLog } from "../models/AuditLog";
import { SecuritySettings } from "../models/SecuritySettings";
import { ProviderSettings } from "../models/ProviderSettings";
import { SystemSettings } from "../models/SystemSettings";
import { logAuditEvent } from "../services/auditService";
import { ROLE_PERMISSIONS } from "../auth/permissions";

/**
 * 1. Overview metrics & system health check for Super Admin Dashboard
 */
export async function getSuperAdminStats(_req: AuthenticatedRequest, res: Response) {
  try {
    const [
      totalUsers,
      totalActiveUsers,
      totalAdmins,
      totalSuperAdmins,
      totalContacts,
      totalCampaigns,
      totalMessages,
      messagesSent,
      messagesFailed,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "ADMIN" }),
      User.countDocuments({ role: "SUPER_ADMIN" }),
      Contact.countDocuments({}),
      Campaign.countDocuments({}),
      Message.countDocuments({}),
      Message.countDocuments({ status: "DELIVERED" }),
      Message.countDocuments({ status: "FAILED" }),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(10),
    ]);

    // Check DB connection status
    const dbConnected = mongoose.connection.readyState === 1;

    // Get or initialize Provider Settings
    let provider = await ProviderSettings.findOne({ providerName: "EXOTEL" });
    if (!provider) {
      provider = await ProviderSettings.create({
        providerName: "EXOTEL",
        accountSidMasked: "••••••••9F3A",
        senderId: "SMSSaaS",
        status: "ACTIVE",
        kycStatus: "RESTRICTED",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          totalActiveUsers,
          totalAdmins,
          totalSuperAdmins,
          totalContacts,
          totalCampaigns,
          totalMessages,
          messagesSent,
          messagesFailed,
        },
        health: {
          backend: { status: "HEALTHY", message: "Express server online" },
          database: { status: dbConnected ? "CONNECTED" : "DISCONNECTED", message: dbConnected ? "MongoDB Atlas operational" : "DB disconnected" },
          smsProvider: {
            provider: provider.providerName,
            status: provider.status,
            kycStatus: provider.kycStatus,
            apiKeyConfigured: Boolean(process.env.EXOTEL_API_KEY || process.env.EXOTEL_SID),
            apiTokenConfigured: Boolean(process.env.EXOTEL_API_TOKEN || process.env.EXOTEL_TOKEN),
            accountSidMasked: provider.accountSidMasked || "••••••••9F3A",
          },
        },
        recentActivity: recentAuditLogs,
      },
    });
  } catch (err: any) {
    console.error("Super Admin stats error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load Super Admin dashboard statistics." },
    });
  }
}

/**
 * 2. Get list of users with optional role & status filtering
 */
export async function getSuperAdminUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const { role, status, search } = req.query;

    const query: Record<string, any> = {};

    if (role && typeof role === "string" && role !== "ALL") {
      query.role = role.toUpperCase();
    }

    if (status === "active") query.isActive = true;
    if (status === "suspended" || status === "inactive") query.isActive = false;

    if (search && typeof search === "string") {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { email: regex }, { company: regex }];
    }

    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (err: any) {
    console.error("Super Admin getSuperAdminUsers error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load users list." },
    });
  }
}

/**
 * 3. Create a new user or administrative account
 */
export async function createSuperAdminUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, password, role, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "Name, email, and password are required." },
      });
    }

    const targetRole = (role || "USER").toUpperCase();
    if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(targetRole)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid role specified." },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: "User with this email already exists." },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: targetRole,
      company: company ? company.trim() : undefined,
      emailVerified: true,
      isActive: true,
    });

    // Record audit event
    await logAuditEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || "SUPER_ADMIN",
      actorEmail: req.user?.email || "superadmin",
      action: targetRole === "ADMIN" ? "ADMIN_CREATED" : targetRole === "SUPER_ADMIN" ? "SUPER_ADMIN_CREATED" : "USER_CREATED",
      targetType: "User",
      targetId: newUser._id.toString(),
      metadata: { email: newUser.email, role: targetRole, name: newUser.name },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const userDoc = newUser.toObject();
    delete (userDoc as any).passwordHash;

    return res.status(201).json({
      success: true,
      message: `Account created successfully with role ${targetRole}.`,
      data: { user: userDoc },
    });
  } catch (err: any) {
    console.error("Super Admin createSuperAdminUser error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to create user account." },
    });
  }
}

/**
 * 4. Change user role with final Super Admin protection & confirmation checks
 */
export async function updateSuperAdminUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { newRole, confirmPhrase } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid user ID format." },
      });
    }

    const targetRole = (newRole || "").toUpperCase();
    if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(targetRole)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid new role specified." },
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "Target user not found." },
      });
    }

    const currentRole = (user.role || "USER").toUpperCase();
    const callerRole = (req.user?.role || "").toUpperCase();

    if (callerRole === "ADMIN" && currentRole === "SUPER_ADMIN") {
      await logAuditEvent({
        actorId: req.user?.userId,
        actorRole: "ADMIN",
        actorEmail: req.user?.email || "admin",
        action: "ADMIN_ACTION_DENIED",
        targetType: "User",
        targetId: user._id.toString(),
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

    if (currentRole === targetRole) {
      return res.status(400).json({
        success: false,
        error: { message: `User is already in role ${targetRole}.` },
      });
    }

    // Safety Rule: Cannot change own role
    if (user._id.toString() === req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: { message: "You cannot modify your own Super Admin role." },
      });
    }

    // Safety Rule: Final Super Admin Delete / Demote Protection
    if (currentRole === "SUPER_ADMIN" && targetRole !== "SUPER_ADMIN") {
      const totalSuperAdmins = await User.countDocuments({ role: "SUPER_ADMIN" });
      if (totalSuperAdmins <= 1) {
        return res.status(409).json({
          success: false,
          error: { message: "Cannot demote the final remaining Super Admin in the system." },
          message: "Cannot demote the final remaining Super Admin in the system.",
        });
      }

      // Demotion of a Super Admin requires explicit confirmation
      if (confirmPhrase !== "DEMOTE SUPER ADMIN") {
        return res.status(400).json({
          success: false,
          error: { message: "Confirmation phrase required. Please provide confirmPhrase = 'DEMOTE SUPER ADMIN'." },
        });
      }
    }

    user.role = targetRole as any;
    await user.save();

    await logAuditEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || "SUPER_ADMIN",
      actorEmail: req.user?.email || "superadmin",
      action: "ROLE_CHANGED",
      targetType: "User",
      targetId: user._id.toString(),
      metadata: { previousRole: currentRole, newRole: targetRole, email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: `User role updated from ${currentRole} to ${targetRole}.`,
      data: { user },
    });
  } catch (err: any) {
    console.error("Super Admin updateSuperAdminUserRole error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to change user role." },
    });
  }
}

/**
 * 5. Update user status (isActive toggle) with active Super Admin protection
 */
export async function updateSuperAdminUserStatus(req: AuthenticatedRequest, res: Response) {
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

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "Target user not found." },
      });
    }

    const currentRole = (user.role || "USER").toUpperCase();
    const callerRole = (req.user?.role || "").toUpperCase();

    if (callerRole === "ADMIN" && currentRole === "SUPER_ADMIN") {
      await logAuditEvent({
        actorId: req.user?.userId,
        actorRole: "ADMIN",
        actorEmail: req.user?.email || "admin",
        action: "ADMIN_ACTION_DENIED",
        targetType: "User",
        targetId: user._id.toString(),
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

    // Safety Rule: Cannot deactivate self
    if (user._id.toString() === req.user?.userId && isActive === false) {
      return res.status(403).json({
        success: false,
        error: { message: "You cannot deactivate your own active account." },
      });
    }

    // Safety Rule: Final Active Super Admin Protection
    if (currentRole === "SUPER_ADMIN" && isActive === false) {
      const activeSuperAdmins = await User.countDocuments({ role: "SUPER_ADMIN", isActive: true });
      if (activeSuperAdmins <= 1) {
        return res.status(409).json({
          success: false,
          error: { message: "Cannot deactivate the final active Super Admin in the system." },
          message: "Cannot deactivate the final active Super Admin in the system.",
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    await logAuditEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || "SUPER_ADMIN",
      actorEmail: req.user?.email || "superadmin",
      action: isActive ? "USER_ACTIVATED" : "USER_SUSPENDED",
      targetType: "User",
      targetId: user._id.toString(),
      metadata: { email: user.email, role: currentRole, isActive },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: `Account status updated to ${isActive ? "Active" : "Suspended"}.`,
      data: { user },
    });
  } catch (err: any) {
    console.error("Super Admin updateSuperAdminUserStatus error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to update account status." },
    });
  }
}

/**
 * 6. Delete user / admin account with total Super Admin protection & phrase confirmation
 */
export async function deleteSuperAdminUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { confirmPhrase } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid user ID format." },
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "Target user not found." },
      });
    }

    const targetRole = (user.role || "USER").toUpperCase();
    const callerRole = (req.user?.role || "").toUpperCase();

    if (callerRole === "ADMIN" && targetRole === "SUPER_ADMIN") {
      await logAuditEvent({
        actorId: req.user?.userId,
        actorRole: "ADMIN",
        actorEmail: req.user?.email || "admin",
        action: "ADMIN_ACTION_DENIED",
        targetType: "User",
        targetId: user._id.toString(),
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

    // Safety Rule: Cannot delete self
    if (user._id.toString() === req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: { message: "You cannot delete your own active Super Admin account." },
      });
    }

    // Safety Rule: Total Super Admin Protection
    if (targetRole === "SUPER_ADMIN") {
      const totalSuperAdmins = await User.countDocuments({ role: "SUPER_ADMIN" });
      if (totalSuperAdmins <= 1) {
        return res.status(409).json({
          success: false,
          error: { message: "Cannot delete the final remaining Super Admin in the system." },
          message: "Cannot delete the final remaining Super Admin in the system.",
        });
      }
    }

    // Require exact confirmation phrase
    const requiredPhrase = targetRole === "ADMIN" ? "DELETE ADMIN" : targetRole === "SUPER_ADMIN" ? "DELETE SUPER ADMIN" : "DELETE USER";
    if (confirmPhrase !== requiredPhrase) {
      return res.status(400).json({
        success: false,
        error: { message: `Confirmation phrase required. Please send confirmPhrase = '${requiredPhrase}'.` },
      });
    }

    await User.findByIdAndDelete(id);

    await logAuditEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || "SUPER_ADMIN",
      actorEmail: req.user?.email || "superadmin",
      action: targetRole === "ADMIN" ? "ADMIN_DELETED" : "USER_DELETED",
      targetType: "User",
      targetId: id,
      metadata: { deletedEmail: user.email, deletedRole: targetRole },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: `${targetRole} user account deleted successfully.`,
    });
  } catch (err: any) {
    console.error("Super Admin deleteSuperAdminUser error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to delete user account." },
    });
  }
}

/**
 * 7. Read-only Role Hierarchy & Permission Matrix
 */
export async function getSuperAdminRoles(_req: AuthenticatedRequest, res: Response) {
  try {
    const [superAdminCount, adminCount, userCount] = await Promise.all([
      User.countDocuments({ role: "SUPER_ADMIN" }),
      User.countDocuments({ role: "ADMIN" }),
      User.countDocuments({ role: "USER" }),
    ]);

    const roles = [
      {
        role: "SUPER_ADMIN",
        level: 3,
        title: "Super Admin",
        description: "Platform owner & system administrator with unrestricted control",
        userCount: superAdminCount,
        permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
      },
      {
        role: "ADMIN",
        level: 2,
        title: "Admin",
        description: "Operational management for user oversight, campaigns, and contacts",
        userCount: adminCount,
        permissions: ROLE_PERMISSIONS.ADMIN,
      },
      {
        role: "USER",
        level: 1,
        title: "User",
        description: "Normal SMS marketing workspace user",
        userCount: userCount,
        permissions: ROLE_PERMISSIONS.USER,
      },
    ];

    return res.status(200).json({
      success: true,
      data: { roles },
    });
  } catch (err: any) {
    console.error("Super Admin getSuperAdminRoles error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load role hierarchy." },
    });
  }
}

/**
 * 8. Provider configuration & status (secrets stored server-side, masked response)
 */
export async function getSuperAdminProvider(_req: AuthenticatedRequest, res: Response) {
  try {
    let provider = await ProviderSettings.findOne({ providerName: "EXOTEL" });
    if (!provider) {
      provider = await ProviderSettings.create({
        providerName: "EXOTEL",
        accountSidMasked: "••••••••9F3A",
        senderId: "SMSSaaS",
        status: "ACTIVE",
        kycStatus: "RESTRICTED",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        provider: {
          providerName: provider.providerName,
          accountSidMasked: provider.accountSidMasked || "••••••••9F3A",
          senderId: provider.senderId,
          status: provider.status,
          kycStatus: provider.kycStatus,
          apiKeyConfigured: Boolean(process.env.EXOTEL_API_KEY || process.env.EXOTEL_SID),
          apiTokenConfigured: Boolean(process.env.EXOTEL_API_TOKEN || process.env.EXOTEL_TOKEN),
          lastSuccessRequest: provider.lastSuccessRequest,
          lastFailedRequest: provider.lastFailedRequest,
          lastError: provider.lastError,
        },
      },
    });
  } catch (err: any) {
    console.error("Super Admin getSuperAdminProvider error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load provider configuration." },
    });
  }
}

export async function updateSuperAdminProvider(req: AuthenticatedRequest, res: Response) {
  try {
    const { senderId, status, kycStatus } = req.body;

    let provider = await ProviderSettings.findOne({ providerName: "EXOTEL" });
    if (!provider) {
      provider = new ProviderSettings({ providerName: "EXOTEL" });
    }

    if (senderId) provider.senderId = senderId;
    if (status) provider.status = status;
    if (kycStatus) provider.kycStatus = kycStatus;
    provider.updatedBy = req.user?.email || "superadmin";

    await provider.save();

    await logAuditEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || "SUPER_ADMIN",
      actorEmail: req.user?.email || "superadmin",
      action: "PROVIDER_SETTINGS_CHANGED",
      targetType: "ProviderSettings",
      metadata: { senderId: provider.senderId, status: provider.status, kycStatus: provider.kycStatus },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Provider configuration updated successfully.",
      data: { provider },
    });
  } catch (err: any) {
    console.error("Super Admin updateSuperAdminProvider error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to update provider configuration." },
    });
  }
}

/**
 * 9. Paginated Audit Log records
 */
export async function getSuperAdminAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { action, actorEmail, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};
    if (action && typeof action === "string" && action !== "ALL") {
      query.action = action;
    }
    if (actorEmail && typeof actorEmail === "string") {
      query.actorEmail = new RegExp(actorEmail, "i");
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err: any) {
    console.error("Super Admin getSuperAdminAuditLogs error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load audit logs." },
    });
  }
}

/**
 * 10. Security Policy Settings
 */
export async function getSuperAdminSecurity(_req: AuthenticatedRequest, res: Response) {
  try {
    let settings = await SecuritySettings.findOne({});
    if (!settings) {
      settings = await SecuritySettings.create({
        sessionTimeoutMinutes: 1440,
        maxFailedLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        requireMfa: false,
        passwordMinLength: 8,
      });
    }

    return res.status(200).json({
      success: true,
      data: { settings },
    });
  } catch (err: any) {
    console.error("Super Admin getSuperAdminSecurity error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load security settings." },
    });
  }
}

export async function updateSuperAdminSecurity(req: AuthenticatedRequest, res: Response) {
  try {
    const { sessionTimeoutMinutes, maxFailedLoginAttempts, lockoutDurationMinutes, requireMfa, passwordMinLength } = req.body;

    let settings = await SecuritySettings.findOne({});
    if (!settings) {
      settings = new SecuritySettings({});
    }

    if (typeof sessionTimeoutMinutes === "number") settings.sessionTimeoutMinutes = sessionTimeoutMinutes;
    if (typeof maxFailedLoginAttempts === "number") settings.maxFailedLoginAttempts = maxFailedLoginAttempts;
    if (typeof lockoutDurationMinutes === "number") settings.lockoutDurationMinutes = lockoutDurationMinutes;
    if (typeof requireMfa === "boolean") settings.requireMfa = requireMfa;
    if (typeof passwordMinLength === "number") settings.passwordMinLength = passwordMinLength;
    settings.updatedBy = req.user?.email || "superadmin";

    await settings.save();

    await logAuditEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || "SUPER_ADMIN",
      actorEmail: req.user?.email || "superadmin",
      action: "SECURITY_SETTINGS_CHANGED",
      targetType: "SecuritySettings",
      metadata: { ...req.body },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Security settings updated successfully.",
      data: { settings },
    });
  } catch (err: any) {
    console.error("Super Admin updateSuperAdminSecurity error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to update security settings." },
    });
  }
}

/**
 * 11. System Configuration Settings
 */
export async function getSuperAdminSystem(_req: AuthenticatedRequest, res: Response) {
  try {
    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = await SystemSettings.create({
        appName: "SMS Marketing SaaS",
        maintenanceMode: false,
        registrationEnabled: true,
        globalMessageLimit: 1000000,
        maxCampaignSize: 50000,
        defaultProvider: "EXOTEL",
      });
    }

    return res.status(200).json({
      success: true,
      data: { settings },
    });
  } catch (err: any) {
    console.error("Super Admin getSuperAdminSystem error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to load system settings." },
    });
  }
}

export async function updateSuperAdminSystem(req: AuthenticatedRequest, res: Response) {
  try {
    const { appName, maintenanceMode, registrationEnabled, globalMessageLimit, maxCampaignSize, defaultProvider, notificationEmail } = req.body;

    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = new SystemSettings({});
    }

    if (appName) settings.appName = appName;
    if (typeof maintenanceMode === "boolean") settings.maintenanceMode = maintenanceMode;
    if (typeof registrationEnabled === "boolean") settings.registrationEnabled = registrationEnabled;
    if (typeof globalMessageLimit === "number") settings.globalMessageLimit = globalMessageLimit;
    if (typeof maxCampaignSize === "number") settings.maxCampaignSize = maxCampaignSize;
    if (defaultProvider) settings.defaultProvider = defaultProvider;
    if (notificationEmail) settings.notificationEmail = notificationEmail;
    settings.updatedBy = req.user?.email || "superadmin";

    await settings.save();

    await logAuditEvent({
      actorId: req.user?.userId,
      actorRole: req.user?.role || "SUPER_ADMIN",
      actorEmail: req.user?.email || "superadmin",
      action: "SYSTEM_SETTINGS_CHANGED",
      targetType: "SystemSettings",
      metadata: { ...req.body },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "System settings updated successfully.",
      data: { settings },
    });
  } catch (err: any) {
    console.error("Super Admin updateSuperAdminSystem error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to update system settings." },
    });
  }
}
