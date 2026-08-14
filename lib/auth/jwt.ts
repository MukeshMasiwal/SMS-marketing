import { verifyAccessToken, generateAccessToken } from "../../server/services/tokenService";

export interface SessionPayload {
  userId: string;
  role: "USER" | "ADMIN" | "user" | "admin";
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return generateAccessToken(payload.userId, payload.role);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  const verified = verifyAccessToken(token);
  if (!verified) return null;
  return {
    userId: verified.sub,
    role: (verified.role || "USER").toUpperCase() as "USER" | "ADMIN",
  };
}
