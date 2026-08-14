import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth";
import { Group } from "../../lib/db/models/Group";
import { Campaign } from "../../lib/db/models/Campaign";

export async function getGroups(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const search = req.query.search ? String(req.query.search).trim() : "";
    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const groups = await Group.find(filter).populate("contactIds", "_id name phone email status").sort({ createdAt: -1 });
    return res.json({ success: true, groups, data: { groups } });
  } catch (err: any) {
    console.error("Error fetching groups:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to fetch groups" },
    });
  }
}

export async function getGroupById(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid group ID" } });
    }

    const group = await Group.findOne({ _id: id, userId: new mongoose.Types.ObjectId(userId) }).populate("contactIds");
    if (!group) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Group not found or access denied" } });
    }

    return res.json({ success: true, group, data: { group } });
  } catch (err: any) {
    console.error("Error fetching group:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to fetch group" },
    });
  }
}

export async function createGroup(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const { name, description, contactIds } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Group name is required" },
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const existing = await Group.findOne({ userId: userObjectId, name: name.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: "CONFLICT", message: "A group with this name already exists." },
      });
    }

    const group = await Group.create({
      userId: userObjectId,
      name: name.trim(),
      description: description ? description.trim() : undefined,
      contactIds: Array.isArray(contactIds) ? contactIds : [],
    });

    return res.status(201).json({ success: true, group, data: { group } });
  } catch (err: any) {
    console.error("Error creating group:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to create group" },
    });
  }
}

export async function updateGroup(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid group ID" } });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const group = await Group.findOne({ _id: id, userId: userObjectId });

    if (!group) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Group not found or access denied" } });
    }

    const { name, description, contactIds } = req.body;
    if (name !== undefined) group.name = name.trim();
    if (description !== undefined) group.description = description ? description.trim() : undefined;
    if (contactIds !== undefined && Array.isArray(contactIds)) group.contactIds = contactIds;

    await group.save();
    return res.json({ success: true, group, data: { group } });
  } catch (err: any) {
    console.error("Error updating group:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to update group" },
    });
  }
}

export async function deleteGroup(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid group ID" } });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const group = await Group.findOne({ _id: id, userId: userObjectId });

    if (!group) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Group not found or access denied" } });
    }

    const groupObjectId = group._id;

    // Delete group document ONLY (do NOT delete contacts)
    await Group.deleteOne({ _id: groupObjectId, userId: userObjectId });

    // Clean references from Campaign targetGroupIds
    await Campaign.updateMany(
      { userId: userObjectId, targetGroupIds: groupObjectId },
      { $pull: { targetGroupIds: groupObjectId } }
    );

    return res.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (err: any) {
    console.error("Error deleting group:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Failed to delete group" },
    });
  }
}
