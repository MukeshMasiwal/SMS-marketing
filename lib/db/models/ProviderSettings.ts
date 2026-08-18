import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProviderSettings extends Document {
  providerName: string;
  accountSidMasked?: string;
  senderId: string;
  status: "ACTIVE" | "RESTRICTED" | "DISABLED" | "UNKNOWN";
  kycStatus: "VERIFIED" | "RESTRICTED" | "PENDING" | "UNKNOWN";
  lastSuccessRequest?: Date;
  lastFailedRequest?: Date;
  lastError?: string;
  updatedBy?: string;
  updatedAt: Date;
}

const ProviderSettingsSchema = new Schema<IProviderSettings>(
  {
    providerName: { type: String, required: true, default: "EXOTEL" },
    accountSidMasked: { type: String, default: "••••••••9F3A" },
    senderId: { type: String, default: "SMSSaaS" },
    status: {
      type: String,
      enum: ["ACTIVE", "RESTRICTED", "DISABLED", "UNKNOWN"],
      default: "ACTIVE",
    },
    kycStatus: {
      type: String,
      enum: ["VERIFIED", "RESTRICTED", "PENDING", "UNKNOWN"],
      default: "RESTRICTED",
    },
    lastSuccessRequest: { type: Date },
    lastFailedRequest: { type: Date },
    lastError: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const ProviderSettings: Model<IProviderSettings> =
  mongoose.models.ProviderSettings || mongoose.model<IProviderSettings>("ProviderSettings", ProviderSettingsSchema);
