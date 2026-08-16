import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  company?: string;
  role: "user" | "admin" | "USER" | "ADMIN";
  emailVerified: boolean;
  packageId?: mongoose.Types.ObjectId;
  smsUsed: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    company: { type: String, trim: true },
    role: {
      type: String,
      enum: ["user", "admin", "USER", "ADMIN"],
      default: "user",
      set: (v: string) => (v ? (v.toLowerCase() as "user" | "admin") : "user"),
    },
    emailVerified: { type: Boolean, default: false },
    packageId: { type: Schema.Types.ObjectId, ref: "Package" },
    smsUsed: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre("save", function (this: IUser) {
  if (this.isModified("email") && this.email) {
    this.email = this.email.trim().toLowerCase();
  }
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

