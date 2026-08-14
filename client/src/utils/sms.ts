export type SmsEncoding = "GSM-7" | "Unicode";

export interface SmsStats {
  characterCount: number;
  segmentCount: number;
  encoding: SmsEncoding;
  remainingInSegment: number;
}

// Basic GSM-7 character set
const GSM7_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#$%&'()*+,-./0123456789:;<=>?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
);

// Extended GSM-7 character set (requires escape character in GSM-7, so takes 2 character units)
const GSM7_EXTENDED = new Set("|^{}[]~€\\");

/**
 * Determines whether a message can be encoded in GSM-7 or requires Unicode.
 */
export function calculateSmsEncoding(message: string): SmsEncoding {
  if (!message) return "GSM-7";
  for (const char of message) {
    if (!GSM7_BASIC.has(char) && !GSM7_EXTENDED.has(char)) {
      return "Unicode";
    }
  }
  return "GSM-7";
}

/**
 * Calculates the total character count according to SMS encoding rules.
 * In GSM-7, extended characters count as 2 characters.
 * In Unicode, characters are measured by UTF-16 code units (string.length).
 */
export function calculateCharacterCount(message: string): number {
  if (!message) return 0;
  const encoding = calculateSmsEncoding(message);
  if (encoding === "Unicode") {
    return message.length;
  }
  let count = 0;
  for (const char of message) {
    if (GSM7_EXTENDED.has(char)) {
      count += 2;
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Calculates the number of SMS segments required for the given message.
 */
export function calculateSmsSegments(message: string): number {
  if (!message) return 0;
  const encoding = calculateSmsEncoding(message);
  const charCount = calculateCharacterCount(message);

  if (encoding === "GSM-7") {
    if (charCount <= 160) return 1;
    return Math.ceil(charCount / 153);
  } else {
    if (charCount <= 70) return 1;
    return Math.ceil(charCount / 67);
  }
}

/**
 * Calculates full SMS statistics for the message.
 */
export function getSmsStats(message: string): SmsStats {
  if (!message || message.length === 0) {
    return {
      characterCount: 0,
      segmentCount: 0,
      encoding: "GSM-7",
      remainingInSegment: 160,
    };
  }

  const encoding = calculateSmsEncoding(message);
  const characterCount = calculateCharacterCount(message);

  if (encoding === "GSM-7") {
    if (characterCount <= 160) {
      return {
        characterCount,
        segmentCount: 1,
        encoding,
        remainingInSegment: 160 - characterCount,
      };
    }
    const segmentCount = Math.ceil(characterCount / 153);
    const capacity = segmentCount * 153;
    return {
      characterCount,
      segmentCount,
      encoding,
      remainingInSegment: capacity - characterCount,
    };
  } else {
    if (characterCount <= 70) {
      return {
        characterCount,
        segmentCount: 1,
        encoding,
        remainingInSegment: 70 - characterCount,
      };
    }
    const segmentCount = Math.ceil(characterCount / 67);
    const capacity = segmentCount * 67;
    return {
      characterCount,
      segmentCount,
      encoding,
      remainingInSegment: capacity - characterCount,
    };
  }
}
