import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../lib/db/models/User";
import { Campaign } from "../lib/db/models/Campaign";
import {
  calculateSmsEncoding,
  calculateCharacterCount,
  calculateSmsSegments,
  getSmsStats,
} from "../server/utils/sms";

dotenv.config({ path: ".env.local" });

async function runTests() {
  console.log("==========================================");
  console.log("    RUNNING SMS COMPOSER TEST SUITE       ");
  console.log("==========================================");

  // 1. Test SMS Math Utilities
  console.log("\n[1] Testing SMS Math Utilities...");

  // Test GSM-7 basic
  const gsmMsg = "Hello Rahul, Get 30% OFF on your next order! Use code DIWALI30 today.";
  const gsmEncoding = calculateSmsEncoding(gsmMsg);
  const gsmCount = calculateCharacterCount(gsmMsg);
  const gsmSegments = calculateSmsSegments(gsmMsg);
  const gsmStats = getSmsStats(gsmMsg);

  if (gsmEncoding !== "GSM-7" || gsmSegments !== 1) {
    throw new Error(`GSM-7 test failed: encoding=${gsmEncoding}, segments=${gsmSegments}`);
  }
  console.log(`✓ GSM-7 Message (83 chars): ${gsmStats.characterCount} chars, ${gsmStats.segmentCount} segment, remaining ${gsmStats.remainingInSegment}`);

  // Test Extended GSM-7 chars (| ^ { } [ ] ~ € \)
  const extMsg = "Special offer for {name} with code [SPECIAL]!";
  const extCount = calculateCharacterCount(extMsg); // '{', '}', '[', ']' count as 2 chars each
  if (extCount !== extMsg.length + 4) {
    throw new Error(`GSM-7 extended character test failed: got ${extCount}, expected ${extMsg.length + 4}`);
  }
  console.log(`✓ GSM-7 Extended chars test passed (chars counted as 2 units).`);

  // Test Unicode detection (Emoji / Hindi / non-GSM7)
  const unicodeMsg = "Hi Rahul! 🎉 Special Diwali discount 30% off ₹1000";
  const uniEncoding = calculateSmsEncoding(unicodeMsg);
  const uniStats = getSmsStats(unicodeMsg);

  if (uniEncoding !== "Unicode") {
    throw new Error(`Unicode detection failed! Got ${uniEncoding}`);
  }
  console.log(`✓ Unicode Message detected: encoding=${uniStats.encoding}, chars=${uniStats.characterCount}, segments=${uniStats.segmentCount}, remaining=${uniStats.remainingInSegment}`);

  // Test multi-segment calculation
  const longGsmMsg = "A".repeat(200);
  const longStats = getSmsStats(longGsmMsg);
  if (longStats.segmentCount !== 2 || longStats.remainingInSegment !== (2 * 153 - 200)) {
    throw new Error(`Multi-segment GSM-7 test failed: got ${longStats.segmentCount} segments`);
  }
  console.log(`✓ Multi-segment GSM-7 (200 chars -> 2 segments of 153 chars) test passed.`);

  // 2. Test Mongoose Model & Backend Persistence
  console.log("\n[2] Testing Database Persistence & Metadata Recalculation...");
  await mongoose.connect(process.env.MONGODB_URI || "");

  await User.deleteMany({ email: "composer_test_user@example.com" });
  const testUser = await User.create({
    email: "composer_test_user@example.com",
    name: "Composer Test User",
    passwordHash: "dummy_hash",
    role: "USER",
  });

  await Campaign.deleteMany({ userId: testUser._id });

  // Test POST draft creation with server recalculation
  const draftMessage = "Hi {{name}}, get 20% OFF at {{company}}! 🎁";
  const calculatedStats = getSmsStats(draftMessage);

  const campaign = await Campaign.create({
    userId: testUser._id,
    name: "Diwali Promo Test",
    message: draftMessage,
    status: "draft",
    targetType: "GROUP",
    characterCount: calculatedStats.characterCount,
    segmentCount: calculatedStats.segmentCount,
    encoding: calculatedStats.encoding,
    recipientCount: 0,
  });

  if (!campaign._id) throw new Error("Failed to persist campaign");
  if (campaign.status !== "draft") throw new Error(`Expected status 'draft', got '${campaign.status}'`);
  if (campaign.encoding !== "Unicode") throw new Error(`Expected encoding 'Unicode', got '${campaign.encoding}'`);
  console.log(`✓ Saved Campaign Draft persisted: ID=${campaign._id}, status=${campaign.status}, encoding=${campaign.encoding}, segments=${campaign.segmentCount}`);

  // Test PUT draft update
  const updatedMessage = "Hello {{name}}, update from {{company}}!";
  const updatedStats = getSmsStats(updatedMessage);

  campaign.message = updatedMessage;
  campaign.characterCount = updatedStats.characterCount;
  campaign.segmentCount = updatedStats.segmentCount;
  campaign.encoding = updatedStats.encoding;
  await campaign.save();

  const fetchedCampaign = await Campaign.findById(campaign._id);
  if (fetchedCampaign?.message !== updatedMessage) {
    throw new Error("Campaign update failed");
  }
  if (fetchedCampaign?.encoding !== "GSM-7") {
    throw new Error(`Updated encoding should be GSM-7, got ${fetchedCampaign?.encoding}`);
  }
  console.log(`✓ Updated Campaign Draft verified: message updated, encoding recalculated to ${fetchedCampaign.encoding}`);

  // Cleanup
  await Campaign.deleteMany({ userId: testUser._id });
  await User.deleteMany({ email: "composer_test_user@example.com" });
  await mongoose.disconnect();

  console.log("\n==========================================");
  console.log("   ALL SMS COMPOSER TESTS PASSED! ✅      ");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
