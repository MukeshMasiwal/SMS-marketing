import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPackage extends Document {
  name: string;
  price: number;
  messageLimit: number;
  features: string[];
  validity: number; // in days
  popular: boolean;
  buttonText: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    name: { type: String, required: true, unique: true, index: true },
    price: { type: Number, required: true, min: 0 },
    messageLimit: { type: Number, required: true, min: 0 },
    features: [{ type: String }],
    validity: { type: Number, default: 30 },
    popular: { type: Boolean, default: false },
    buttonText: { type: String, default: "Get Started" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Package: Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);
