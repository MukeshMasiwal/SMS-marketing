import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User";
import { Otp } from "../models/Otp";
import {
  generateAccessToken,
  generateRefreshToken,
  createSession,
  findSessionByJti,
  revokeSession,
  revokeAllUserSessions,
  verifyRefreshToken,
  hashToken,
} from "../services/tokenService";
import {
  sendVerificationOtpEmail,
  sendPasswordResetOtpEmail,
} from "../services/emailService";

// Helper to set HTTP-only cookies
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const isProduction = process.env.NODE_ENV === "production";

  (res as any).cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  (res as any).cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// Helper to clear cookies
export function clearAuthCookies(res: Response) {
  const isProduction = process.env.NODE_ENV === "production";

  (res as any).cookie("accessToken", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  (res as any).cookie("refreshToken", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function signup(req: Request, res: Response) {
  try {
    const { name, company, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "Name, email, and password are required." },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: { message: "Please provide a valid email address." },
      });
    }

    // Validate password (8 to 64 chars)
    if (password.length < 8 || password.length > 64) {
      return res.status(400).json({
        success: false,
        error: { message: "Password must be between 8 and 64 characters." },
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: "An account with this email already exists." },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create unverified user
    const user = await User.create({
      name,
      company,
      email: normalizedEmail,
      passwordHash,
      role: "USER",
      emailVerified: false,
    });

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashToken(otp);

    // Invalidate previous OTPs
    await Otp.deleteMany({ email: normalizedEmail, type: "EMAIL_VERIFICATION" });

    // Save OTP (expires in 10 minutes)
    const otpRecord = await Otp.create({
      email: normalizedEmail,
      otpHash,
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    });

    // Send email via SMTP
    try {
      await sendVerificationOtpEmail(normalizedEmail, user.name, otp, 10);
    } catch (smtpErr: any) {
      console.error("Sanitized SMTP error during signup:", smtpErr.message || "Failed to send verification email");

      // Cleanup newly created unverified user & OTP record so state remains clean
      await Otp.deleteOne({ _id: otpRecord._id });
      await User.deleteOne({ _id: user._id });

      return res.status(500).json({
        success: false,
        error: { message: "Unable to send verification email. Please try again later." },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please check your email for the verification code.",
      email: normalizedEmail,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { message: "An account with this email already exists." },
      });
    }
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      error: { message: "An unexpected error occurred during signup." },
    });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: { message: "Email and OTP code are required." },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: "EMAIL_VERIFICATION",
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid or expired verification code." },
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        error: { message: "Verification code has expired. Please request a new code." },
      });
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        error: { message: "Maximum verification attempts exceeded. Please request a new code." },
      });
    }

    const inputHash = hashToken(otp.trim());
    if (inputHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        error: { message: "Invalid verification code." },
      });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User account not found." },
      });
    }

    user.emailVerified = true;
    await user.save();

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const { refreshToken, jti } = generateRefreshToken(user._id.toString());

    const userAgent = req.headers["user-agent"];
    const ipAddress = (req as any).ip || (req as any).socket?.remoteAddress;

    await createSession(user._id, refreshToken, jti, userAgent, ipAddress);

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        emailVerified: true,
      },
    });
  } catch (err) {
    console.error("Verify email error:", err);
    return res.status(500).json({
      success: false,
      error: { message: "An unexpected error occurred during email verification." },
    });
  }
}

