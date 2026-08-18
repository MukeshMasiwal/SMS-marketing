import { verifyAccessToken, generateAccessToken } from "../../server/services/tokenService";

export interface SessionPayload {
  userId: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "user" | "admin" | "super_admin";
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return generateAccessToken(payload.userId, payload.role);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  const verified = verifyAccessToken(token);
  if (!verified) return null;
  const rawRole = (verified.role || "USER").toUpperCase();
  const role: "USER" | "ADMIN" | "SUPER_ADMIN" =
    rawRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : rawRole === "ADMIN" ? "ADMIN" : "USER";
  return {
    userId: verified.sub,
    role,
  };
}
