import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Contact } from "@/lib/db/models/Contact";
import { Group } from "@/lib/db/models/Group";
import { parseContactFile } from "@/lib/utils/contact-parser";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const groupId = formData.get("groupId") as string | null;

    if (!file) {
      return createErrorResponse("No file uploaded. Please select a file.", "BAD_REQUEST", 400);
    }

    await connectToDatabase();
    const userId = auth.session!.userId;

    let groupDoc: InstanceType<typeof Group> | null = null;
    if (groupId) {
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return createErrorResponse("Invalid groupId format.", "BAD_REQUEST", 400);
      }

      groupDoc = await Group.findOne({ _id: groupId, userId });
      if (!groupDoc) {
        return createErrorResponse("Group not found or access denied.", "FORBIDDEN", 403);
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const parseResult = parseContactFile(arrayBuffer, file.name);

    if (!parseResult.success) {
      return createErrorResponse(parseResult.error || "Failed to parse file", "INVALID_FILE", 400);
    }

    if (parseResult.contacts.length === 0) {
      return createSuccessResponse({
        summary: {
          totalRows: parseResult.summary.totalRows,
          validRows: 0,
          imported: 0,
          duplicates: parseResult.summary.duplicateRows,
          invalid: parseResult.summary.invalidRows,
        },
        group: groupDoc
          ? {
              id: groupDoc._id.toString(),
              name: groupDoc.name,
              newContactsCreated: 0,
              addedToGroup: 0,
              alreadyInGroup: 0,
            }
          : undefined,
        contacts: [],
        errors: parseResult.errors,
      });
    }

    const candidatePhones = parseResult.contacts.map((c) => c.phone);
    const existingContacts = await Contact.find(
      { userId, phone: { $in: candidatePhones } },
      { _id: 1, phone: 1, status: 1 }
    ).lean();

    const existingPhoneSet = new Set(existingContacts.map((c) => c.phone));
    const existingContactIds = existingContacts.map((c) => c._id);

    const newCandidates = parseResult.contacts.filter((c) => !existingPhoneSet.has(c.phone));
    const databaseDuplicatesCount = parseResult.contacts.length - newCandidates.length;

    let importedCount = 0;
    const createdContacts: Array<{ id: string; name: string; phone: string; email?: string }> = [];
    const newlyCreatedObjectIds: mongoose.Types.ObjectId[] = [];

    if (newCandidates.length > 0) {
      const documentsToInsert = newCandidates.map((c) => ({
        userId,
        name: c.name,
        phone: c.phone,
        email: c.email || undefined,
        tags: [],
        status: c.status || "SUBSCRIBED",
      }));

      try {
        const inserted = await Contact.insertMany(documentsToInsert, { ordered: false });
        importedCount = inserted.length;
        for (const doc of inserted) {
          newlyCreatedObjectIds.push(doc._id as mongoose.Types.ObjectId);
          createdContacts.push({
            id: doc._id.toString(),
            name: doc.name,
            phone: doc.phone,
            email: doc.email,
          });
        }
      } catch (insertError: unknown) {
        // Handle partial bulk insert / E11000 duplicate key race condition gracefully
        if (
          insertError &&
          typeof insertError === "object" &&
          "insertedDocs" in insertError &&
          Array.isArray((insertError as { insertedDocs: Array<Record<string, unknown>> }).insertedDocs)
        ) {
          const docs = (insertError as { insertedDocs: Array<Record<string, unknown>> }).insertedDocs;
          importedCount = docs.length;
          for (const doc of docs) {
            const docId = doc._id as mongoose.Types.ObjectId;
            newlyCreatedObjectIds.push(docId);
            createdContacts.push({
              id: String(doc._id),
              name: String(doc.name),
              phone: String(doc.phone),
              email: doc.email ? String(doc.email) : undefined,
            });
          }
        } else {
          console.error("Bulk insert notice:", insertError);
        }
      }
    }

    // Handle Group Membership if groupId is provided
    let groupResponse:
      | {
          id: string;
          name: string;
          newContactsCreated: number;
          addedToGroup: number;
          alreadyInGroup: number;
        }
      | undefined = undefined;

    if (groupDoc) {
      const allBatchContactIds = [...newlyCreatedObjectIds, ...existingContactIds];
      const existingGroupSet = new Set((groupDoc.contactIds || []).map((id) => id.toString()));

      let alreadyInGroupCount = 0;
      let addedToGroupCount = 0;

      for (const cid of allBatchContactIds) {
        if (existingGroupSet.has(cid.toString())) {
          alreadyInGroupCount++;
        } else {
          addedToGroupCount++;
        }
      }

      if (allBatchContactIds.length > 0) {
        await Group.updateOne(
          { _id: groupId, userId },
          { $addToSet: { contactIds: { $each: allBatchContactIds } } }
        );
      }

      groupResponse = {
        id: groupDoc._id.toString(),
        name: groupDoc.name,
        newContactsCreated: importedCount,
        addedToGroup: addedToGroupCount,
        alreadyInGroup: alreadyInGroupCount,
      };
    }

    const totalDuplicates = parseResult.summary.duplicateRows + databaseDuplicatesCount + (newCandidates.length - importedCount);

    return createSuccessResponse({
      summary: {
        totalRows: parseResult.summary.totalRows,
        validRows: parseResult.summary.validRows,
        imported: importedCount,
        duplicates: totalDuplicates,
        invalid: parseResult.summary.invalidRows,
      },
      group: groupResponse,
      contacts: createdContacts,
      errors: parseResult.errors,
    });
  } catch (err: unknown) {
    console.error("Contact import error:", err);
    return createErrorResponse("Failed to process contact import", "INTERNAL_ERROR", 500);
  }
}
