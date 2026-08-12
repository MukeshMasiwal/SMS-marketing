import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "USER" | "ADMIN";
  packageId?: mongoose.Types.ObjectId;
  smsUsed: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    packageId: { type: Schema.Types.ObjectId, ref: "Package" },
    smsUsed: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
