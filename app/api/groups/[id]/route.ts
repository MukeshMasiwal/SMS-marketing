import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Group } from "@/lib/db/models/Group";
import { UpdateGroupSchema } from "@/lib/validations/group";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";
import { Contact } from "@/lib/db/models/Contact"; // Ensure Contact is registered for populate

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const { id } = await params;
    await connectToDatabase();

    // Populate contacts securely (only contacts belonging to the same user will be in the array anyway, but just in case)
    const group = await Group.findOne({ _id: id, userId: auth.session!.userId })
      .populate({
        path: "contactIds",
        match: { userId: auth.session!.userId }
      });
      
    if (!group) {
      return createErrorResponse("Group not found", "NOT_FOUND", 404);
    }

    // Transform for UI consumption
    const result = {
      _id: group._id,
      name: group.name,
      description: group.description,
      contactCount: group.contactIds.length,
      contacts: group.contactIds, // Populated array of IContact
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };

    return createSuccessResponse({ group: result });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to fetch group", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json();
    const validatedData = UpdateGroupSchema.safeParse(body);
    
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const { id } = await params;
    await connectToDatabase();

    const group = await Group.findOneAndUpdate(
      { _id: id, userId: auth.session!.userId },
      {
        $set: {
          ...(validatedData.data.name && { name: validatedData.data.name }),
          ...(validatedData.data.description !== undefined && { description: validatedData.data.description }),
        }
      },
      { new: true, runValidators: true }
    );

    if (!group) {
      return createErrorResponse("Group not found", "NOT_FOUND", 404);
    }

    return createSuccessResponse({ group });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000) {
      return createErrorResponse("A group with this name already exists.", "DUPLICATE_GROUP", 409);
    }
    return createErrorResponse("Failed to update group", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const { id } = await params;
    await connectToDatabase();

    const result = await Group.deleteOne({ _id: id, userId: auth.session!.userId });
    if (result.deletedCount === 0) {
      return createErrorResponse("Group not found", "NOT_FOUND", 404);
    }

    // Do NOT delete the underlying contacts! A group is just a reference list.
    return createSuccessResponse({ success: true });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to delete group", "INTERNAL_ERROR", 500);
  }
}
