import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Group } from "@/lib/db/models/Group";
import { Contact } from "@/lib/db/models/Contact";
import { GroupMembershipSchema } from "@/lib/validations/group";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json();
    const validatedData = GroupMembershipSchema.safeParse(body);
    
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const { contactIds } = validatedData.data;
    const { id: groupId } = await params;
    
    await connectToDatabase();

    // 1. Verify group belongs to user
    const group = await Group.findOne({ _id: groupId, userId: auth.session!.userId });
    if (!group) {
      return createErrorResponse("Group not found", "NOT_FOUND", 404);
    }

    // 2. Verify EVERY contact belongs to the current user
    const uniqueContactIds = Array.from(new Set(contactIds)); // avoid counting duplicate inputs
    const validContacts = await Contact.find({
      _id: { $in: uniqueContactIds },
      userId: auth.session!.userId
    }).select("_id");

    if (validContacts.length !== uniqueContactIds.length) {
      return createErrorResponse("One or more contacts are invalid or do not belong to you.", "FORBIDDEN", 403);
    }

    // 3. Add contacts using $addToSet (prevents duplicates in the array)
    await Group.updateOne(
      { _id: groupId },
      { $addToSet: { contactIds: { $each: uniqueContactIds } } }
    );

    return createSuccessResponse({ success: true });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to add contacts to group", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json();
    const validatedData = GroupMembershipSchema.safeParse(body);
    
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const { contactIds } = validatedData.data;
    const { id: groupId } = await params;

    await connectToDatabase();

    // 1. Verify group ownership
    const group = await Group.findOne({ _id: groupId, userId: auth.session!.userId });
    if (!group) {
      return createErrorResponse("Group not found", "NOT_FOUND", 404);
    }

    // 2. We don't strictly need to verify contact ownership for a pull since they are just being removed,
    // but the requirement said: "Verify contacts belong to current user". Let's do it for strict compliance.
    const uniqueContactIds = Array.from(new Set(contactIds));
    const validContacts = await Contact.find({
      _id: { $in: uniqueContactIds },
      userId: auth.session!.userId
    }).select("_id");

    if (validContacts.length !== uniqueContactIds.length) {
      return createErrorResponse("One or more contacts are invalid or do not belong to you.", "FORBIDDEN", 403);
    }

    // 3. $pull contacts from group
    await Group.updateOne(
      { _id: groupId },
      { $pullAll: { contactIds: uniqueContactIds } }
    );

    return createSuccessResponse({ success: true });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to remove contacts from group", "INTERNAL_ERROR", 500);
  }
}
