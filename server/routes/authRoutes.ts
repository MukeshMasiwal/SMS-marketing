import { Router } from "express";
import {
  signup,
  verifyEmail,
  resendOtp,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
} from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/signup", signup);
router.post("/register", signup); // Alias for backward compatibility
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", requireAuth, logoutAll);
router.get("/me", requireAuth, getMe);
router.put("/profile", requireAuth, updateProfile);
router.patch("/profile", requireAuth, updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
