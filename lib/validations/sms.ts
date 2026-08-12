import { z } from "zod";

export const SendSmsSchema = z.object({
  recipient: z
    .string()
    .min(1, "Recipient is required")
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format") // E.164-ish basic validation
    .trim(),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1600, "Message is too long")
    .trim(),
});

export type SendSmsInput = z.infer<typeof SendSmsSchema>;
