import mongoose, { Schema, Document, Model } from "mongoose";

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type TargetType = "CONTACTS" | "GROUP";

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  message: string;
  targetType: TargetType;
  targetGroupIds: mongoose.Types.ObjectId[];
  targetContactIds: mongoose.Types.ObjectId[];
  status: CampaignStatus;
  recipientCount: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    targetType: { type: String, enum: ["CONTACTS", "GROUP"], required: true },
    targetGroupIds: [{ type: Schema.Types.ObjectId, ref: "Group", default: [] }],
    targetContactIds: [{ type: Schema.Types.ObjectId, ref: "Contact", default: [] }],
    status: {
      type: String,
      enum: ["DRAFT", "SCHEDULED", "SENDING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "DRAFT",
    },
    recipientCount: { type: Number, default: 0 },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

CampaignSchema.index({ userId: 1, status: 1 });
CampaignSchema.index({ userId: 1, createdAt: -1 });

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);
