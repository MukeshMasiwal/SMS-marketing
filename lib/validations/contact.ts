import { z } from "zod";

export const CreateContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(["SUBSCRIBED", "UNSUBSCRIBED"]).optional().default("SUBSCRIBED"),
});

export const UpdateContactSchema = CreateContactSchema.partial();

export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;
