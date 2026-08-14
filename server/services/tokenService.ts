import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Session, ISession } from "../models/Session";
import mongoose from "mongoose";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "default_access_secret_do_not_use_in_prod_123456789";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret_do_not_use_in_prod_987654321";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface AccessPayload {
  sub: string;
  role: string;
  type: "access";
}

export interface RefreshPayload {
  sub: string;
  jti: string;
  type: "refresh";
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { sub: userId, role, type: "access" },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
}

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as AccessPayload;
    if (decoded.type !== "access") return null;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function generateRefreshToken(userId: string): { refreshToken: string; jti: string } {
  const jti = crypto.randomBytes(16).toString("hex");
  const refreshToken = jwt.sign(
    { sub: userId, jti, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
  return { refreshToken, jti };
}

export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
    if (decoded.type !== "refresh") return null;
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function createSession(
  userId: string | mongoose.Types.ObjectId,
  rawRefreshToken: string,
  jti: string,
  userAgent?: string,
  ipAddress?: string
): Promise<ISession> {
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return await Session.create({
    userId,
    tokenHash,
    jti,
    expiresAt,
    userAgent,
    ipAddress,
  });
}

export async function findSessionByJti(jti: string): Promise<ISession | null> {
  return await Session.findOne({ jti });
}

export async function revokeSession(sessionId: string | mongoose.Types.ObjectId): Promise<void> {
  await Session.findByIdAndUpdate(sessionId, { revokedAt: new Date() });
}

export async function revokeAllUserSessions(userId: string | mongoose.Types.ObjectId): Promise<void> {
  await Session.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}
