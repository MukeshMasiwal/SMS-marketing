import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITemplate extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

TemplateSchema.index({ userId: 1, createdAt: -1 });

export const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema);
