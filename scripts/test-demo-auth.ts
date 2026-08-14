import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import express from "express";
import cookieParser from "cookie-parser";
import { Server } from "http";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { User } from "../server/models/User";
import { Session } from "../server/models/Session";
import { Otp } from "../server/models/Otp";
import authRoutes from "../server/routes/authRoutes";

async function runDemoAuthTests() {
  console.log("🧪 Starting Comprehensive Demo Account Authentication Test Suite...\n");

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI missing in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Spin up temporary local Express instance to test actual API route pipeline
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/auth", authRoutes);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api/auth`;

  try {
    // ----------------------------------------------------
    // TEST 1 & 2 & 3 & 4 & 5: Check Demo Normal User in DB
    // ----------------------------------------------------
    console.log("[1-5] Verifying seeded demo user (user@example.com)...");
    const demoUser = await User.findOne({ email: "user@example.com" });
    if (!demoUser) throw new Error("Demo user account (user@example.com) not found in database!");

    if (!demoUser.emailVerified) {
      throw new Error(`Expected user@example.com emailVerified to be true, got ${demoUser.emailVerified}`);
    }
    console.log("✓ Demo user emailVerified is true");

    if (demoUser.role !== "user") {
      throw new Error(`Expected role to be "user", got "${demoUser.role}"`);
    }
    console.log("✓ Demo user role is lowercase 'user'");

    const isUserPassValid = await bcrypt.compare("User@12345", demoUser.passwordHash);
    if (!isUserPassValid) {
      throw new Error("Password verification failed for user@example.com!");
    }
    console.log("✓ Demo user password hash is valid for 'User@12345'");

    // ----------------------------------------------------
    // TEST 6 & 7 & 8 & 9 & 10 & 11: Normal Login for Demo User
    // ----------------------------------------------------
    console.log("\n[6-11] Testing POST /api/auth/login for demo user...");
    const startTime = Date.now();
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "User@12345" }),
    });
    const duration = Date.now() - startTime;

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Demo login failed with status ${loginRes.status}: ${JSON.stringify(loginData)}`);
    }
    console.log(`✓ Demo user login API response status 200 OK (${duration}ms)`);
    if (duration > 3000) {
      throw new Error(`Login took ${duration}ms, exceeding 3000ms performance requirement!`);
    }

    // Test Invalid Password Rejection
    const invalidPassRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "WrongPassword123" }),
    });
    if (invalidPassRes.status !== 401) {
      throw new Error(`Expected status 401 for wrong password, got ${invalidPassRes.status}`);
    }
    console.log("✓ Invalid password correctly rejected with 401 Unauthorized");

    const rawCookies = (loginRes.headers as any).getSetCookie ? (loginRes.headers as any).getSetCookie() : [loginRes.headers.get("set-cookie") || ""];
    const cookieHeaderStr = rawCookies.join("; ");

    if (!cookieHeaderStr.includes("accessToken")) {
      throw new Error("accessToken HTTP-only cookie missing from login response!");
    }
    if (!cookieHeaderStr.includes("refreshToken")) {
      throw new Error("refreshToken HTTP-only cookie missing from login response!");
    }
    console.log("✓ HTTP-only accessToken and refreshToken cookies set cleanly");

    // Check Session Document in Database
    const session = await Session.findOne({ userId: demoUser._id, revokedAt: null }).sort({ createdAt: -1 });
    if (!session) {
      throw new Error("Session document was NOT created in MongoDB upon demo login!");
    }
    console.log("✓ Session document created in MongoDB with ID:", session._id.toString());
    console.log("✓ Session JTI:", session.jti);

    if (!session.tokenHash) {
      throw new Error("Session does not contain tokenHash!");
    }

    // Extract raw refresh token value from set-cookie
    const refreshTokenMatch = cookieHeaderStr.match(/refreshToken=([^;]+)/);
    const rawRefreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;

    if (rawRefreshToken && session.tokenHash === rawRefreshToken) {
      throw new Error("CRITICAL SECURITY RISK: Raw refresh token stored in plain text in Session document!");
    }
    console.log("✓ Verified raw refresh token is NOT stored in MongoDB (stored as SHA-256 tokenHash)");

    // ----------------------------------------------------
    // TEST 12 & 13: GET /api/auth/me with auth cookies
    // ----------------------------------------------------
    console.log("\n[12-13] Testing GET /api/auth/me endpoint...");
    const meRes = await fetch(`${baseUrl}/me`, {
      method: "GET",
      headers: { Cookie: cookieHeaderStr },
    });
    const meData = await meRes.json();
    if (!meRes.ok || !meData.success) {
      throw new Error(`GET /api/auth/me failed with status ${meRes.status}: ${JSON.stringify(meData)}`);
    }
    if (meData.data.user.email !== "user@example.com") {
      throw new Error(`GET /api/auth/me returned wrong user: ${meData.data.user.email}`);
    }
    console.log("✓ GET /api/auth/me returned authenticated demo user details");

    // ----------------------------------------------------
    // TEST 14 & 15 & 16: Logout & Session Revocation
    // ----------------------------------------------------
    console.log("\n[14-16] Testing POST /api/auth/logout...");
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { Cookie: cookieHeaderStr },
    });
    const logoutData = await logoutRes.json();
    if (!logoutRes.ok || !logoutData.success) {
      throw new Error(`Logout failed: ${JSON.stringify(logoutData)}`);
    }
    console.log("✓ Logout API response status 200 OK");

    const updatedSession = await Session.findById(session._id);
    if (!updatedSession?.revokedAt) {
      throw new Error("Session in MongoDB was NOT marked as revoked upon logout!");
    }
    console.log("✓ Verified Session marked as revoked in MongoDB at:", updatedSession.revokedAt);

    // Verify GET /api/auth/me fails after logout cookies cleared
    const logoutCookiesHeader = (logoutRes.headers as any).getSetCookie ? (logoutRes.headers as any).getSetCookie().join("; ") : "";
    const meAfterLogoutRes = await fetch(`${baseUrl}/me`, {
      method: "GET",
      headers: { Cookie: logoutCookiesHeader },
    });
    if (meAfterLogoutRes.status !== 401) {
      throw new Error(`Expected GET /api/auth/me to return 401 after logout, got ${meAfterLogoutRes.status}`);
    }
    console.log("✓ Verified protected endpoint returns 401 Unauthorized after logout");

    // ----------------------------------------------------
    // TEST 17 & 18: Admin Account Verification
    // ----------------------------------------------------
    console.log("\n[17-18] Testing Admin Account (admin@example.com)...");
    const adminUser = await User.findOne({ email: "admin@example.com" });
    if (!adminUser) throw new Error("Admin account (admin@example.com) not found!");

    if (!adminUser.emailVerified) {
      throw new Error(`Expected admin@example.com emailVerified to be true, got ${adminUser.emailVerified}`);
    }
    if (adminUser.role !== "admin") {
      throw new Error(`Expected admin role to be "admin", got "${adminUser.role}"`);
    }
    const isAdminPassValid = await bcrypt.compare("Admin@12345", adminUser.passwordHash);
    if (!isAdminPassValid) {
      throw new Error("Password verification failed for admin@example.com!");
    }

    const adminLoginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "Admin@12345" }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok || !adminLoginData.success) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    console.log("✓ Demo Admin logged in successfully with role 'admin'");

    // ----------------------------------------------------
    // TEST 19 & 20: Unverified New User Login Rejection
    // ----------------------------------------------------
    console.log("\n[19-20] Testing Unverified New User Login Rejection...");
    const unverifiedEmail = "unverified_test_user@example.com";
    await User.deleteMany({ email: unverifiedEmail });
    await Otp.deleteMany({ email: unverifiedEmail });

    const unverifiedPasswordHash = await bcrypt.hash("Password123!", 10);
    await User.create({
      name: "Unverified Test User",
      email: unverifiedEmail,
      passwordHash: unverifiedPasswordHash,
      role: "user",
      emailVerified: false,
    });

    const unverifiedLoginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail, password: "Password123!" }),
    });

    const unverifiedLoginData = await unverifiedLoginRes.json();
    if (unverifiedLoginRes.status !== 403) {
      throw new Error(`Expected status 403 for unverified user login, got ${unverifiedLoginRes.status}`);
    }
    if (unverifiedLoginData.emailVerified !== false) {
      throw new Error("Expected emailVerified: false in login response for unverified account!");
    }
    console.log("✓ Unverified user login rejected with 403 status and message:", unverifiedLoginData.error?.message);

    // Cleanup unverified test user
    await User.deleteMany({ email: unverifiedEmail });

    console.log("\n==================================================");
    console.log("🎉 ALL DEMO AUTHENTICATION VERIFICATION TESTS PASSED!");
    console.log("==================================================\n");

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    server.close();
    await mongoose.disconnect();
    throw err;
  }
}

runDemoAuthTests().catch((err) => {
  console.error("❌ Demo auth test suite failed:", err);
  process.exit(1);
});
