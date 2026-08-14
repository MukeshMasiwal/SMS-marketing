import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth";
import { Contact } from "../../lib/db/models/Contact";
import { Group } from "../../lib/db/models/Group";
import { Campaign } from "../../lib/db/models/Campaign";
import { parseContactFile } from "../../lib/utils/contact-parser";

export async function getContacts(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const search = req.query.search ? String(req.query.search).trim() : "";
    const groupId = req.query.groupId ? String(req.query.groupId).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "";

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "ALL") {
      filter.status = status.toUpperCase();
    }

    if (groupId) {
      if (mongoose.Types.ObjectId.isValid(groupId)) {
        const groupDoc = await Group.findOne({ _id: groupId, userId: new mongoose.Types.ObjectId(userId) });
        if (groupDoc) {
          filter._id = { $in: groupDoc.contactIds };
        } else {
          return res.json({ success: true, contacts: [] });
        }
      }
    }

    const contacts = await Contact.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, contacts, data: { contacts } });
  } catch (err: any) {
    console.error("Error fetching contacts:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to fetch contacts" },
    });
  }
}

export async function createContact(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const { name, phone, email, tags, status } = req.body;
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Name and phone are required" },
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const existing = await Contact.findOne({ userId: userObjectId, phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: "CONFLICT", message: "A contact with this phone number already exists." },
      });
    }

    const contact = await Contact.create({
      userId: userObjectId,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      tags: Array.isArray(tags) ? tags : [],
      status: status === "UNSUBSCRIBED" ? "UNSUBSCRIBED" : "SUBSCRIBED",
    });

    return res.status(201).json({ success: true, contact, data: { contact } });
  } catch (err: any) {
    console.error("Error creating contact:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to create contact" },
    });
  }
}

export async function updateContact(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid contact ID" } });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const contact = await Contact.findOne({ _id: id, userId: userObjectId });

    if (!contact) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Contact not found or access denied" } });
    }

    const { name, phone, email, tags, status } = req.body;
    if (name !== undefined) contact.name = name.trim();
    if (phone !== undefined) contact.phone = phone.trim();
    if (email !== undefined) contact.email = email ? email.trim() : undefined;
    if (tags !== undefined && Array.isArray(tags)) contact.tags = tags;
    if (status !== undefined) contact.status = status;

    await contact.save();
    return res.json({ success: true, contact, data: { contact } });
  } catch (err: any) {
    console.error("Error updating contact:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to update contact" },
    });
  }
}

export async function deleteContact(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid contact ID" } });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const contact = await Contact.findOne({ _id: id, userId: userObjectId });

    if (!contact) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Contact not found or access denied" } });
    }

    const contactObjectId = contact._id;

    // Remove contact document
    await Contact.deleteOne({ _id: contactObjectId, userId: userObjectId });

    // Clean references from Group documents
    await Group.updateMany(
      { userId: userObjectId, contactIds: contactObjectId },
      { $pull: { contactIds: contactObjectId } }
    );

    // Clean references from Campaign documents
    await Campaign.updateMany(
      { userId: userObjectId, targetContactIds: contactObjectId },
      { $pull: { targetContactIds: contactObjectId } }
    );

    return res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (err: any) {
    console.error("Error deleting contact:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to delete contact" },
    });
  }
}

