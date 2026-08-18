import mongoose from "mongoose";
import { Campaign, ICampaign } from "../db/models/Campaign";
import { Contact, IContact } from "../db/models/Contact";
import { Group } from "../db/models/Group";
import { Message } from "../db/models/Message";
import { getSmsProvider } from "../providers/sms";
import { reserveQuota, releaseQuota } from "./quota-service";

import { renderMessageTemplate } from "./template-service";

/**
 * Resolves, deduplicates, and filters recipients for a campaign.
 */
export async function resolveCampaignRecipients(
  campaign: Pick<ICampaign, "targetType" | "targetContactIds" | "targetGroupIds">,
  userId: string | mongoose.Types.ObjectId
): Promise<IContact[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  let resolvedContacts: IContact[] = [];

  if (campaign.targetType === "CONTACTS") {
    // Fetch individual contacts
    const contacts = await Contact.find({
      _id: { $in: campaign.targetContactIds },
      userId: userObjectId,
    });

    if (contacts.length !== campaign.targetContactIds.length) {
      throw new Error("UNAUTHORIZED: One or more contacts do not belong to you or do not exist.");
    }
    resolvedContacts = contacts;
  } else if (campaign.targetType === "GROUP") {
    // Fetch groups to verify ownership
    const groups = await Group.find({
      _id: { $in: campaign.targetGroupIds },
      userId: userObjectId,
    });

    if (groups.length !== campaign.targetGroupIds.length) {
      throw new Error("UNAUTHORIZED: One or more groups do not belong to you or do not exist.");
    }

    // Collect all contact IDs from the groups
    const contactIds = groups.flatMap((g) => g.contactIds);

    // Fetch the actual contacts
    resolvedContacts = await Contact.find({
      _id: { $in: contactIds },
      userId: userObjectId,
    });
  }

  // 1. Filter out unsubscribed
  // 2. Deduplicate by stringified _id
  const uniqueContactIds = new Set<string>();
  const eligibleRecipients: IContact[] = [];

  for (const contact of resolvedContacts) {
    const idStr = contact._id.toString();
    if (contact.status === "SUBSCRIBED" && !uniqueContactIds.has(idStr)) {
      uniqueContactIds.add(idStr);
      eligibleRecipients.push(contact);
    }
  }

  return eligibleRecipients;
}

/**
 * Executes a campaign by creating messages and dispatching them in batches.
 */
export async function executeCampaign(campaignId: string, userId: string): Promise<void> {
  const campaign = await Campaign.findOne({ _id: campaignId, userId });
  
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.status !== "DRAFT") {
    throw new Error(`Cannot send campaign in ${campaign.status} status.`);
  }

  // 1. Resolve recipients again immediately before sending
  const recipients = await resolveCampaignRecipients(campaign, userId);

  if (recipients.length === 0) {
    campaign.status = "FAILED";
    await campaign.save();
    throw new Error("No eligible recipients found. Campaign marked as FAILED.");
  }

  // Atomically reserve quota for the required recipients
  await reserveQuota(userId, recipients.length);

  // 2. Set campaign status to SENDING
  campaign.status = "SENDING";
  campaign.startedAt = new Date();
  campaign.recipientCount = recipients.length; // Final snapshot count
  await campaign.save();

  // 3. Create Message records as QUEUED with per-recipient personalized message
  const messageRecords = await Message.insertMany(
    recipients.map((recipient) => {
      const personalizedMessage = renderMessageTemplate(campaign.message, recipient, campaign);
      return {
        messageId: `init_${new mongoose.Types.ObjectId().toString()}`,
        userId,
        campaignId,
        recipient: recipient.phone,
        message: personalizedMessage,
        status: "QUEUED",
        provider: "pending",
      };
    })
  );

  // 4. Send in controlled batches
  const BATCH_SIZE = 10;
  const provider = getSmsProvider();
  let hasSystemicError = false;

  for (let i = 0; i < messageRecords.length; i += BATCH_SIZE) {
    // Before each batch, reload campaign to check for CANCELLED
    const currentCampaignState = await Campaign.findById(campaignId).select("status");
    if (currentCampaignState?.status === "CANCELLED") {
      console.log(`Campaign ${campaignId} was cancelled. Stopping execution at batch ${i}.`);
      return; // Stop processing further batches. Campaign remains CANCELLED.
    }

    const batch = messageRecords.slice(i, i + BATCH_SIZE);
    
    let batchFailures = 0;
    
    // Process batch concurrently (safe because it's limited to BATCH_SIZE)
    await Promise.all(
      batch.map(async (msg) => {
        try {
          const result = await provider.sendSms({
            recipient: msg.recipient,
            message: msg.message,
          });

          msg.status = result.status as any;
          msg.provider = result.provider;
          if (result.messageId) msg.messageId = result.messageId;
          if (result.errorMessage) msg.errorMessage = result.errorMessage;
          
        } catch (err: any) {
          msg.status = "FAILED" as any;
          msg.errorMessage = err.message || "Unknown provider failure";
          batchFailures++;
        }
        await msg.save();
      })
    ).catch(err => {
      console.error("Batch processing error:", err);
      hasSystemicError = true;
    });

    // Release quota for any failed messages in this batch
    if (batchFailures > 0) {
      await releaseQuota(userId, batchFailures);
    }
  }

  // 5. Finalize Campaign
  // Check if it was cancelled during the last batch execution
  const finalState = await Campaign.findById(campaignId).select("status");
  if (finalState?.status === "CANCELLED") {
    return;
  }

  if (hasSystemicError) {
    campaign.status = "FAILED";
  } else {
    campaign.status = "COMPLETED";
    campaign.completedAt = new Date();
  }

  await campaign.save();
}
