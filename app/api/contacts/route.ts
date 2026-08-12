import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Contact } from "@/lib/db/models/Contact";
import { CreateContactSchema } from "@/lib/validations/contact";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);
    
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const tags = url.searchParams.getAll("tags");
    const status = url.searchParams.get("status");

    await connectToDatabase();

    // Build base query enforcing ownership
    const query: Record<string, unknown> = { userId: auth.session!.userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (status && (status === "SUBSCRIBED" || status === "UNSUBSCRIBED")) {
      query.status = status;
    }

    const contacts = await Contact.find(query).sort({ createdAt: -1 });

    return createSuccessResponse({ contacts });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to fetch contacts", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json();
    const validatedData = CreateContactSchema.safeParse(body);
    
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    await connectToDatabase();

    // Normalize tags
    const normalizedTags = Array.from(new Set(
      validatedData.data.tags?.map((t: string) => t.trim().toLowerCase()).filter(Boolean) || []
    ));

    const contact = await Contact.create({
      userId: auth.session!.userId,
      name: validatedData.data.name,
      phone: validatedData.data.phone,
      email: validatedData.data.email || undefined,
      tags: normalizedTags,
      status: validatedData.data.status,
    });

    return createSuccessResponse({ contact }, 201);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000) {
      return createErrorResponse("A contact with this phone number already exists.", "DUPLICATE_CONTACT", 409);
    }
    return createErrorResponse("Failed to create contact", "INTERNAL_ERROR", 500);
  }
}
