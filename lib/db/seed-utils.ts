import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models/User";
import { Package } from "./models/Package";

export const DEFAULT_PACKAGES = [
  {
    name: "Free",
    price: 0,
    messageLimit: 1000,
    validity: 30,
    popular: false,
    buttonText: "Start Free",
    features: ["1,000 SMS Credits", "Contact Management", "Basic Analytics", "Community Support"],
    isActive: true,
  },
  {
    name: "Starter",
    price: 499,
    messageLimit: 10000,
    validity: 30,
    popular: false,
    buttonText: "Get Started",
    features: ["10,000 SMS Credits", "Bulk Campaigns", "Contact Management", "Email Support"],
    isActive: true,
  },
  {
    name: "Growth",
    price: 999,
    messageLimit: 25000,
    validity: 30,
    popular: true,
    buttonText: "Choose Growth",
    features: ["25,000 SMS Credits", "Advanced Analytics", "Priority Support", "Real SMS Provider"],
    isActive: true,
  },
  {
    name: "Business",
    price: 1999,
    messageLimit: 100000,
    validity: 30,
    popular: false,
    buttonText: "Get Started",
    features: ["100,000 SMS Credits", "Advanced Analytics", "24/7 Phone Support", "Dedicated Account Manager"],
    isActive: true,
  },
];

let isSeededInProcess = false;

export async function ensureDemoAccountsSeeded(): Promise<void> {
  if (isSeededInProcess) return;

  try {
    if (mongoose.connection.readyState !== 1) {
      console.log(`⏳ Waiting for active MongoDB connection (readyState: ${mongoose.connection.readyState})...`);
      return;
    }

    // Fast check: Return immediately if both required demo accounts exist and are verified
    const existingCount = await User.countDocuments({
      email: { $in: ["admin@example.com", "user@example.com"] },
      emailVerified: true,
    });

    if (existingCount >= 2) {
      isSeededInProcess = true;
      return;
    }

    console.log("Checking demo accounts...");

    // 1. Ensure default packages exist if missing
    const packageCount = await Package.countDocuments();
    let freePackageId: mongoose.Types.ObjectId | undefined;

    if (packageCount === 0) {
      for (const pkg of DEFAULT_PACKAGES) {
        try {
          const doc = await Package.findOneAndUpdate(
            { name: pkg.name },
            { $set: pkg },
            { upsert: true, returnDocument: "after" }
          );
          if (pkg.name === "Free") freePackageId = doc._id as mongoose.Types.ObjectId;
        } catch {
          // Concurrency safe fallback
        }
      }
    } else {
      const freePkg = await Package.findOne({ name: "Free" });
      if (freePkg) freePackageId = freePkg._id as mongoose.Types.ObjectId;
    }

    // 2. Seed Admin User
    await seedDemoUser("admin@example.com", "Demo Admin", "Admin@12345", "admin", 0, freePackageId);

    // 3. Seed Normal User
    await seedDemoUser("user@example.com", "Demo User", "User@12345", "user", 25, freePackageId);

    isSeededInProcess = true;
  } catch (err: any) {
    console.warn(`⚠️ Demo account seeding check warning: ${err?.message || err}`);
  }
}

export async function seedDemoUser(
  email: string,
  name: string,
  rawPass: string,
  targetRole: "user" | "admin",
  defaultSmsUsed: number,
  packageId?: mongoose.Types.ObjectId
) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing && existing.emailVerified && existing.passwordHash) {
      const isMatch = await bcrypt.compare(rawPass, existing.passwordHash);
      if (isMatch) {
        console.log(`Demo account already exists: [${normalizedEmail}]`);
        return existing;
      }
    }

    const passwordHash = existing && existing.passwordHash && (await bcrypt.compare(rawPass, existing.passwordHash))
      ? existing.passwordHash
      : await bcrypt.hash(rawPass, 10);

    const userDoc = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          name,
          email: normalizedEmail,
          passwordHash,
          role: existing ? existing.role : targetRole,
          emailVerified: true,
          packageId: packageId || existing?.packageId,
          smsUsed: existing?.smsUsed ?? defaultSmsUsed,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    console.log(`Created demo account: [${userDoc.email}]`);
    return userDoc;
  } catch (err: any) {
    if (err.code === 11000) {
      // E11000 duplicate key race condition handled safely across serverless instances
      console.log(`Demo account creation race condition handled safely: [${normalizedEmail}]`);
      return User.findOne({ email: normalizedEmail });
    }
    throw err;
  }
}
