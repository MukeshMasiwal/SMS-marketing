import mongoose, { Schema, Document, Model } from "mongoose";

export type OtpType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  type: OtpType;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    otpHash: { type: String, required: true },
    type: {
      type: String,
      enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET"],
      required: true,
      index: true,
    },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

// TTL index to automatically drop expired OTP documents
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
