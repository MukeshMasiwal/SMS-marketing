import * as XLSX from "xlsx";
import { parseContactFile } from "../lib/utils/contact-parser";

async function runTests() {
  console.log("🧪 Starting Contact Parser Unit & Validation Tests...\n");

  // 1. Standard CSV Test
  const csvData = "name,phone\nRahul Sharma,9876543210\nAmit Kumar,9123456789\n";
  const csvBuffer = Buffer.from(csvData, "utf-8");
  const res1 = parseContactFile(csvBuffer, "test.csv");
  console.log("1. Standard CSV Test:");
  console.log(`   Success: ${res1.success} | Valid: ${res1.summary.validRows} | Errors: ${res1.summary.invalidRows}`);
  if (res1.summary.validRows !== 2) throw new Error("CSV test failed");

  // 2. Excel (.xlsx) Test
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([
    { name: "Rahul Sharma", phone: "9876543210" },
    { name: "Priya Singh", phone: "9988776655" }
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const res2 = parseContactFile(xlsxBuffer, "test.xlsx");
  console.log("2. Excel (.xlsx) Test:");
  console.log(`   Success: ${res2.success} | Valid: ${res2.summary.validRows}`);
  if (res2.summary.validRows !== 2) throw new Error("Excel test failed");

  // 3. firstName / lastName Test
  const fnLnCsv = "firstName,lastName,phone\nRahul,Sharma,9876543210\n";
  const res3 = parseContactFile(Buffer.from(fnLnCsv), "test_name.csv");
  console.log("3. firstName / lastName Test:");
  console.log(`   Name Combined: "${res3.contacts[0]?.name}" | Valid: ${res3.summary.validRows}`);
  if (res3.contacts[0]?.name !== "Rahul Sharma") throw new Error("Name combine test failed");

  // 4. Invalid Phone Test
  const invalidPhoneCsv = "name,phone\nTest User,abc123\n";
  const res4 = parseContactFile(Buffer.from(invalidPhoneCsv), "invalid_phone.csv");
  console.log("4. Invalid Phone Test:");
  console.log(`   Invalid Rows: ${res4.summary.invalidRows} | ErrorMsg: "${res4.errors[0]?.error}"`);
  if (res4.summary.invalidRows !== 1) throw new Error("Invalid phone test failed");

  // 5. Duplicate in File Test
  const dupCsv = "name,phone\nRahul,9876543210\nAmit,98765-43210\n";
  const res5 = parseContactFile(Buffer.from(dupCsv), "dup.csv");
  console.log("5. Duplicate in File Test:");
  console.log(`   Valid: ${res5.summary.validRows} | Duplicates: ${res5.summary.duplicateRows}`);
  if (res5.summary.validRows !== 1 || res5.summary.duplicateRows !== 1) throw new Error("Duplicate test failed");

  // 6. Missing Required Column Test
  const missingColCsv = "name,email\nRahul,rahul@example.com\n";
  const res6 = parseContactFile(Buffer.from(missingColCsv), "missing_col.csv");
  console.log("6. Missing Phone Column Test:");
  console.log(`   Success: ${res6.success} | Error: "${res6.error}"`);
  if (res6.success !== false || !res6.error?.includes("phone")) throw new Error("Missing col test failed");

  // 7. Empty File Test
  const emptyCsv = "name,phone\n";
  const res7 = parseContactFile(Buffer.from(emptyCsv), "empty.csv");
  console.log("7. Empty File Test:");
  console.log(`   Success: ${res7.success} | Error: "${res7.error}"`);
  if (res7.success !== false) throw new Error("Empty file test failed");

  console.log("\n✅ All unit and parser tests passed cleanly!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
