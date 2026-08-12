import { z } from "zod";

export const CampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  message: z.string().trim().min(1, "Message is required").max(1600, "Message is too long"),
  targetType: z.enum(["CONTACTS", "GROUP"]),
  targetGroupIds: z.array(z.string()).default([]),
  targetContactIds: z.array(z.string()).default([]),
  scheduledAt: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.targetType === "CONTACTS") {
      return data.targetContactIds.length > 0 && data.targetGroupIds.length === 0;
    }
    if (data.targetType === "GROUP") {
      return data.targetGroupIds.length > 0 && data.targetContactIds.length === 0;
    }
    return false;
  },
  {
    message: "Invalid target selection for the chosen target type.",
    path: ["targetType"],
  }
);

export type CampaignInput = z.infer<typeof CampaignSchema>;
