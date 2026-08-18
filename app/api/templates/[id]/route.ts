import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Template } from "@/lib/db/models/Template";
import { validateTemplateVariables } from "@/lib/services/template-service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (auth.error) {
      return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);
    }

    await connectToDatabase();

    const template = await Template.findOne({ _id: id, userId: auth.session!.userId });
    if (!template) {
      return createErrorResponse("Template not found", "NOT_FOUND", 404);
    }

    return createSuccessResponse({ template });
  } catch (err: any) {
    console.error("GET /api/templates/[id] error:", err);
    return createErrorResponse("Failed to fetch template", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (auth.error) {
      return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return createErrorResponse("Invalid JSON payload", "VALIDATION_ERROR", 400);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name) {
      return createErrorResponse("Template name is required", "VALIDATION_ERROR", 400);
    }

    if (!message) {
      return createErrorResponse("Template message content is required", "VALIDATION_ERROR", 400);
    }

    if (message.length > 1600) {
      return createErrorResponse("Template message exceeds maximum length of 1600 characters", "VALIDATION_ERROR", 400);
    }

    // Validate variables
    const validation = validateTemplateVariables(message);
    if (!validation.valid) {
      return createErrorResponse(
        `Unsupported variables in template: {{${validation.invalidVariables.join("}}, {{")}}}. Allowed variables are {{name}}, {{phone}}, and {{campaign_name}}.`,
        "INVALID_VARIABLES",
        400
      );
    }

    await connectToDatabase();

    const template = await Template.findOneAndUpdate(
      { _id: id, userId: auth.session!.userId },
      { name, message },
      { new: true }
    );

    if (!template) {
      return createErrorResponse("Template not found", "NOT_FOUND", 404);
    }

    return createSuccessResponse({ template });
  } catch (err: any) {
    console.error("PUT /api/templates/[id] error:", err);
    return createErrorResponse(err.message || "Failed to update template", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (auth.error) {
      return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);
    }

    await connectToDatabase();

    const template = await Template.findOneAndDelete({ _id: id, userId: auth.session!.userId });
    if (!template) {
      return createErrorResponse("Template not found", "NOT_FOUND", 404);
    }

    return createSuccessResponse({ message: "Template deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/templates/[id] error:", err);
    return createErrorResponse("Failed to delete template", "INTERNAL_ERROR", 500);
  }
}
