import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystemSettings extends Document {
  appName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  globalMessageLimit: number;
  maxCampaignSize: number;
  defaultProvider: string;
  notificationEmail?: string;
  updatedBy?: string;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    appName: { type: String, default: "SMS Marketing SaaS" },
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
    globalMessageLimit: { type: Number, default: 1000000 },
    maxCampaignSize: { type: Number, default: 50000 },
    defaultProvider: { type: String, default: "EXOTEL" },
    notificationEmail: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const SystemSettings: Model<ISystemSettings> =
  mongoose.models.SystemSettings || mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
