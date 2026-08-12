import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Group } from "@/lib/db/models/Group";
import { CreateGroupSchema } from "@/lib/validations/group";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);
    
    const url = new URL(req.url);
    const search = url.searchParams.get("search");

    await connectToDatabase();

    const query: Record<string, unknown> = { userId: auth.session!.userId };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const groups = await Group.find(query).sort({ createdAt: -1 }).lean();

    // Transform contactIds array length into contactCount
    const transformedGroups = groups.map((g: any) => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      contactCount: g.contactIds?.length || 0,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));

    return createSuccessResponse({ groups: transformedGroups });
  } catch (err) {
    console.error(err);
    return createErrorResponse("Failed to fetch groups", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);

    const body = await req.json();
    const validatedData = CreateGroupSchema.safeParse(body);
    
    if (!validatedData.success) {
      return createErrorResponse(validatedData.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    await connectToDatabase();

    const group = await Group.create({
      userId: auth.session!.userId,
      name: validatedData.data.name,
      description: validatedData.data.description,
      contactIds: [],
    });

    return createSuccessResponse({ group }, 201);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000) {
      return createErrorResponse("A group with this name already exists.", "DUPLICATE_GROUP", 409);
    }
    return createErrorResponse("Failed to create group", "INTERNAL_ERROR", 500);
  }
}
