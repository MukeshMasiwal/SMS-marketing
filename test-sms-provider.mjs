import { config } from "dotenv";
import mongoose from "mongoose";
import { User } from "./lib/db/models/User.ts";
import { Message } from "./lib/db/models/Message.ts";
import { getSmsProvider } from "./lib/providers/sms/index.ts";

config({ path: ".env.local" });

async function runTest() {
  console.log("Connecting to Database...");
  await mongoose.connect(process.env.MONGODB_URI || "");
  console.log("Connected.");

  console.log("Creating Test User...");
  await User.deleteMany({ email: "sms-tester@example.com" });
  const user = await User.create({ email: "sms-tester@example.com", name: "SMS Tester", passwordHash: "password", role: "USER" });

  console.log("Initializing SMS Provider...");
  const provider = getSmsProvider();
  
  // Verify it returns the dummy provider
  if (provider.constructor.name !== "DummySmsProvider") {
    throw new Error("TEST FAILED: getSmsProvider() did not return DummySmsProvider");
  }
  console.log("✓ Provider factory works.");

  console.log("Sending successful test SMS (+910000000003)...");
  const successResult = await provider.sendSms({ recipient: "+910000000003", message: "Hello Success" });
  
  if (!successResult.success || !successResult.messageId || successResult.status !== "SENT") {
    throw new Error("TEST FAILED: Successful deterministic number failed to return correct result.");
  }
  console.log("✓ sendSms() success deterministic behavior works.");

  console.log("Sending failing test SMS (+910000000002)...");
  const failResult = await provider.sendSms({ recipient: "+910000000002", message: "Hello Fail" });
  
  if (failResult.success || failResult.status !== "FAILED") {
    throw new Error("TEST FAILED: Failing deterministic number did not fail properly.");
  }
  console.log("✓ sendSms() failure deterministic behavior works.");

  console.log("Simulating API saving to Message collection...");
  await Message.deleteMany({ userId: user._id });
  
  const msgRecord = await Message.create({
    messageId: successResult.messageId,
    userId: user._id,
    recipient: "+910000000003",
    message: "Hello Success",
    status: successResult.status,
    provider: successResult.provider,
  });

  const savedMsg = await Message.findOne({ messageId: successResult.messageId });
  if (!savedMsg || savedMsg.status !== "SENT" || savedMsg.provider !== "dummy") {
    throw new Error("TEST FAILED: Message persistence failed or stored incorrect data.");
  }
  console.log("✓ Message persistence works correctly.");

  console.log("Checking getMessageStatus()...");
  const status = await provider.getMessageStatus(successResult.messageId as string);
  if (status !== "SENT") { // Since +910000000003 stays stuck in SENT in our dummy logic
    throw new Error(`TEST FAILED: getMessageStatus() returned ${status} instead of SENT.`);
  }
  console.log("✓ getMessageStatus() works correctly.");

  console.log("All SMS Provider tests passed!");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test execution failed:");
  console.error(err);
  process.exit(1);
});
