import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISecuritySettings extends Document {
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
  requireMfa: boolean;
  passwordMinLength: number;
  updatedBy?: string;
  updatedAt: Date;
}

const SecuritySettingsSchema = new Schema<ISecuritySettings>(
  {
    sessionTimeoutMinutes: { type: Number, default: 1440 }, // 24 hours
    maxFailedLoginAttempts: { type: Number, default: 5 },
    lockoutDurationMinutes: { type: Number, default: 15 },
    requireMfa: { type: Boolean, default: false },
    passwordMinLength: { type: Number, default: 8 },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const SecuritySettings: Model<ISecuritySettings> =
  mongoose.models.SecuritySettings || mongoose.model<ISecuritySettings>("SecuritySettings", SecuritySettingsSchema);
