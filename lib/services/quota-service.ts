import mongoose from "mongoose";
import { User } from "../db/models/User";
import { Package } from "../db/models/Package";

export async function getUserQuota(userId: string | mongoose.Types.ObjectId) {
  const user = await User.findById(userId).populate("packageId");
  if (!user || !user.packageId) {
    throw new Error("No SMS package is assigned to this account.");
  }
  
  const pkg = user.packageId as any; // Populated document
  const messageLimit = pkg.messageLimit;
  const smsUsed = user.smsUsed || 0;
  
  return {
    limit: messageLimit,
    used: smsUsed,
    remaining: Math.max(messageLimit - smsUsed, 0),
    percentage: messageLimit > 0 ? Math.min(Math.max((smsUsed / messageLimit) * 100, 0), 100) : 0
  };
}

export async function reserveQuota(userId: string | mongoose.Types.ObjectId, amount: number) {
  if (amount <= 0) return true;
  
  // 1. First get the limit from the package
  const user = await User.findById(userId).populate("packageId");
  if (!user || !user.packageId) {
    throw new Error("No SMS package is assigned to this account.");
  }
  
  const pkg = user.packageId as any;
  const limit = pkg.messageLimit;
  
  // 2. Perform atomic conditional update
  // We only increment if smsUsed + amount <= limit
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      $expr: { $lte: [{ $add: ["$smsUsed", amount] }, limit] }
    },
    {
      $inc: { smsUsed: amount }
    },
    { new: true }
  );
  
  if (!updatedUser) {
    throw new Error("INSUFFICIENT_SMS_QUOTA");
  }
  
  return true;
}

export async function releaseQuota(userId: string | mongoose.Types.ObjectId, amount: number) {
  if (amount <= 0) return;
  
  // Release quota, ensuring we never drop below 0
  await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { smsUsed: -amount } }
  );
  
  // Clamp to 0 if it somehow went negative
  await User.updateMany(
    { _id: userId, smsUsed: { $lt: 0 } },
    { $set: { smsUsed: 0 } }
  );
}
