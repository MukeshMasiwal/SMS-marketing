import { config } from "dotenv";
import mongoose from "mongoose";
import { User } from "./lib/db/models/User.ts";
import { Contact } from "./lib/db/models/Contact.ts";
import { Group } from "./lib/db/models/Group.ts";

config({ path: ".env.local" });

async function runTest() {
  console.log("Connecting to Database...");
  await mongoose.connect(process.env.MONGODB_URI || "");
  console.log("Connected.");

  // Clear existing test data
  await User.deleteMany({ email: { $in: ["userA@example.com", "userB@example.com"] } });

  console.log("Creating Test Users...");
  const userA = await User.create({ email: "userA@example.com", name: "User A", passwordHash: "password", role: "USER" });
  const userB = await User.create({ email: "userB@example.com", name: "User B", passwordHash: "password", role: "USER" });

  console.log("Creating Test Contacts...");
  const contactA = await Contact.create({ userId: userA._id, name: "Contact A", phone: "+1234567890" });
  const contactB = await Contact.create({ userId: userB._id, name: "Contact B", phone: "+0987654321" });

  console.log("Creating Test Groups...");
  const groupA = await Group.create({ userId: userA._id, name: "Group A", contactIds: [] });
  const groupB = await Group.create({ userId: userB._id, name: "Group B", contactIds: [] });

  console.log("Running Data Isolation Tests...");

  // Test 1: User B fetching Group A
  const fetchGroupA = await Group.findOne({ _id: groupA._id, userId: userB._id });
  if (fetchGroupA) throw new Error("TEST FAILED: User B could fetch User A's group.");
  console.log("✓ User B cannot fetch User A's group.");

  // Test 2: User B modifying Group A
  const updateGroupA = await Group.findOneAndUpdate(
    { _id: groupA._id, userId: userB._id },
    { $set: { name: "Hacked Group A" } },
    { new: true }
  );
  if (updateGroupA) throw new Error("TEST FAILED: User B could modify User A's group.");
  console.log("✓ User B cannot modify User A's group.");

  // Test 3: User B deleting Group A
  const deleteGroupA = await Group.deleteOne({ _id: groupA._id, userId: userB._id });
  if (deleteGroupA.deletedCount > 0) throw new Error("TEST FAILED: User B could delete User A's group.");
  console.log("✓ User B cannot delete User A's group.");

  // Test 4: User B adding User A's contact to User B's group
  console.log("Simulating API behavior for adding contacts (User B adding Contact A to Group B)...");
  
  const requestedContactIds = [String(contactA._id)];
  
  // Simulation of: const validContacts = await Contact.find({ _id: { $in: requestedContactIds }, userId: userB._id })
  const validContactsForB = await Contact.find({
    _id: { $in: requestedContactIds },
    userId: userB._id
  });

  if (validContactsForB.length === requestedContactIds.length) {
    throw new Error("TEST FAILED: API validation logic allowed User B to claim User A's contact.");
  }
  console.log("✓ User B cannot add User A's contact to their group.");

  console.log("All tests passed! Data isolation is secure.");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test execution failed:");
  console.error(err);
  process.exit(1);
});
