import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models/User";
import { Package } from "./models/Package";
import { Template } from "./models/Template";

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

export const DEMO_TEMPLATES = [
  {
    name: "Welcome Message",
    message: "Hi {{name}}, welcome to our community! We're happy to have you with us. For assistance, contact us anytime.",
  },
  {
    name: "Special Offer",
    message: "Hi {{name}}, enjoy our special offer just for you! Visit us today and make the most of this limited-time deal.",
  },
  {
    name: "Campaign Promotion",
    message: "Hi {{name}}, check out our latest {{campaign_name}} campaign! Don't miss out on our special offers.",
  },
  {
    name: "Appointment Reminder",
    message: "Hi {{name}}, this is a reminder about your upcoming appointment. Please contact us if you need to make any changes.",
  },
  {
    name: "Order Update",
    message: "Hi {{name}}, your order has been updated. We will keep you informed about the next steps. Thank you for choosing us!",
  },
  {
    name: "Festival Greeting",
    message: "Hi {{name}}, wishing you and your family a wonderful festive season! Thank you for being a valued customer.",
  },
  {
    name: "Customer Feedback",
    message: "Hi {{name}}, we'd love to hear about your experience with us. Your feedback helps us serve you better. Thank you!",
  },
  {
    name: "Promotional Campaign",
    message: "Hi {{name}}, our {{campaign_name}} is now live! Explore our latest offers and discover something special today.",
  },
];

let isSeededInProcess = false;

export async function seedDemoTemplates(userId: mongoose.Types.ObjectId): Promise<number> {
  let createdCount = 0;
  for (const tmpl of DEMO_TEMPLATES) {
    const existing = await Template.findOne({ userId, name: tmpl.name });
    if (!existing) {
      await Template.create({
        userId,
        name: tmpl.name,
        message: tmpl.message,
      });
      createdCount++;
    }
  }
  return createdCount;
}

export async function ensureDemoAccountsSeeded(): Promise<void> {
  if (isSeededInProcess) return;

  try {
    if (mongoose.connection.readyState !== 1) {
      console.log(`⏳ Waiting for active MongoDB connection (readyState: ${mongoose.connection.readyState})...`);
      return;
    }

    // Fast check: Return immediately if all 3 required demo accounts exist and templates exist
    const existingCount = await User.countDocuments({
      email: { $in: ["superadmin@example.com", "admin@example.com", "user@example.com"] },
      emailVerified: true,
    });

    const demoUser = await User.findOne({ email: "user@example.com" });
    if (demoUser) {
      await seedDemoTemplates(demoUser._id as mongoose.Types.ObjectId);
    }

    if (existingCount >= 3) {
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

    // 2. Seed Super Admin User
    await seedDemoUser("superadmin@example.com", "Demo Super Admin", "SuperAdmin@12345", "SUPER_ADMIN", 0, freePackageId);

    // 3. Seed Admin User
    await seedDemoUser("admin@example.com", "Demo Admin", "Admin@12345", "ADMIN", 0, freePackageId);

    // 4. Seed Normal User
    const createdDemoUser = await seedDemoUser("user@example.com", "Demo User", "User@12345", "USER", 25, freePackageId);
    if (createdDemoUser) {
      await seedDemoTemplates(createdDemoUser._id as mongoose.Types.ObjectId);
    }

    isSeededInProcess = true;
  } catch (err: any) {
    console.warn(`⚠️ Demo account seeding check warning: ${err?.message || err}`);
  }
}

export async function seedDemoUser(
  email: string,
  name: string,
  rawPass: string,
  targetRole: "USER" | "ADMIN" | "SUPER_ADMIN" | "user" | "admin" | "super_admin",
  defaultSmsUsed: number,
  packageId?: mongoose.Types.ObjectId
) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = targetRole.toUpperCase() as "USER" | "ADMIN" | "SUPER_ADMIN";

  try {
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing && existing.emailVerified && existing.passwordHash) {
      const isMatch = await bcrypt.compare(rawPass, existing.passwordHash);
      if (isMatch && existing.role === normalizedRole && existing.isActive) {
        console.log(`Demo account already exists: [${normalizedEmail}] (${normalizedRole})`);
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
          role: normalizedRole,
          emailVerified: true,
          packageId: packageId || existing?.packageId,
          smsUsed: existing?.smsUsed ?? defaultSmsUsed,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    console.log(`Seeded demo account: [${userDoc.email}] role: ${userDoc.role}`);
    return userDoc;
  } catch (err: any) {
    if (err.code === 11000) {
      console.log(`Demo account creation race condition handled safely: [${normalizedEmail}]`);
      return User.findOne({ email: normalizedEmail });
    }
    throw err;
  }
}
