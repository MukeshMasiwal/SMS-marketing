import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables (.env.local if present, or existing environment)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import { connectToDatabase } from "../lib/db/connection";
import { Package } from "../lib/db/models/Package";
import { User } from "../lib/db/models/User";
import { Contact } from "../lib/db/models/Contact";
import { Group } from "../lib/db/models/Group";
import { Campaign } from "../lib/db/models/Campaign";
import { Message } from "../lib/db/models/Message";
import { seedDemoUser } from "../lib/db/seed-utils";

const DEFAULT_PACKAGES = [
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

const DEMO_NAMES = [
  "Rahul Sharma", "Priya Verma", "Amit Joshi", "Ananya Gupta", "Vikram Malhotra",
  "Neha Singh", "Rohan Mehta", "Siddharth Rao", "Pooja Patel", "Karan Kapoor",
  "Sneha Nair", "Aditya Bhat", "Meera Sen", "Arjun Reddy", "Kavya Iyer",
  "Deepak Kumar", "Divya Agarwal", "Manish Tiwari", "Shweta Pandey", "Rajesh Das",
  "Tarun Saxena", "Nisha Jain", "Abhishek Mishra", "Tanvi Shah", "Gaurav Verma",
  "Ritu Chaudhary", "Varun Sharma", "Preeti Kulkarni", "Sanjay Dutt", "Ankita Roy",
  "Harish Pillai", "Simran Gill", "Nikhil Chopra", "Swati Bose", "Alok Pandey",
  "Kirti Deshmukh", "Yash Sethi", "Bhavna Joshi", "Sameer Bhatt", "Ishita Saxena"
];

async function seed() {
  console.log("🔄 Connecting to MongoDB...");
  await connectToDatabase();

  // 1. Seed Packages
  console.log("\nSeeding packages...");
  const packageDocs: Record<string, any> = {};
  for (const pkg of DEFAULT_PACKAGES) {
    const doc = await Package.findOneAndUpdate(
      { name: pkg.name },
      { $set: pkg },
      { upsert: true, returnDocument: "after" }
    );
    packageDocs[pkg.name] = doc;
  }
  console.log(`✓ ${Object.keys(packageDocs).length} packages ready`);

  // 3. Seed Admin User
  console.log("\nSeeding admin account...");
  const adminEmail = "admin@example.com";
  const adminUser = await seedDemoUser(adminEmail, "Demo Admin", "Admin@12345", "admin", 0, packageDocs["Free"]?._id);

  // 4. Seed Normal User
  console.log("Seeding demo normal user account...");
  const userEmail = "user@example.com";
  const demoUser = await seedDemoUser(userEmail, "Demo User", "User@12345", "user", 25, packageDocs["Free"]?._id);

  if (!adminUser || !demoUser) {
    throw new Error("Failed to seed admin or demo user");
  }

  // 5. Seed 40 Demo Contacts (+919800000001 through +919800000040)
  console.log("\nSeeding 40 realistic demo contacts...");
  const contactDocs: any[] = [];
  for (let i = 0; i < 40; i++) {
    const numStr = String(i + 1).padStart(4, "0");
    const phone = `+91980000${numStr}`;
    const name = DEMO_NAMES[i];
    const firstName = name.split(" ")[0].toLowerCase();
    const email = `${firstName}.${numStr}@example.com`;

    let tags = ["Customer"];
    if (i < 10) tags = ["VIP", "Customer"];
    else if (i >= 10 && i < 25) tags = ["Lead"];
    else if (i >= 25 && i < 35) tags = ["Subscriber"];

    const doc = await Contact.findOneAndUpdate(
      { userId: demoUser._id, phone },
      {
        $set: {
          userId: demoUser._id,
          name,
          phone,
          email,
          tags,
          status: "SUBSCRIBED",
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    contactDocs.push(doc);
  }
  console.log(`✓ ${contactDocs.length} demo contacts seeded`);

  // 6. Seed 5 Groups
  console.log("\nSeeding 5 demo groups...");

  // Customers (Contacts 0 to 19)
  const customersGroup = await Group.findOneAndUpdate(
    { userId: demoUser._id, name: "Customers" },
    {
      $set: {
        userId: demoUser._id,
        name: "Customers",
        description: "Active purchasing customers",
        contactIds: contactDocs.slice(0, 20).map((c) => c._id),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // Leads (Contacts 10 to 24)
  const leadsGroup = await Group.findOneAndUpdate(
    { userId: demoUser._id, name: "Leads" },
    {
      $set: {
        userId: demoUser._id,
        name: "Leads",
        description: "Potential lead prospects",
        contactIds: contactDocs.slice(10, 25).map((c) => c._id),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // VIP Customers (Contacts 0 to 9)
  const vipGroup = await Group.findOneAndUpdate(
    { userId: demoUser._id, name: "VIP Customers" },
    {
      $set: {
        userId: demoUser._id,
        name: "VIP Customers",
        description: "High-value VIP accounts",
        contactIds: contactDocs.slice(0, 10).map((c) => c._id),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // New Subscribers (Contacts 25 to 34)
  const subscribersGroup = await Group.findOneAndUpdate(
    { userId: demoUser._id, name: "New Subscribers" },
    {
      $set: {
        userId: demoUser._id,
        name: "New Subscribers",
        description: "Recently subscribed users",
        contactIds: contactDocs.slice(25, 35).map((c) => c._id),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // Inactive Customers (Contacts 35 to 39)
  const inactiveGroup = await Group.findOneAndUpdate(
    { userId: demoUser._id, name: "Inactive Customers" },
    {
      $set: {
        userId: demoUser._id,
        name: "Inactive Customers",
        description: "Dormant contacts requiring re-engagement",
        contactIds: contactDocs.slice(35, 40).map((c) => c._id),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log("✓ 5 Groups seeded (Customers, Leads, VIP Customers, New Subscribers, Inactive Customers)");

  // 7. Seed 5 Campaigns with mixed statuses
  console.log("\nSeeding 5 demo campaigns...");

  // 1. Diwali Special Offer (completed)
  const campaign1 = await Campaign.findOneAndUpdate(
    { userId: demoUser._id, name: "Diwali Special Offer" },
    {
      $set: {
        userId: demoUser._id,
        name: "Diwali Special Offer",
        message: "Hi {{name}}, enjoy 30% off this Diwali! Use code DIWALI30 today.",
        targetType: "GROUP",
        targetGroupIds: [customersGroup._id],
        targetContactIds: [],
        status: "completed",
        recipientCount: 20,
        characterCount: 68,
        segmentCount: 1,
        encoding: "GSM-7",
        startedAt: new Date(Date.now() - 86400000 * 3),
        completedAt: new Date(Date.now() - 86400000 * 3 + 120000),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // 2. New Product Launch (completed)
  const campaign2 = await Campaign.findOneAndUpdate(
    { userId: demoUser._id, name: "New Product Launch" },
    {
      $set: {
        userId: demoUser._id,
        name: "New Product Launch",
        message: "Hi {{name}}, VIP exclusive preview of our new product lineup!",
        targetType: "GROUP",
        targetGroupIds: [vipGroup._id],
        targetContactIds: [],
        status: "completed",
        recipientCount: 10,
        characterCount: 61,
        segmentCount: 1,
        encoding: "GSM-7",
        startedAt: new Date(Date.now() - 86400000 * 2),
        completedAt: new Date(Date.now() - 86400000 * 2 + 60000),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // 3. Weekend Flash Sale (draft)
  const campaign3 = await Campaign.findOneAndUpdate(
    { userId: demoUser._id, name: "Weekend Flash Sale" },
    {
      $set: {
        userId: demoUser._id,
        name: "Weekend Flash Sale",
        message: "Hi {{name}}, weekend flash sale starts tomorrow! Use code FLASH20 today.",
        targetType: "GROUP",
        targetGroupIds: [leadsGroup._id],
        targetContactIds: [],
        status: "draft",
        recipientCount: 15,
        characterCount: 75,
        segmentCount: 1,
        encoding: "GSM-7",
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // 4. Customer Appreciation (scheduled)
  const campaign4 = await Campaign.findOneAndUpdate(
    { userId: demoUser._id, name: "Customer Appreciation" },
    {
      $set: {
        userId: demoUser._id,
        name: "Customer Appreciation",
        message: "Hi {{name}}, thank you for being a valued customer! Enjoy a special reward.",
        targetType: "GROUP",
        targetGroupIds: [customersGroup._id],
        targetContactIds: [],
        status: "scheduled",
        recipientCount: 20,
        characterCount: 78,
        segmentCount: 1,
        encoding: "GSM-7",
        scheduledAt: new Date(Date.now() + 86400000 * 2),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // 5. Welcome Campaign (failed)
  const campaign5 = await Campaign.findOneAndUpdate(
    { userId: demoUser._id, name: "Welcome Campaign" },
    {
      $set: {
        userId: demoUser._id,
        name: "Welcome Campaign",
        message: "Welcome {{name}}! Thank you for joining us.",
        targetType: "GROUP",
        targetGroupIds: [subscribersGroup._id],
        targetContactIds: [],
        status: "failed",
        recipientCount: 10,
        characterCount: 42,
        segmentCount: 1,
        encoding: "GSM-7",
        startedAt: new Date(Date.now() - 86400000),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log("✓ 5 Campaigns seeded (Diwali Special Offer, New Product Launch, Weekend Flash Sale, Customer Appreciation, Welcome Campaign)");

  // 8. Seed Message Logs for Completed and Failed Campaigns (without triggering Twilio)
  console.log("\nSeeding message delivery logs...");
  let seededMsgCount = 0;

  // Diwali Special Offer messages (20 contacts)
  const c1Contacts = contactDocs.slice(0, 20);
  for (let i = 0; i < c1Contacts.length; i++) {
    const c = c1Contacts[i];
    const messageId = `msg_seed_c1_${c._id}`;
    const status = i === 19 ? "FAILED" : "DELIVERED";

    await Message.findOneAndUpdate(
      { messageId },
      {
        $set: {
          messageId,
          userId: demoUser._id,
          campaignId: campaign1._id,
          recipient: c.phone,
          message: campaign1.message,
          status,
          provider: "DUMMY",
          errorMessage: status === "FAILED" ? "Simulated network timeout" : undefined,
        },
      },
      { upsert: true }
    );
    seededMsgCount++;
  }

  // New Product Launch messages (10 contacts)
  const c2Contacts = contactDocs.slice(0, 10);
  for (let i = 0; i < c2Contacts.length; i++) {
    const c = c2Contacts[i];
    const messageId = `msg_seed_c2_${c._id}`;

    await Message.findOneAndUpdate(
      { messageId },
      {
        $set: {
          messageId,
          userId: demoUser._id,
          campaignId: campaign2._id,
          recipient: c.phone,
          message: campaign2.message,
          status: "DELIVERED",
          provider: "DUMMY",
        },
      },
      { upsert: true }
    );
    seededMsgCount++;
  }

  // Welcome Campaign messages (10 contacts, failed status)
  const c5Contacts = contactDocs.slice(25, 35);
  for (let i = 0; i < c5Contacts.length; i++) {
    const c = c5Contacts[i];
    const messageId = `msg_seed_c5_${c._id}`;

    await Message.findOneAndUpdate(
      { messageId },
      {
        $set: {
          messageId,
          userId: demoUser._id,
          campaignId: campaign5._id,
          recipient: c.phone,
          message: campaign5.message,
          status: "FAILED",
          provider: "DUMMY",
          errorMessage: "Provider gateway error",
        },
      },
      { upsert: true }
    );
    seededMsgCount++;
  }

  console.log(`✓ ${seededMsgCount} message log records seeded`);

  console.log("\n==========================================");
  console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
  console.log(`   Contacts:  ${contactDocs.length}`);
  console.log("   Groups:    5");
  console.log("   Campaigns: 5");
  console.log(`   Messages:  ${seededMsgCount}`);
  console.log("==========================================");

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB cleanly");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
