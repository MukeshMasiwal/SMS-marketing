import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth";
import { connectToDatabase } from "../../lib/db/connection";
import { Contact } from "../../lib/db/models/Contact";
import { Group } from "../../lib/db/models/Group";
import { Message } from "../../lib/db/models/Message";
import { getSmsProvider } from "../../lib/providers/sms";
import {
  validateTemplateVariables,
  renderMessageTemplate,
} from "../../lib/services/template-service";
import { normalizeIndianPhoneNumber } from "../../lib/validations/sms";

export interface SendMessageBatchInput {
  recipientType: "individual" | "group";
  contactIds?: string[];
  groupId?: string;
  message: string;
  fallbackName?: string;
}

/**
 * Send personalized SMS messages to single or multiple contacts/groups in controlled batch mode.
 */
export async function sendMessageBatch(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required." },
      });
    }

    const {
      recipientType,
      contactIds,
      groupId,
      message: templateText,
      fallbackName = "Customer",
    }: SendMessageBatchInput = req.body;

    // 1. Validate message text
    if (!templateText || !templateText.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Message content cannot be empty." },
      });
    }

    // 2. Validate template placeholders (reject unsupported variables like {{random}})
    const validation = validateTemplateVariables(templateText);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported placeholder variable(s): {{${validation.invalidVariables.join(
            "}}, {{"
          )}}}. Supported variables are {{name}}, {{phone}}, and {{campaign_name}}.`,
        },
      });
    }

    await connectToDatabase();

    // 3. Resolve target contacts for the authenticated user
    let contacts: any[] = [];

    if (recipientType === "group") {
      if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({
          success: false,
          error: { message: "A valid contact group ID must be provided." },
        });
      }

      // Authorize group ownership
      const groupDoc = await Group.findOne({ _id: groupId, userId });
      if (!groupDoc) {
        return res.status(404).json({
          success: false,
          error: { message: "Selected contact group not found or access denied." },
        });
      }

      // Fetch all contacts belonging to this group and user
      contacts = await Contact.find({
        userId,
        $or: [{ groupId }, { groupIds: groupId }],
      });
    } else if (recipientType === "individual") {
      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: "Please select at least one contact recipient." },
        });
      }

      const validContactIds = contactIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validContactIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: "No valid contact IDs provided." },
        });
      }

      contacts = await Contact.find({
        userId,
        _id: { $in: validContactIds },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid recipient type. Must be 'individual' or 'group'." },
      });
    }

    if (contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "No contacts found for the selected recipient criteria." },
      });
    }

    // 4. Controlled Concurrency Batch Processing (Batch size: 5)
    const provider = getSmsProvider();
    const BATCH_SIZE = 5;
    let sentCount = 0;
    let failedCount = 0;
    const failures: Array<{ contactId: string; name?: string; phone: string; reason: string }> = [];
    const createdLogs: any[] = [];

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (contact) => {
          const rawPhone = contact.phone || "";
          const normalizedPhone = normalizeIndianPhoneNumber(rawPhone);

          if (!normalizedPhone) {
            failedCount++;
            const failureReason = "Invalid Indian phone number format.";
            failures.push({
              contactId: contact._id.toString(),
              name: contact.name,
              phone: rawPhone,
              reason: failureReason,
            });
            return;
          }

          // Per-recipient template rendering
          const personalizedText = renderMessageTemplate(
            templateText,
            { name: contact.name, phone: normalizedPhone },
            undefined,
            fallbackName
          );

          // Dispatch SMS through Exotel provider
          const result = await provider.sendSms({
            recipient: normalizedPhone,
            message: personalizedText,
          });

          // Store Message record with actual rendered message
          const msgLog = await Message.create({
            messageId: result.messageId || `exotel_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId,
            recipient: normalizedPhone,
            message: personalizedText,
            status: result.status,
            provider: "exotel",
            errorMessage: result.errorMessage,
          });

          createdLogs.push(msgLog);

          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
            failures.push({
              contactId: contact._id.toString(),
              name: contact.name,
              phone: normalizedPhone,
              reason: result.errorMessage || "Exotel API delivery failed",
            });
          }
        })
      );
    }

    return res.status(200).json({
      success: true,
      message: `Batch send complete: ${sentCount} sent, ${failedCount} failed.`,
      data: {
        total: contacts.length,
        sent: sentCount,
        failed: failedCount,
        failures,
      },
    });
  } catch (err: any) {
    console.error("Error in sendMessageBatch:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to process personalized message batch." },
    });
  }
}

/**
 * Get message delivery logs for the authenticated user
 */
export async function getMessageLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required." },
      });
    }

    await connectToDatabase();

    const messages = await Message.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: { messages },
    });
  } catch (err: any) {
    console.error("Error in getMessageLogs:", err);
    return res.status(500).json({
      success: false,
      error: { message: err.message || "Failed to retrieve message logs." },
    });
  }
}
