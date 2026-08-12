import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Contact } from "@/lib/db/models/Contact";
import { UpdateContactSchema } from "@/lib/validations/contact";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const { id } = await params;
    await connectToDatabase();

    const contact = await Contact.findOne({ _id: id, userId: auth.session!.userId });
    if (!contact) {
      return createErrorResponse("Contact not found", "NOT_FOUND", 404);
    }

    return createSuccessResponse({ contact });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to fetch contact", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json();
    const validatedData = UpdateContactSchema.safeParse(body);
    
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const { id } = await params;
    await connectToDatabase();

    let normalizedTags = validatedData.data.tags;
    if (normalizedTags) {
      normalizedTags = Array.from(new Set(
        normalizedTags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      ));
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId: auth.session!.userId },
      {
        $set: {
          ...(validatedData.data.name && { name: validatedData.data.name }),
          ...(validatedData.data.phone && { phone: validatedData.data.phone }),
          ...(validatedData.data.email !== undefined && { email: validatedData.data.email || undefined }),
          ...(normalizedTags && { tags: normalizedTags }),
          ...(validatedData.data.status && { status: validatedData.data.status }),
        }
      },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return createErrorResponse("Contact not found", "NOT_FOUND", 404);
    }

    return createSuccessResponse({ contact });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000) {
      return createErrorResponse("A contact with this phone number already exists.", "DUPLICATE_CONTACT", 409);
    }
    return createErrorResponse("Failed to update contact", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const { id } = await params;
    await connectToDatabase();

    const result = await Contact.deleteOne({ _id: id, userId: auth.session!.userId });
    if (result.deletedCount === 0) {
      return createErrorResponse("Contact not found", "NOT_FOUND", 404);
    }

    // Clean up stale references in Groups
    const { Group } = await import("@/lib/db/models/Group");
    await Group.updateMany(
      { userId: auth.session!.userId, contactIds: id },
      { $pull: { contactIds: id } }
    );

    return createSuccessResponse({ success: true });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to delete contact", "INTERNAL_ERROR", 500);
  }
}
