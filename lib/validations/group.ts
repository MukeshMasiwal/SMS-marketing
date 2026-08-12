import { z } from "zod";

export const CreateGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").trim(),
  description: z.string().max(500, "Description is too long").optional().or(z.literal("")).transform(v => v || undefined),
});

export const UpdateGroupSchema = CreateGroupSchema.partial();

export const GroupMembershipSchema = z.object({
  contactIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")).min(1, "At least one contact ID is required"),
});

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type UpdateGroupInput = z.infer<typeof UpdateGroupSchema>;
export type GroupMembershipInput = z.infer<typeof GroupMembershipSchema>;
