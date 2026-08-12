import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Package } from "../lib/db/models/Package";
import { User } from "../lib/db/models/User";
import { Contact } from "../lib/db/models/Contact";
import { Group } from "../lib/db/models/Group";
import { Campaign } from "../lib/db/models/Campaign";
import { Message } from "../lib/db/models/Message";

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

const DEMO_CONTACTS_DATA = [
  { name: "Rahul Sharma", phone: "+919876543210", email: "rahul@example.com", tags: ["Lead", "VIP"] },
  { name: "Priya Verma", phone: "+919876543211", email: "priya@example.com", tags: ["Lead"] },
  { name: "Aman Joshi", phone: "+919876543212", email: "aman@example.com", tags: ["Customer"] },
  { name: "Neha Singh", phone: "+919876543213", email: "neha@example.com", tags: ["Subscriber"] },
  { name: "Rohan Mehta", phone: "+919876543214", email: "rohan@example.com", tags: ["VIP"] },
];

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ Error: MONGODB_URI environment variable is missing in .env.local");
    process.exit(1);
  }

  console.log("🔄 Attempting MongoDB connection...");
  console.log("🔗 Connecting to MongoDB Atlas...");
  const conn = await mongoose.connect(MONGODB_URI);
  const dbName = conn.connection.db?.databaseName || conn.connection.name || "sms-marketing";
  console.log(`✅ MongoDB Atlas connected (${dbName})`);

  // 1. Seed Packages
  console.log("\nSeeding packages...");
  const packageDocs: Record<string, any> = {};
  for (const pkg of DEFAULT_PACKAGES) {
    const doc = await Package.findOneAndUpdate(
      { name: pkg.name },
      { $set: pkg },
      { upsert: true, returnDocument: 'after' }
    );
    packageDocs[pkg.name] = doc;
  }
  console.log(`✓ ${Object.keys(packageDocs).length} packages seeded successfully`);

  // 2. Hash Passwords
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const userPasswordHash = await bcrypt.hash("User@12345", 10);

  // 3. Seed Admin User
  console.log("\nSeeding admin account...");
  const adminEmail = "admin@example.com";
  const adminUser = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: "Demo Admin",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        packageId: packageDocs["Free"]?._id,
        smsUsed: 0,
        isActive: true,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`✓ Admin user ready: ${adminUser.email} (ID: ${adminUser._id})`);

  // 4. Seed Normal User
  console.log("Seeding demo normal user account...");
  const userEmail = "user@example.com";
  const demoUser = await User.findOneAndUpdate(
    { email: userEmail },
    {
      $set: {
        name: "Demo User",
        email: userEmail,
        passwordHash: userPasswordHash,
        role: "USER",
        packageId: packageDocs["Free"]?._id,
        smsUsed: 5,
        isActive: true,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`✓ Demo user ready: ${demoUser.email} (ID: ${demoUser._id})`);

  // 5. Seed Contacts for Demo User
  console.log("\nSeeding demo contacts for user@example.com...");
  const contactIds: mongoose.Types.ObjectId[] = [];
  for (const contactData of DEMO_CONTACTS_DATA) {
    const contactDoc = await Contact.findOneAndUpdate(
      { userId: demoUser._id, phone: contactData.phone },
      {
        $set: {
          userId: demoUser._id,
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email,
          tags: contactData.tags,
          status: "SUBSCRIBED",
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    contactIds.push(contactDoc._id as mongoose.Types.ObjectId);
  }
  console.log(`✓ ${contactIds.length} demo contacts seeded`);

  // 6. Seed Contact Group "Marketing Leads"
  console.log("Seeding contact group 'Marketing Leads'...");
  const group = await Group.findOneAndUpdate(
    { userId: demoUser._id, name: "Marketing Leads" },
    {
      $set: {
        userId: demoUser._id,
        name: "Marketing Leads",
        description: "Primary group for SMS marketing lead campaigns",
        contactIds: contactIds,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`✓ Group 'Marketing Leads' seeded (ID: ${group._id})`);

  // 7. Seed Campaign "Welcome Campaign"
  console.log("Seeding demo campaign 'Welcome Campaign'...");
  const campaign = await Campaign.findOneAndUpdate(
    { userId: demoUser._id, name: "Welcome Campaign" },
    {
      $set: {
        userId: demoUser._id,
        name: "Welcome Campaign",
        message: "Welcome to our SMS marketing platform!",
        targetType: "GROUP",
        targetGroupIds: [group._id],
        targetContactIds: [],
        status: "COMPLETED",
        recipientCount: DEMO_CONTACTS_DATA.length,
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`✓ Campaign 'Welcome Campaign' seeded (ID: ${campaign._id})`);

  // 8. Seed Message Log Records
  console.log("Seeding demo message logs...");
  const messageStatuses: Array<"DELIVERED" | "SENT" | "FAILED"> = [
    "DELIVERED",
    "DELIVERED",
    "DELIVERED",
    "SENT",
    "FAILED",
  ];

  for (let i = 0; i < DEMO_CONTACTS_DATA.length; i++) {
    const contact = DEMO_CONTACTS_DATA[i];
    const status = messageStatuses[i];
    const messageId = `msg_seed_demo_${i + 1}`;

    await Message.findOneAndUpdate(
      { messageId },
      {
        $set: {
          messageId,
          userId: demoUser._id,
          campaignId: campaign._id,
          recipient: contact.phone,
          message: "Welcome to our SMS marketing platform!",
          status,
          provider: "DUMMY",
          errorMessage: status === "FAILED" ? "Simulated network failure" : undefined,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log("✓ 5 demo message records seeded");

  // 9. Verification Query
  console.log("\n🔍 Verifying seeded users in User collection...");
  const allUsers = await User.find({}).select("email role isActive createdAt");
  console.log(`✓ Found ${allUsers.length} user(s) in database:`);
  allUsers.forEach((u) => {
    console.log(`   - Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive}`);
  });

  console.log("\n🎉 Seed completed successfully!");
  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB Atlas cleanly");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
