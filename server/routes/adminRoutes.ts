import { Router } from "express";
import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
  updateAdminUserRole,
  deleteAdminUser,
  getAdminStats,
} from "../controllers/adminController";
import { requireAdmin } from "../middleware/auth";

const router = Router();

// Protect all admin endpoints with requireAdmin middleware
router.use(requireAdmin);

router.get("/users", getAdminUsers);
router.get("/users/:id", getAdminUserById);
router.patch("/users/:id/status", updateAdminUserStatus);
router.patch("/users/:id/role", updateAdminUserRole);
router.patch("/users/:id", updateAdminUserStatus); // Compatibility alias
router.delete("/users/:id", deleteAdminUser);
router.get("/stats", getAdminStats);

export default router;
