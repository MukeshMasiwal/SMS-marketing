import * as XLSX from "xlsx";
import { z } from "zod";

export interface ParsedContactCandidate {
  row: number;
  name: string;
  phone: string;
  email?: string;
  status: "SUBSCRIBED" | "UNSUBSCRIBED";
}

export interface RowError {
  row: number;
  name?: string;
  phone?: string;
  error: string;
}

export interface ContactParseResult {
  success: boolean;
  error?: string;
  summary: {
    totalRows: number;
    validRows: number;
    duplicateRows: number;
    invalidRows: number;
  };
  contacts: ParsedContactCandidate[];
  errors: RowError[];
}

const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
const EMAIL_SCHEMA = z.string().email();

export function normalizePhoneNumber(raw: string): string {
  if (!raw) return "";
  let str = raw.trim();
  const hasPlus = str.startsWith("+");
  // Remove hyphens, spaces, parentheses
  str = str.replace(/[\s\-\(\)]/g, "");
  if (hasPlus && !str.startsWith("+")) {
    str = "+" + str;
  }
  return str;
}

export function parseContactFile(
  buffer: Buffer | ArrayBuffer,
  fileName: string
): ContactParseResult {
  const ext = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
  
  if (ext !== "csv" && ext !== "xlsx") {
    return {
      success: false,
      error: "Unsupported file format. Please upload a .csv or .xlsx file.",
      summary: { totalRows: 0, validRows: 0, duplicateRows: 0, invalidRows: 0 },
      contacts: [],
      errors: [],
    };
  }

  const byteLength = buffer instanceof ArrayBuffer ? buffer.byteLength : buffer.length;
  if (byteLength > 5 * 1024 * 1024) {
    return {
      success: false,
      error: "File exceeds 5 MB limit. Please upload a smaller file.",
      summary: { totalRows: 0, validRows: 0, duplicateRows: 0, invalidRows: 0 },
      contacts: [],
      errors: [],
    };
  }

  let workbook: XLSX.WorkBook;
  try {
    const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    workbook = XLSX.read(data, { type: "array" });
  } catch {
    return {
      success: false,
      error: "Unable to parse spreadsheet file. Please check file integrity.",
      summary: { totalRows: 0, validRows: 0, duplicateRows: 0, invalidRows: 0 },
      contacts: [],
      errors: [],
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      success: false,
      error: "No contact records found in this file.",
      summary: { totalRows: 0, validRows: 0, duplicateRows: 0, invalidRows: 0 },
      contacts: [],
      errors: [],
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  if (!rawRows || rawRows.length === 0) {
    return {
      success: false,
      error: "No contact records found in this file.",
      summary: { totalRows: 0, validRows: 0, duplicateRows: 0, invalidRows: 0 },
      contacts: [],
      errors: [],
    };
  }

  if (rawRows.length > 5000) {
    return {
      success: false,
      error: "Maximum 5,000 contacts allowed per file.",
      summary: { totalRows: rawRows.length, validRows: 0, duplicateRows: 0, invalidRows: 0 },
      contacts: [],
      errors: [],
    };
  }

  // Detect and normalize header map
  const sampleRowKeys = Object.keys(rawRows[0] || {});
  const headerMap: Record<string, string> = {};

  for (const key of sampleRowKeys) {
    const normalizedKey = key.trim().toLowerCase();
    if (normalizedKey === "name") headerMap["name"] = key;
    else if (normalizedKey === "firstname" || normalizedKey === "first_name") headerMap["firstName"] = key;
    else if (normalizedKey === "lastname" || normalizedKey === "last_name") headerMap["lastName"] = key;
    else if (normalizedKey === "phone" || normalizedKey === "mobile" || normalizedKey === "phone_number") headerMap["phone"] = key;
    else if (normalizedKey === "email") headerMap["email"] = key;
    else if (normalizedKey === "status") headerMap["status"] = key;
  }

  const missingHeaders: string[] = [];
  if (!headerMap["phone"]) missingHeaders.push("phone");
  if (!headerMap["name"] && !headerMap["firstName"] && !headerMap["lastName"]) {
    missingHeaders.push("name");
  }

  if (missingHeaders.length > 0) {
    return {
      success: false,
      error: `Missing required column: ${missingHeaders.join(", ")}`,
      summary: { totalRows: rawRows.length, validRows: 0, duplicateRows: 0, invalidRows: 0 },
      contacts: [],
      errors: [],
    };
  }

  const seenPhones = new Set<string>();
  const contacts: ParsedContactCandidate[] = [];
  const errors: RowError[] = [];
  let duplicateRows = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const rowObj = rawRows[i];
    const excelRowIndex = i + 2; // Row 1 is header

    // Extract name
    let name = "";
    if (headerMap["name"] && rowObj[headerMap["name"]]) {
      name = String(rowObj[headerMap["name"]]).trim();
    } else {
      const fName = headerMap["firstName"] ? String(rowObj[headerMap["firstName"]]).trim() : "";
      const lName = headerMap["lastName"] ? String(rowObj[headerMap["lastName"]]).trim() : "";
      name = [fName, lName].filter(Boolean).join(" ");
    }

    // Extract phone
    const rawPhone = headerMap["phone"] ? String(rowObj[headerMap["phone"]]).trim() : "";
    const normalizedPhone = normalizePhoneNumber(rawPhone);

    // Extract email
    const rawEmail = headerMap["email"] ? String(rowObj[headerMap["email"]]).trim() : "";

    // Extract status
    const rawStatus = headerMap["status"] ? String(rowObj[headerMap["status"]]).trim() : "";

    // Validations
    if (!name) {
      errors.push({
        row: excelRowIndex,
        name: "",
        phone: normalizedPhone || rawPhone,
        error: "Name is required",
      });
      continue;
    }

    if (!normalizedPhone || !PHONE_REGEX.test(normalizedPhone)) {
      errors.push({
        row: excelRowIndex,
        name,
        phone: rawPhone,
        error: "Invalid phone number format",
      });
      continue;
    }

    let validEmail: string | undefined = undefined;
    if (rawEmail) {
      const emailResult = EMAIL_SCHEMA.safeParse(rawEmail);
      if (!emailResult.success) {
        errors.push({
          row: excelRowIndex,
          name,
          phone: normalizedPhone,
          error: "Invalid email address",
        });
        continue;
      }
      validEmail = rawEmail;
    }

    let statusVal: "SUBSCRIBED" | "UNSUBSCRIBED" = "SUBSCRIBED";
    if (rawStatus) {
      const upperStatus = rawStatus.toUpperCase();
      if (upperStatus === "SUBSCRIBED" || upperStatus === "UNSUBSCRIBED") {
        statusVal = upperStatus;
      } else {
        errors.push({
          row: excelRowIndex,
          name,
          phone: normalizedPhone,
          error: "Invalid status value. Expected SUBSCRIBED or UNSUBSCRIBED.",
        });
        continue;
      }
    }

    // Duplicate in file check
    if (seenPhones.has(normalizedPhone)) {
      duplicateRows++;
      continue;
    }

    seenPhones.add(normalizedPhone);
    contacts.push({
      row: excelRowIndex,
      name,
      phone: normalizedPhone,
      email: validEmail,
      status: statusVal,
    });
  }

  return {
    success: true,
    summary: {
      totalRows: rawRows.length,
      validRows: contacts.length,
      duplicateRows,
      invalidRows: errors.length,
    },
    contacts,
    errors,
  };
}
