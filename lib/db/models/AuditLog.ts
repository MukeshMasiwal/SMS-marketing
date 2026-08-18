import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorRole: string;
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: { type: String, required: true },
    actorEmail: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, index: true },
    targetId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
