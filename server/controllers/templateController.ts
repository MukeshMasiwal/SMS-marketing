import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Template } from "../../lib/db/models/Template";
import { validateTemplateVariables } from "../../lib/services/template-service";
import mongoose from "mongoose";

export async function getTemplates(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const templates = await Template.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { templates },
    });
  } catch (err: any) {
    console.error("GET /api/templates error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch templates" },
    });
  }
}

export async function getTemplateById(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid template ID" },
      });
    }

    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Template not found" },
      });
    }

    if (template.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have permission to access this template" },
      });
    }

    return res.status(200).json({
      success: true,
      data: { template },
    });
  } catch (err: any) {
    console.error("GET /api/templates/:id error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch template details" },
    });
  }
}

export async function createTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const { name, message } = req.body || {};

    const nameStr = typeof name === "string" ? name.trim() : "";
    const messageStr = typeof message === "string" ? message.trim() : "";

    if (!nameStr) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Template name is required" },
      });
    }

    if (!messageStr) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Template message content is required" },
      });
    }

    if (messageStr.length > 1600) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Template message exceeds maximum length of 1600 characters" },
      });
    }

    const validation = validateTemplateVariables(messageStr);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_VARIABLES",
          message: `Unsupported variables in template: {{${validation.invalidVariables.join(
            "}}, {{"
          )}}}. Allowed variables are {{name}}, {{phone}}, and {{campaign_name}}.`,
        },
      });
    }

    const template = await Template.create({
      userId,
      name: nameStr,
      message: messageStr,
    });

    return res.status(201).json({
      success: true,
      data: { template },
    });
  } catch (err: any) {
    console.error("POST /api/templates error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to create template" },
    });
  }
}

export async function updateTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid template ID" },
      });
    }

    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Template not found" },
      });
    }

    if (template.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have permission to modify this template" },
      });
    }

    const { name, message } = req.body || {};

    if (typeof name === "string" && name.trim()) {
      template.name = name.trim();
    }

    if (typeof message === "string" && message.trim()) {
      const messageStr = message.trim();
      if (messageStr.length > 1600) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Template message exceeds maximum length of 1600 characters" },
        });
      }

      const validation = validateTemplateVariables(messageStr);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_VARIABLES",
            message: `Unsupported variables in template: {{${validation.invalidVariables.join(
              "}}, {{"
            )}}}. Allowed variables are {{name}}, {{phone}}, and {{campaign_name}}.`,
          },
        });
      }

      template.message = messageStr;
    }

    await template.save();

    return res.status(200).json({
      success: true,
      data: { template },
    });
  } catch (err: any) {
    console.error("PUT /api/templates/:id error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to update template" },
    });
  }
}

export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid template ID" },
      });
    }

    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Template not found" },
      });
    }

    if (template.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have permission to delete this template" },
      });
    }

    await Template.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (err: any) {
    console.error("DELETE /api/templates/:id error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete template" },
    });
  }
}
