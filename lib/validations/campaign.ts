import { z } from "zod";

export const CampaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Campaign name must be at least 2 characters")
    .max(100, "Campaign name cannot exceed 100 characters"),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(1600, "Message is too long"),
  targetType: z
    .enum(["CONTACTS", "GROUP", "contacts", "group"])
    .optional()
    .default("GROUP"),
  targetGroupIds: z.array(z.string()).optional().default([]),
  targetContactIds: z.array(z.string()).optional().default([]),
  scheduledAt: z.string().optional(),
});

export type CampaignInput = z.infer<typeof CampaignSchema>;
