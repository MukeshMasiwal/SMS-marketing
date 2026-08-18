export const SUPPORTED_VARIABLES = ["name", "phone", "campaign_name"] as const;

export interface TemplateVariableInfo {
  key: string;
  label: string;
  placeholder: string;
}

export const TEMPLATE_VARIABLES: TemplateVariableInfo[] = [
  { key: "name", label: "Contact Name", placeholder: "{{name}}" },
  { key: "phone", label: "Phone Number", placeholder: "{{phone}}" },
  { key: "campaign_name", label: "Campaign Name", placeholder: "{{campaign_name}}" },
];

export interface ValidationResult {
  valid: boolean;
  invalidVariables: string[];
  foundVariables: string[];
}

/**
 * Validates whether all placeholders in templateText belong to SUPPORTED_VARIABLES.
 */
export function validateTemplateVariables(templateText: string): ValidationResult {
  if (!templateText) {
    return { valid: true, invalidVariables: [], foundVariables: [] };
  }

  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const foundSet = new Set<string>();
  const invalidSet = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(templateText)) !== null) {
    const varName = match[1].trim();
    foundSet.add(varName);
    if (!SUPPORTED_VARIABLES.includes(varName as any)) {
      invalidSet.add(varName);
    }
  }

  const invalidVariables = Array.from(invalidSet);
  const foundVariables = Array.from(foundSet);

  return {
    valid: invalidVariables.length === 0,
    invalidVariables,
    foundVariables,
  };
}

/**
 * Renders a personalized SMS message for a specific contact and campaign.
 */
export function renderMessageTemplate(
  templateText: string,
  contact?: { name?: string; phone?: string },
  campaign?: { name?: string },
  fallbackName = "Customer"
): string {
  if (!templateText) return "";

  let rendered = templateText;

  // Replace {{name}} - if name is missing or empty, use fallbackName (e.g. "Customer")
  const rawName = contact?.name && contact.name.trim() ? contact.name.trim() : "";
  const nameValue = rawName || fallbackName;
  rendered = rendered.replace(/\{\{\s*name\s*\}\}/g, nameValue);

  // Replace {{phone}}
  const phoneValue = contact?.phone && contact.phone.trim() ? contact.phone.trim() : "";
  rendered = rendered.replace(/\{\{\s*phone\s*\}\}/g, phoneValue);

  // Replace {{campaign_name}}
  const campaignNameValue = campaign?.name && campaign.name.trim() ? campaign.name.trim() : "";
  rendered = rendered.replace(/\{\{\s*campaign_name\s*\}\}/g, campaignNameValue);

  return rendered;
}

export interface SmsSegmentInfo {
  charCount: number;
  segmentCount: number;
  encoding: "GSM-7" | "Unicode";
  maxCharsPerSegment: number;
}

// GSM-7 Basic character set regex
const GSM7_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !"#¤%&'()*+,\-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà]*$/;

/**
 * Calculates character count, encoding type, and SMS segment count.
 */
export function calculateSmsSegments(text: string): SmsSegmentInfo {
  if (!text) {
    return { charCount: 0, segmentCount: 1, encoding: "GSM-7", maxCharsPerSegment: 160 };
  }

  const isGsm7 = GSM7_REGEX.test(text);
  const encoding = isGsm7 ? "GSM-7" : "Unicode";
  const charCount = Array.from(text).length;

  let segmentCount = 1;
  let maxCharsPerSegment = isGsm7 ? 160 : 70;

  if (isGsm7) {
    if (charCount > 160) {
      maxCharsPerSegment = 153;
      segmentCount = Math.ceil(charCount / 153);
    }
  } else {
    if (charCount > 70) {
      maxCharsPerSegment = 67;
      segmentCount = Math.ceil(charCount / 67);
    }
  }

  return {
    charCount,
    segmentCount,
    encoding,
    maxCharsPerSegment,
  };
}
