import { Router } from "express";
import {
  getSuperAdminStats,
  getSuperAdminUsers,
  createSuperAdminUser,
  updateSuperAdminUserRole,
  updateSuperAdminUserStatus,
  deleteSuperAdminUser,
  getSuperAdminRoles,
  getSuperAdminProvider,
  updateSuperAdminProvider,
  getSuperAdminAuditLogs,
  getSuperAdminSecurity,
  updateSuperAdminSecurity,
  getSuperAdminSystem,
  updateSuperAdminSystem,
} from "../controllers/superAdminController";
import { requireSuperAdmin } from "../middleware/auth";

const router = Router();

// Protect ALL Super Admin endpoints with requireSuperAdmin middleware
router.use(requireSuperAdmin);

// Dashboard Overview & Health
router.get("/stats", getSuperAdminStats);

// User & Admin Management
router.get("/users", getSuperAdminUsers);
router.post("/users", createSuperAdminUser);
router.patch("/users/:id/role", updateSuperAdminUserRole);
router.patch("/users/:id/status", updateSuperAdminUserStatus);
router.delete("/users/:id", deleteSuperAdminUser);

// Role Hierarchy & Permission Matrix
router.get("/roles", getSuperAdminRoles);

// Provider & SMS Configuration
router.get("/provider", getSuperAdminProvider);
router.put("/provider", updateSuperAdminProvider);

// Audit Logs
router.get("/audit-logs", getSuperAdminAuditLogs);

// Security Settings
router.get("/security", getSuperAdminSecurity);
router.put("/security", updateSuperAdminSecurity);

// System Settings
router.get("/system", getSuperAdminSystem);
router.put("/system", updateSuperAdminSystem);

export default router;
