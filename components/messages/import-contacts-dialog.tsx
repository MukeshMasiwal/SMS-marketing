"use client";

import React, { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2, ChevronDown, ChevronUp, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseContactFile, ContactParseResult } from "@/lib/utils/contact-parser";
import { toast } from "sonner";

export interface ImportContactsDialogProps {
  groupId?: string;
  groupName?: string;
  onImportSuccess?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ImportContactsDialog({
  groupId: initialGroupId,
  groupName: initialGroupName,
  onImportSuccess,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ImportContactsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (val: boolean) => {
    if (controlledOnOpenChange) controlledOnOpenChange(val);
    if (!isControlled) setInternalOpen(val);
  };

  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ContactParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Group selection states
  const [groups, setGroups] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId || "");
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    imported: number;
    duplicates: number;
    invalid: number;
    group?: {
      id: string;
      name: string;
      newContactsCreated: number;
      addedToGroup: number;
      alreadyInGroup: number;
    };
  } | null>(null);

  useEffect(() => {
    if (open && !initialGroupId) {
      // Fetch available groups for user
      fetch("/api/groups")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data?.groups || json.groups)) {
            setGroups(json.data?.groups || json.groups);
          }
        })
        .catch(() => {});
    }
  }, [open, initialGroupId]);

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setIsParsing(false);
    setIsImporting(false);
    setShowErrors(false);
    setImportSummary(null);
    setSelectedGroupId(initialGroupId || "");
    setIsCreatingNewGroup(false);
    setNewGroupName("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetState();
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "name,phone,email,status\nRahul Sharma,+919800000001,rahul.sharma@example.com,SUBSCRIBED\nPriya Verma,+919800000002,priya.verma@example.com,SUBSCRIBED\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "contacts_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setParseResult(null);
    setImportSummary(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const result = parseContactFile(buffer, selectedFile.name);
      setParseResult(result);
      if (!result.success && result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to parse file");
    } finally {
      setIsParsing(false);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleImport = async () => {
    if (!file || !parseResult || parseResult.contacts.length === 0) return;

    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64Data = arrayBufferToBase64(buffer);

      const targetGroupId = initialGroupId || selectedGroupId;
      const targetNewGroupName = isCreatingNewGroup ? newGroupName.trim() : null;

      const payload = {
        fileData: base64Data,
        fileName: file.name,
        groupId: targetGroupId && targetGroupId !== "none" ? targetGroupId : undefined,
        newGroupName: targetNewGroupName || undefined,
      };

      const response = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        toast.error(resData.error?.message || "Failed to import contacts");
        return;
      }

      const summary = resData.data.summary;
      const groupRes = resData.data.group;

      setImportSummary({
        totalRows: summary.totalRows,
        imported: summary.imported,
        duplicates: summary.duplicates,
        invalid: summary.invalid,
        group: groupRes,
      });

      if (groupRes) {
        toast.success(`${groupRes.addedToGroup} contact(s) added to group "${groupRes.name}"`);
      } else {
        toast.success(`${summary.imported} contact(s) imported successfully`);
      }

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch {
      toast.error("An unexpected error occurred during import");
    } finally {
      setIsImporting(false);
    }
  };

  const currentGroupName = initialGroupName || (groups.find((g) => g._id === selectedGroupId)?.name);
  const dialogTitleText = currentGroupName ? `Import Contacts to ${currentGroupName}` : "Import Contacts";
  const dialogDescriptionText = currentGroupName
    ? `Upload a CSV or Excel (.xlsx) file to add contacts directly to ${currentGroupName}.`
    : "Upload a spreadsheet containing names and phone numbers to add recipients to your audience.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger
          render={
            (trigger || (
              <Button variant="outline" className="gap-2 border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Import Contacts</span>
              </Button>
            )) as React.ReactElement
          }
        />
      )}

      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-zinc-100">
            <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
            {dialogTitleText}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {dialogDescriptionText}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!importSummary && (
            <>
              {/* Step 1: Group Destination Selector */}
              {!initialGroupId && (
                <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs">
                  <label className="block text-zinc-300 font-medium">Destination Group (Optional):</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={isCreatingNewGroup ? "new" : selectedGroupId || "none"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "new") {
                          setIsCreatingNewGroup(true);
                          setSelectedGroupId("");
                        } else {
                          setIsCreatingNewGroup(false);
                          setSelectedGroupId(val === "none" ? "" : val);
                        }
                      }}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="none">No Group (All Contacts only)</option>
                      {groups.map((g) => (
                        <option key={g._id} value={g._id}>
                          Group: {g.name}
                        </option>
                      ))}
                      <option value="new">+ Create New Group...</option>
                    </select>

                    {isCreatingNewGroup && (
                      <Input
                        placeholder="New Group Name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: File Upload Area */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg p-6 bg-zinc-900/50 hover:bg-zinc-900/80 transition-colors">
                <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                <p className="text-sm font-medium text-zinc-200 mb-1">
                  {file ? file.name : "Select a CSV or Excel (.xlsx) file"}
                </p>
                <p className="text-xs text-zinc-500 mb-4">Maximum file size: 5 MB | Limit: 5,000 data rows</p>

                <div className="flex items-center gap-3">
                  <label htmlFor="csv-file-upload" className="cursor-pointer">
                    <span className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-500 h-9 px-4 py-2">
                      Choose File
                    </span>
                    <input
                      id="csv-file-upload"
                      type="file"
                      accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="gap-1.5 text-zinc-400 hover:text-zinc-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Template
                  </Button>
                </div>
              </div>

              {isParsing && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  Parsing spreadsheet data...
                </div>
              )}

              {/* Preview Section */}
              {parseResult && parseResult.success && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-emerald-400">{parseResult.summary.validRows}</div>
                      <div className="text-xs text-zinc-400 font-medium">Valid Contacts</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-amber-400">{parseResult.summary.duplicateRows}</div>
                      <div className="text-xs text-zinc-400 font-medium">In-file Duplicates</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-400">{parseResult.summary.invalidRows}</div>
                      <div className="text-xs text-zinc-400 font-medium">Invalid Rows</div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  {parseResult.contacts.length > 0 && (
                    <div className="border border-zinc-800 rounded-lg overflow-hidden">
                      <div className="bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-300 border-b border-zinc-800">
                        Preview ({Math.min(parseResult.contacts.length, 50)} of {parseResult.summary.validRows} contacts)
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        <table className="w-full text-xs text-left text-zinc-300">
                          <thead className="bg-zinc-900 text-zinc-400 sticky top-0">
                            <tr>
                              <th className="px-3 py-1.5">Row</th>
                              <th className="px-3 py-1.5">Name</th>
                              <th className="px-3 py-1.5">Phone</th>
                              <th className="px-3 py-1.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {parseResult.contacts.slice(0, 50).map((c, idx) => (
                              <tr key={idx} className="hover:bg-zinc-900/50">
                                <td className="px-3 py-1 text-zinc-500">{c.row}</td>
                                <td className="px-3 py-1 font-medium">{c.name}</td>
                                <td className="px-3 py-1 font-mono text-zinc-400">{c.phone}</td>
                                <td className="px-3 py-1 text-emerald-400">{c.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Collapsible Error List */}
                  {parseResult.errors.length > 0 && (
                    <div className="border border-red-500/20 bg-red-500/5 rounded-lg overflow-hidden text-xs">
                      <button
                        onClick={() => setShowErrors(!showErrors)}
                        className="w-full flex items-center justify-between p-2.5 text-red-400 font-medium hover:bg-red-500/10 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" />
                          View {parseResult.errors.length} validation row error(s)
                        </span>
                        {showErrors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      {showErrors && (
                        <div className="max-h-32 overflow-y-auto border-t border-red-500/20 p-2 space-y-1 text-zinc-400">
                          {parseResult.errors.map((err, idx) => (
                            <div key={idx} className="flex justify-between gap-2 border-b border-white/5 pb-1">
                              <span>Row {err.row}: {err.name || "Unknown"} ({err.phone || "No Phone"})</span>
                              <span className="text-red-400 font-medium">{err.error}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Post-Import Summary Screen */}
          {importSummary && (
            <div className="space-y-4 py-4 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Import Complete</h3>
              <p className="text-xs text-zinc-400">Total Processed: {importSummary.totalRows}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-400">{importSummary.imported}</div>
                  <div className="text-xs text-zinc-400 font-medium">Imported</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-amber-400">{importSummary.duplicates}</div>
                  <div className="text-xs text-zinc-400 font-medium">Duplicates</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">{importSummary.invalid}</div>
                  <div className="text-xs text-zinc-400 font-medium">Invalid</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-400">{importSummary.totalRows}</div>
                  <div className="text-xs text-zinc-400 font-medium">Total Rows</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-100">
            {importSummary ? "Close" : "Cancel"}
          </Button>

          {!importSummary && (
            <Button
              onClick={handleImport}
              disabled={
                !parseResult ||
                !parseResult.success ||
                parseResult.contacts.length === 0 ||
                isImporting ||
                (isCreatingNewGroup && !newGroupName.trim())
              }
              className="bg-indigo-600 text-white hover:bg-indigo-500 gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${parseResult?.contacts.length || 0} Contacts`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
