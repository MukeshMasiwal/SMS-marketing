import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroup extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  contactIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    contactIds: [{ type: Schema.Types.ObjectId, ref: "Contact" }],
  },
  { timestamps: true }
);

// Group names must be unique per user
GroupSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Group: Model<IGroup> =
  mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);
