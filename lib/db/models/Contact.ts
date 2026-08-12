import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  status: "SUBSCRIBED" | "UNSUBSCRIBED";
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    tags: [{ type: String }],
    status: { type: String, enum: ["SUBSCRIBED", "UNSUBSCRIBED"], default: "SUBSCRIBED" },
  },
  { timestamps: true }
);

// Prevent duplicate phone numbers for the same user
ContactSchema.index({ userId: 1, phone: 1 }, { unique: true });
ContactSchema.index({ userId: 1, tags: 1 });

export const Contact: Model<IContact> =
  mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);