export async function importContacts(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Express boundary buffer parsing for multipart/form-data or JSON file payload
    let fileBuffer: Buffer | null = null;
    let fileName = "contacts.csv";
    let groupId: string | null = null;
    let newGroupName: string | null = null;

    if (req.body && Buffer.isBuffer(req.body)) {
      fileBuffer = req.body;
    } else if (req.body && typeof req.body === "object") {
      if (req.body.groupId) groupId = String(req.body.groupId);
      if (req.body.newGroupName) newGroupName = String(req.body.newGroupName);

      if (req.body.fileData) {
        // Base64 file contents
        fileBuffer = Buffer.from(req.body.fileData, "base64");
        if (req.body.fileName) fileName = req.body.fileName;
      }
    }

    // Fallback: parse raw body if sent as raw binary
    if (!fileBuffer && (req as any).rawBody) {
      fileBuffer = (req as any).rawBody;
    }

    if (!fileBuffer && (req as any).files && (req as any).files.file) {
      const f = (req as any).files.file;
      fileBuffer = f.data || f.buffer;
      if (f.name) fileName = f.name;
    }

    // If groupId or newGroupName passed in headers/query
    if (!groupId && req.query.groupId) groupId = String(req.query.groupId);
    if (!newGroupName && req.query.newGroupName) newGroupName = String(req.query.newGroupName);

    if (!fileBuffer) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "No file content uploaded. Please select a file." },
      });
    }

    // If on-the-fly group creation requested
    let groupDoc: InstanceType<typeof Group> | null = null;

    if (newGroupName && newGroupName.trim()) {
      groupDoc = await Group.findOne({ userId: userObjectId, name: newGroupName.trim() });
      if (!groupDoc) {
        groupDoc = await Group.create({
          userId: userObjectId,
          name: newGroupName.trim(),
          description: "Created during contact import",
          contactIds: [],
        });
      }
      groupId = String(groupDoc._id);
    } else if (groupId && mongoose.Types.ObjectId.isValid(groupId)) {
      groupDoc = await Group.findOne({ _id: groupId, userId: userObjectId });
    }

    const parseResult = parseContactFile(fileBuffer, fileName);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_FILE", message: parseResult.error || "Failed to parse contact file" },
      });
    }

    if (parseResult.contacts.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalRows: parseResult.summary.totalRows,
            validRows: 0,
            imported: 0,
            duplicates: parseResult.summary.duplicateRows,
            invalid: parseResult.summary.invalidRows,
          },
          group: groupDoc ? { id: String(groupDoc._id), name: groupDoc.name, addedToGroup: 0 } : undefined,
          contacts: [],
          errors: parseResult.errors,
        },
      });
    }

    const candidatePhones = parseResult.contacts.map((c) => c.phone);
    const existingContacts = await Contact.find(
      { userId: userObjectId, phone: { $in: candidatePhones } },
      { _id: 1, phone: 1 }
    ).lean();

    const existingPhoneSet = new Set(existingContacts.map((c) => c.phone));
    const existingContactIds = existingContacts.map((c) => c._id as mongoose.Types.ObjectId);

    const newCandidates = parseResult.contacts.filter((c) => !existingPhoneSet.has(c.phone));
    const dbDuplicatesCount = parseResult.contacts.length - newCandidates.length;

    let importedCount = 0;
    const createdContactObjectIds: mongoose.Types.ObjectId[] = [];

    if (newCandidates.length > 0) {
      const docsToInsert = newCandidates.map((c) => ({
        userId: userObjectId,
        name: c.name,
        phone: c.phone,
        email: c.email || undefined,
        tags: [],
        status: c.status || "SUBSCRIBED",
      }));

      try {
        const inserted = await Contact.insertMany(docsToInsert, { ordered: false });
        importedCount = inserted.length;
        for (const doc of inserted) {
          createdContactObjectIds.push(doc._id as mongoose.Types.ObjectId);
        }
      } catch (insertError: any) {
        if (insertError && insertError.insertedDocs) {
          importedCount = insertError.insertedDocs.length;
          for (const doc of insertError.insertedDocs) {
            createdContactObjectIds.push(doc._id as mongoose.Types.ObjectId);
          }
        }
      }
    }

    let groupSummary: any = undefined;
    if (groupDoc) {
      const allBatchContactIds = [...createdContactObjectIds, ...existingContactIds];
      const existingInGroup = new Set((groupDoc.contactIds || []).map((id) => String(id)));

      let addedToGroupCount = 0;
      let alreadyInGroupCount = 0;

      for (const cid of allBatchContactIds) {
        if (existingInGroup.has(String(cid))) {
          alreadyInGroupCount++;
        } else {
          addedToGroupCount++;
        }
      }

      if (allBatchContactIds.length > 0) {
        await Group.updateOne(
          { _id: groupDoc._id, userId: userObjectId },
          { $addToSet: { contactIds: { $each: allBatchContactIds } } }
        );
      }

      groupSummary = {
        id: String(groupDoc._id),
        name: groupDoc.name,
        newContactsCreated: importedCount,
        addedToGroup: addedToGroupCount,
        alreadyInGroup: alreadyInGroupCount,
      };
    }

    const totalDuplicates = parseResult.summary.duplicateRows + dbDuplicatesCount;

    return res.json({
      success: true,
      data: {
        summary: {
          totalRows: parseResult.summary.totalRows,
          validRows: parseResult.summary.validRows,
          imported: importedCount,
          duplicates: totalDuplicates,
          invalid: parseResult.summary.invalidRows,
        },
        group: groupSummary,
        errors: parseResult.errors,
      },
    });
  } catch (err: any) {
    console.error("Error importing contacts:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to process import" },
    });
  }
}