export async function resendOtp(req: Request, res: Response) {
  try {
    const { email, type = "EMAIL_VERIFICATION" } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: "Email is required." },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists, a new verification code has been sent.",
      });
    }

    if (type === "EMAIL_VERIFICATION" && user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: { message: "Email is already verified." },
      });
    }

    const recentOtpsCount = await Otp.countDocuments({
      email: normalizedEmail,
      type,
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });

    if (recentOtpsCount >= 3) {
      return res.status(429).json({
        success: false,
        error: { message: "Too many verification requests. Please wait 15 minutes before requesting again." },
      });
    }

    await Otp.deleteMany({ email: normalizedEmail, type });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashToken(otp);

    await Otp.create({
      email: normalizedEmail,
      otpHash,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    });

    try {
      if (type === "EMAIL_VERIFICATION") {
        await sendVerificationOtpEmail(normalizedEmail, user.name, otp, 10);
      } else {
        await sendPasswordResetOtpEmail(normalizedEmail, user.name, otp, 10);
      }
    } catch (smtpErr: any) {
      console.error("Sanitized SMTP error during resendOtp:", smtpErr.message || "Failed to resend code");
      return res.status(500).json({
        success: false,
        error: { message: "Unable to send verification email. Please try again later." },
      });
    }

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (err: any) {
    console.error("Resend OTP error:", err.message || err);
    return res.status(500).json({
      success: false,
      error: { message: "Unable to send verification email. Please try again later." },
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    console.log("[AUTH] Login request received");
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "Email and password are required." },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("[AUTH] Email normalized");

    const user = await User.findOne({ email: normalizedEmail });
    console.log("[AUTH] User lookup completed");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid email or password." },
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("[AUTH] Password comparison completed");

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid email or password." },
      });
    }

    console.log("[AUTH] Email verification check completed");
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        emailVerified: false,
        email: user.email,
        error: { message: "Please verify your email before logging in." },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: "Account is disabled. Please contact support." },
      });
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const { refreshToken, jti } = generateRefreshToken(user._id.toString());
    console.log("[AUTH] JWT generation completed");

    const userAgent = req.headers["user-agent"];
    const ipAddress = (req as any).ip || (req as any).socket?.remoteAddress;

    await createSession(user._id, refreshToken, jti, userAgent, ipAddress);
    console.log("[AUTH] Session creation completed");

    setAuthCookies(res, accessToken, refreshToken);
    console.log("[AUTH] Cookies configured");

    console.log("[AUTH] Login response sent");
    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      error: { message: "Authentication service is temporarily unavailable. Please try again." },
    });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const rawRefreshToken = (req as any).cookies?.refreshToken;

    if (!rawRefreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: { message: "Refresh token missing." },
      });
    }

    const payload = verifyRefreshToken(rawRefreshToken);
    if (!payload) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: { message: "Invalid or expired refresh token." },
      });
    }

    const session = await findSessionByJti(payload.jti);

    if (!session) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: { message: "Session not found." },
      });
    }

    if (session.revokedAt) {
      console.warn(`SECURITY WARNING: Revoked refresh token reused by user ${session.userId}! Revoking all sessions.`);
      await revokeAllUserSessions(session.userId);
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: { message: "Security alert: Token reuse detected. All active sessions have been revoked. Please log in again." },
      });
    }

    const inputHash = hashToken(rawRefreshToken);
    if (inputHash !== session.tokenHash) {
      await revokeAllUserSessions(session.userId);
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: { message: "Invalid token hash. All sessions revoked." },
      });
    }

    if (session.expiresAt < new Date()) {
      await revokeSession(session._id);
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: { message: "Session has expired. Please log in again." },
      });
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      await revokeSession(session._id);
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: { message: "User account inactive or missing." },
      });
    }

    await revokeSession(session._id);

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const { refreshToken: newRefreshToken, jti: newJti } = generateRefreshToken(user._id.toString());

    const userAgent = req.headers["user-agent"];
    const ipAddress = (req as any).ip || (req as any).socket?.remoteAddress;

    await createSession(user._id, newRefreshToken, newJti, userAgent, ipAddress);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    clearAuthCookies(res);
    return res.status(500).json({
      success: false,
      error: { message: "An unexpected error occurred while refreshing token." },
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const rawRefreshToken = (req as any).cookies?.refreshToken;
    if (rawRefreshToken) {
      const payload = verifyRefreshToken(rawRefreshToken);
      if (payload?.jti) {
        const session = await findSessionByJti(payload.jti);
        if (session) {
          await revokeSession(session._id);
        }
      }
    }
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  }
}

export async function logoutAll(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (userId) {
      await revokeAllUserSessions(userId);
    }
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully.",
    });
  } catch (err) {
    console.error("Logout all error:", err);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to logout from all devices." },
    });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found." },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          company: user.company,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        smsUsage: {
          used: user.smsUsed || 0,
          limit: 1000,
          remaining: Math.max(1000 - (user.smsUsed || 0), 0),
          percentage: Math.min(((user.smsUsed || 0) / 1000) * 100, 100),
        },
      },
    });
  } catch (err) {
    console.error("GetMe error:", err);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch user details." },
    });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: "Email is required." },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpHash = hashToken(otp);

      await Otp.deleteMany({ email: normalizedEmail, type: "PASSWORD_RESET" });

      await Otp.create({
        email: normalizedEmail,
        otpHash,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      });

      try {
        await sendPasswordResetOtpEmail(normalizedEmail, user.name, otp, 10);
      } catch (smtpErr: any) {
        console.error("Sanitized SMTP error during forgotPassword:", smtpErr.message || "Failed to send reset email");
      }
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists for this email, password reset instructions have been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({
      success: false,
      error: { message: "An error occurred while processing password reset." },
    });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: "Email, OTP code, and new password are required." },
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: "New password must be at least 8 characters long." },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: "PASSWORD_RESET",
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid or expired reset code." },
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        error: { message: "Reset code has expired. Please request a new code." },
      });
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        error: { message: "Maximum reset attempts exceeded. Please request a new code." },
      });
    }

    const inputHash = hashToken(otp.trim());
    if (inputHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        error: { message: "Invalid reset code." },
      });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User account not found." },
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await revokeAllUserSessions(user._id);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({
      success: false,
      error: { message: "An error occurred while resetting password." },
    });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { name, company, role, permissions } = req.body;

    // Security Check: Users cannot manipulate their own role through profile update APIs
    if (role !== undefined || permissions !== undefined) {
      return res.status(403).json({
        success: false,
        error: { message: "Modifying account roles or permissions through profile updates is forbidden." },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User account not found." },
      });
    }

    if (name) user.name = name.trim();
    if (company !== undefined) user.company = company.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to update profile." },
    });
  }
}
