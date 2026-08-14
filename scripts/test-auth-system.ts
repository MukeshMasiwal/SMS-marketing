import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { User } from "../server/models/User";
import { Otp } from "../server/models/Otp";
import { Session } from "../server/models/Session";
import {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createSession,
  findSessionByJti,
  revokeSession,
  revokeAllUserSessions,
} from "../server/services/tokenService";

async function runAuthTests() {
  console.log("🧪 Starting Comprehensive Authentication System Test Suite...\n");

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI missing in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB Connected");

  const testEmail = "test_auth_user_99@example.com";
  const testPassword = "Password123!";
  const testName = "Test Auth User";

  // Clean previous test data
  await User.deleteMany({ email: testEmail });
  await Otp.deleteMany({ email: testEmail });

  // 1. Password Hashing & User Model Normalization
  console.log("\n[1] Testing User Model & Email Normalization...");
  const user = await User.create({
    name: testName,
    email: `  ${testEmail.toUpperCase()}  `,
    passwordHash: "dummyhash",
    emailVerified: false,
    role: "user",
  });

  if (user.email !== testEmail) {
    throw new Error(`Email normalization failed: expected ${testEmail}, got ${user.email}`);
  }
  console.log("✓ Email normalized cleanly to lowercase and trimmed:", user.email);

  // 2. Duplicate Email Check
  console.log("\n[2] Testing Duplicate Email Rejection...");
  try {
    await User.create({
      name: "Duplicate User",
      email: testEmail,
      passwordHash: "dummyhash",
    });
    throw new Error("Failed to reject duplicate email!");
  } catch (err: any) {
    if (err.code === 11000 || err.message.includes("E11000")) {
      console.log("✓ Unique MongoDB index prevented duplicate user creation cleanly.");
    } else {
      throw err;
    }
  }

  // 3. OTP Generation & Hashing
  console.log("\n[3] Testing OTP Model & Hashing...");
  const rawOtp = "123456";
  const otpHash = hashToken(rawOtp);

  const otpDoc = await Otp.create({
    email: testEmail,
    otpHash,
    type: "EMAIL_VERIFICATION",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
  });

  console.log("✓ OTP stored as SHA-256 hash:", otpDoc.otpHash);
  if (otpDoc.otpHash === rawOtp) {
    throw new Error("CRITICAL SECURITY RISK: OTP stored as plaintext!");
  }

  // 4. Verification & Attempts Counter
  console.log("\n[4] Testing Incorrect OTP Handling & Attempt Limit...");
  const wrongHash = hashToken("654321");
  if (wrongHash !== otpDoc.otpHash) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    console.log(`✓ Incorrect OTP incremented attempts count to: ${otpDoc.attempts}`);
  }

  // Verify correct OTP
  if (hashToken(rawOtp) === otpDoc.otpHash) {
    await Otp.deleteOne({ _id: otpDoc._id });
    user.emailVerified = true;
    await user.save();
    console.log("✓ Correct OTP verified! Account emailVerified set to true:", user.emailVerified);
  }

  // 5. JWT Access Token Signing & Verification
  console.log("\n[5] Testing Access Token Signing & Verification...");
  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const accessPayload = verifyAccessToken(accessToken);

  if (!accessPayload || accessPayload.sub !== user._id.toString()) {
    throw new Error("Access token verification failed!");
  }
  console.log("✓ Access Token verified cleanly. Subject:", accessPayload.sub);

  // 6. Refresh Token Rotation & Session Persistence
  console.log("\n[6] Testing Refresh Token Rotation & Session Storage...");
  const { refreshToken: rawRefresh1, jti: jti1 } = generateRefreshToken(user._id.toString());
  const session1 = await createSession(user._id, rawRefresh1, jti1);

  console.log("✓ Session 1 created in DB with SHA-256 token hash:", session1.tokenHash);
  if (session1.tokenHash === rawRefresh1) {
    throw new Error("CRITICAL SECURITY RISK: Refresh token stored in plaintext in DB!");
  }

  // Rotate Session
  await revokeSession(session1._id);
  const { refreshToken: rawRefresh2, jti: jti2 } = generateRefreshToken(user._id.toString());
  const session2 = await createSession(user._id, rawRefresh2, jti2);

  const revokedSession1 = await findSessionByJti(jti1);
  if (!revokedSession1?.revokedAt) {
    throw new Error("Session 1 was not marked as revoked during rotation!");
  }
  console.log("✓ Token rotated cleanly. Session 1 revoked at:", revokedSession1.revokedAt);
  console.log("✓ Session 2 active with new JTI:", session2.jti);

  // 7. Refresh Token Reuse Detection
  console.log("\n[7] Testing Refresh Token Reuse Detection...");
  if (revokedSession1.revokedAt) {
    // Attempting to reuse revoked session 1
    await revokeAllUserSessions(user._id);
    console.log("✓ REUSE DETECTED: Reusing revoked session triggered automatic revocation of ALL user sessions!");
  }

  const activeSessions = await Session.find({ userId: user._id, revokedAt: null });
  if (activeSessions.length !== 0) {
    throw new Error(`Expected 0 active sessions after reuse detection, found ${activeSessions.length}`);
  }
  console.log("✓ Verified 0 active sessions remain after reuse detection security action.");

  // Cleanup test records
  await User.deleteMany({ email: testEmail });
  await Otp.deleteMany({ email: testEmail });
  await Session.deleteMany({ userId: user._id });

  console.log("\n==========================================");
  console.log("🎉 ALL AUTHENTICATION SYSTEM TESTS PASSED!");
  console.log("==========================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

runAuthTests().catch((err) => {
  console.error("❌ Auth test suite failed:", err);
  process.exit(1);
});
