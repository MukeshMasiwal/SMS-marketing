import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Template } from "@/lib/db/models/Template";
import { validateTemplateVariables } from "@/lib/services/template-service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) {
      return createErrorResponse(auth.error, "UNAUTHORIZED", auth.status);
    }

    await connectToDatabase();

    const templates = await Template.find({ userId: auth.session!.userId }).sort({ createdAt: -1 });

    return createSuccessResponse({ templates });
  } catch (err: any) {
    console.error("GET /api/templates error:", err);
    return createErrorResponse("Failed to fetch templates", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // Validate variables in template
    const validation = validateTemplateVariables(message);
    if (!validation.valid) {
      return createErrorResponse(
        `Unsupported variables in template: {{${validation.invalidVariables.join("}}, {{")}}}. Allowed variables are {{name}}, {{phone}}, and {{campaign_name}}.`,
        "INVALID_VARIABLES",
        400
      );
    }

    await connectToDatabase();

    const template = await Template.create({
      userId: auth.session!.userId,
      name,
      message,
    });

    return createSuccessResponse({ template }, 201);
  } catch (err: any) {
    console.error("POST /api/templates error:", err);
    return createErrorResponse(err.message || "Failed to create template", "INTERNAL_ERROR", 500);
  }
}
