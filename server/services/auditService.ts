import { AuditLog } from "../models/AuditLog";
import mongoose from "mongoose";

export interface LogAuditParams {
  actorId?: string | mongoose.Types.ObjectId;
  actorRole: string;
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    // Sanitize metadata to exclude passwords, tokens, API keys
    const sanitizedMetadata = { ...params.metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.passwordHash;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.apiKey;
    delete sanitizedMetadata.apiToken;
    delete sanitizedMetadata.secret;

    await AuditLog.create({
      actorId: params.actorId,
      actorRole: (params.actorRole || "UNKNOWN").toUpperCase(),
      actorEmail: params.actorEmail || "unknown",
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: sanitizedMetadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (err) {
    console.error("⚠️ Failed to record audit log:", err);
  }
}
