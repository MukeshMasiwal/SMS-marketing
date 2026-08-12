import { config } from "dotenv";
import mongoose from "mongoose";
import { User } from "./lib/db/models/User.ts";
import { Contact } from "./lib/db/models/Contact.ts";
import { Group } from "./lib/db/models/Group.ts";
import { Campaign } from "./lib/db/models/Campaign.ts";
import { Message } from "./lib/db/models/Message.ts";
import { resolveCampaignRecipients, executeCampaign } from "./lib/services/campaign-service.ts";

config({ path: ".env.local" });

async function runTest() {
  console.log("Connecting to Database...");
  await mongoose.connect(process.env.MONGODB_URI || "");
  console.log("Connected.");

  console.log("Cleaning up old test data...");
  await User.deleteMany({ email: { $in: ["userA@campaign.test", "userB@campaign.test"] } });
  
  const userA = await User.create({ email: "userA@campaign.test", name: "User A", passwordHash: "password", role: "USER" });
  const userB = await User.create({ email: "userB@campaign.test", name: "User B", passwordHash: "password", role: "USER" });

  await Contact.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  await Group.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  await Campaign.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  await Message.deleteMany({ userId: { $in: [userA._id, userB._id] } });

  console.log("Creating Contacts for User A...");
  // 1 valid, 1 unsubscribed, 1 duplicate (added to two groups later)
  const contact1 = await Contact.create({ userId: userA._id, name: "Subscribed 1", phone: "+910000000001", status: "SUBSCRIBED" });
  const contact2 = await Contact.create({ userId: userA._id, name: "Unsubscribed", phone: "+910000000099", status: "UNSUBSCRIBED" });
  const contact3 = await Contact.create({ userId: userA._id, name: "Subscribed 2 (Fail)", phone: "+910000000002", status: "SUBSCRIBED" }); // using the failure dummy number

  console.log("Creating Groups for User A...");
  const group1 = await Group.create({ userId: userA._id, name: "Group 1", contactIds: [contact1._id, contact2._id, contact3._id] });
  const group2 = await Group.create({ userId: userA._id, name: "Group 2", contactIds: [contact3._id] }); // duplicate contact3

  console.log("Creating Campaign for User A...");
  const campaign = await Campaign.create({
    userId: userA._id,
    name: "Test Campaign",
    message: "Hello from test campaign!",
    targetType: "GROUP",
    targetGroupIds: [group1._id, group2._id],
    status: "DRAFT",
    recipientCount: 0
  });

  console.log("Testing Recipient Resolution...");
  const recipients = await resolveCampaignRecipients(campaign, userA._id.toString());
  
  if (recipients.length !== 2) {
    throw new Error(`TEST FAILED: Expected 2 recipients (filtered unsubscribed and deduplicated), got ${recipients.length}`);
  }
  console.log("✓ Recipient resolution correctly filters unsubscribed and deduplicates.");

  console.log("Testing Data Isolation: User B trying to execute User A's campaign...");
  try {
    await executeCampaign(campaign._id.toString(), userB._id.toString());
    throw new Error("TEST FAILED: User B was able to execute User A's campaign");
  } catch (err) {
    if (err.message !== "Campaign not found") {
      throw new Error(`TEST FAILED: Expected "Campaign not found", got "${err.message}"`);
    }
    console.log("✓ Data isolation protects campaign execution.");
  }

  console.log("Executing Campaign as User A...");
  await executeCampaign(campaign._id.toString(), userA._id.toString());

  console.log("Verifying Campaign Execution Results...");
  const updatedCampaign = await Campaign.findById(campaign._id);
  if (updatedCampaign?.status !== "COMPLETED") {
    throw new Error(`TEST FAILED: Campaign status is ${updatedCampaign?.status}, expected COMPLETED`);
  }
  if (updatedCampaign?.recipientCount !== 2) {
    throw new Error(`TEST FAILED: Campaign recipientCount is ${updatedCampaign?.recipientCount}, expected 2`);
  }
  
  const messages = await Message.find({ campaignId: campaign._id });
  if (messages.length !== 2) {
    throw new Error(`TEST FAILED: Expected 2 Message records, got ${messages.length}`);
  }

  const successMsg = messages.find(m => m.recipient === "+910000000001");
  const failMsg = messages.find(m => m.recipient === "+910000000002");

  if (!successMsg || successMsg.status !== "QUEUED") {
    throw new Error(`TEST FAILED: Message to +910000000001 should be QUEUED, was ${successMsg?.status}`);
  }

  if (!failMsg || failMsg.status !== "FAILED") {
    throw new Error(`TEST FAILED: Message to +910000000002 should be FAILED (dummy deterministic behaviour), was ${failMsg?.status}`);
  }

  console.log("✓ Messages successfully persisted with correct deterministic statuses.");
  console.log("All SMS Campaign Flow tests passed!");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test execution failed:");
  console.error(err);
  process.exit(1);
});
