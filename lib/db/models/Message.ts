import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  messageId: string;
  userId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  recipient: string;
  message: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
  provider: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    recipient: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["QUEUED", "SENT", "DELIVERED", "FAILED"],
      required: true,
    },
    provider: { type: String, required: true },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

MessageSchema.index({ userId: 1 });
MessageSchema.index({ campaignId: 1 });
MessageSchema.index({ status: 1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
