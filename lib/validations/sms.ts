import { z } from "zod";

/**
 * Normalizes valid Indian mobile phone numbers to E.164 format (+91XXXXXXXXXX).
 * Accepts formats: 9876543210, 09876543210, 919876543210, +919876543210.
 * Returns null if the number is not a valid Indian mobile number.
 */
export function normalizeIndianPhoneNumber(input: string): string | null {
  if (!input) return null;
  const clean = input.trim().replace(/[\s\-\(\)]/g, "");
  const match = clean.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  if (!match) return null;
  return `+91${match[1]}`;
}

export const SendSmsSchema = z.object({
  recipient: z
    .string()
    .min(1, "Recipient is required")
    .transform((val) => val.trim())
    .refine((val) => normalizeIndianPhoneNumber(val) !== null, {
      message: "Invalid Indian phone number. Must be a 10-digit Indian mobile number (e.g. +919876543210 or 9876543210).",
    }),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1600, "Message length cannot exceed 1600 characters")
    .trim(),
});

export type SendSmsInput = z.infer<typeof SendSmsSchema>;

export const ExotelSendSmsSchema = z.object({
  to: z
    .string()
    .min(1, "Phone number 'to' is required")
    .transform((val) => val.trim())
    .refine((val) => normalizeIndianPhoneNumber(val) !== null, {
      message: "Invalid Indian phone number. Must be a 10-digit Indian mobile number (e.g. +919876543210 or 9876543210).",
    }),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1600, "Message length cannot exceed 1600 characters")
    .trim(),
});

export type ExotelSendSmsInput = z.infer<typeof ExotelSendSmsSchema>;
