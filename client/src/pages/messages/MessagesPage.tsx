import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchWithAuth, formatApiErrorMessage } from "../../services/apiClient";
import {
  calculateSmsSegments,
  validateTemplateVariables,
  renderMessageTemplate,
} from "../../../../lib/services/template-service";
import {
  MessageSquare,
  Users,
  User,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

export interface ContactItem {
  _id: string;
  name: string;
  phone: string;
  groupId?: string;
}

export interface GroupItem {
  _id: string;
  name: string;
  contactCount?: number;
}

export interface TemplateItem {
  _id: string;
  name: string;
  message: string;
}

export interface MessageLogItem {
  _id: string;
  messageId: string;
  recipient: string;
  message: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
  provider: string;
  errorMessage?: string;
  createdAt: string;
}

export const MessagesPage: React.FC = () => {
  // Recipient selection state
  const [recipientType, setRecipientType] = useState<"group" | "individual">("group");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Available data options
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Message composer state
  const [message, setMessage] = useState("Hi {{name}}, welcome to our SMS service!");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [fallbackName, setFallbackName] = useState("Customer");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Modal & sending progress state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchResult, setBatchResult] = useState<{
    total: number;
    sent: number;
    failed: number;
    failures: Array<{ contactId: string; name?: string; phone: string; reason: string }>;
  } | null>(null);

  // Message logs
  const [logs, setLogs] = useState<MessageLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch initial data (groups, contacts, templates, logs)
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [groupsRes, contactsRes, templatesRes] = await Promise.all([
        fetchWithAuth("/api/groups").catch(() => null),
        fetchWithAuth("/api/contacts").catch(() => null),
        fetchWithAuth("/api/templates").catch(() => null),
      ]);

      if (groupsRes?.ok) {
        const json = await groupsRes.json();
        if (json.success) {
          const gList = json.data?.groups || json.groups || [];
          setGroups(gList);
          if (gList.length > 0 && !selectedGroupId) {
            setSelectedGroupId(gList[0]._id);
          }
        }
      }

      if (contactsRes?.ok) {
        const json = await contactsRes.json();
        if (json.success) {
          setContacts(json.data?.contacts || json.contacts || []);
        }
      }

      if (templatesRes?.ok) {
        const json = await templatesRes.json();
        if (json.success) {
          setTemplates(json.data?.templates || json.templates || []);
        }
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedGroupId]);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetchWithAuth("/api/messages");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setLogs(json.data?.messages || json.messages || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch message logs", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchLogs();
  }, [fetchData, fetchLogs]);

  // Resolve target contacts based on current selection
  const resolvedContacts = React.useMemo(() => {
    if (recipientType === "group") {
      if (!selectedGroupId) return [];
      return contacts.filter((c) => c.groupId === selectedGroupId);
    } else {
      return contacts.filter((c) => selectedContactIds.includes(c._id));
    }
  }, [recipientType, selectedGroupId, selectedContactIds, contacts]);

  // Missing name count
  const missingNameCount = React.useMemo(() => {
    return resolvedContacts.filter((c) => !c.name || !c.name.trim()).length;
  }, [resolvedContacts]);

  // Representative preview contacts (first 2-3)
  const previewContacts = React.useMemo(() => {
    if (resolvedContacts.length > 0) return resolvedContacts.slice(0, 3);
    return [
      { _id: "p1", name: "Rahul", phone: "+919876543210" },
      { _id: "p2", name: "Priya", phone: "+919123456789" },
    ];
  }, [resolvedContacts]);

  // SMS segment calculation
  const smsSegments = React.useMemo(() => {
    // Render preview for length calculation
    const sampleRendered = renderMessageTemplate(
      message,
      resolvedContacts[0] || { name: "Rahul", phone: "9876543210" },
      undefined,
      fallbackName
    );
    return calculateSmsSegments(sampleRendered);
  }, [message, resolvedContacts, fallbackName]);

  // Template variable validation
  const variableValidation = React.useMemo(() => {
    return validateTemplateVariables(message);
  }, [message]);

  // Insert {{name}} at current cursor position
  const handleInsertName = () => {
    if (!textareaRef.current) {
      setMessage((prev) => prev + " {{name}}");
      return;
    }

    const input = textareaRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const textToInsert = "{{name}}";

    const newText = message.substring(0, start) + textToInsert + message.substring(end);
    setMessage(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const t = templates.find((item) => item._id === templateId);
    if (t) {
      setMessage(t.message);
      toast.info(`Loaded template: "${t.name}"`);
    }
  };

  // Handle checkbox toggle for individual contact selection
  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  // Trigger Send Confirmation Modal
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (resolvedContacts.length === 0) {
      toast.error("Please select at least one recipient.");
      return;
    }

    if (!message || !message.trim()) {
      toast.error("Message content cannot be empty.");
      return;
    }

    if (!variableValidation.valid) {
      toast.error(
        `Unsupported placeholder variable(s): {{${variableValidation.invalidVariables.join(
          "}}, {{"
        )}}}. Only {{name}}, {{phone}}, and {{campaign_name}} are supported.`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute batch send
  const handleConfirmSend = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    setSendProgress({ current: 0, total: resolvedContacts.length });
    setBatchResult(null);

    try {
      const payload = {
        recipientType,
        groupId: recipientType === "group" ? selectedGroupId : undefined,
        contactIds: recipientType === "individual" ? selectedContactIds : undefined,
        message,
        fallbackName,
      };

      const res = await fetchWithAuth("/api/messages/send", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setBatchResult(json.data);
        if (json.data.failed === 0) {
          toast.success(`Successfully sent ${json.data.sent} personalized SMS messages!`);
        } else {
          toast.warning(`Sent ${json.data.sent} messages, ${json.data.failed} failed.`);
        }
        fetchLogs();
      } else {
        const errorMsg = json.error?.message || formatApiErrorMessage(res, "Failed to send batch messages.");
        toast.error(errorMsg);
      }
    } catch (err: any) {
      toast.error(err.message || "Unable to connect to the server.");
    } finally {
      setIsSending(false);
      setSendProgress(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-indigo-400" />
            <span>Send Personalized SMS</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Dispatch personalized SMS messages to contacts or groups using Exotel.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoadingLogs}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLogs ? "animate-spin" : ""}`} />
          <span>Refresh History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recipient & Message Composer */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleInitiateSend} className="space-y-6">
            {/* 1. Recipient Selection Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <Users className="h-4 w-4 text-indigo-400" />
                  <span>1. Select Recipients</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-900/50 text-[11px] font-mono font-semibold text-indigo-300">
                  {resolvedContacts.length} recipient{resolvedContacts.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Recipient Type Tabs */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientType("group")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    recipientType === "group"
                      ? "border-indigo-500 bg-indigo-950/50 text-indigo-200 font-semibold"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Contact Group</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType("individual")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    recipientType === "individual"
                      ? "border-indigo-500 bg-indigo-950/50 text-indigo-200 font-semibold"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Individual Contacts</span>
                </button>
              </div>

              {/* Group Selector */}
              {recipientType === "group" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Choose Contact Group</label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {groups.length === 0 ? (
                      <option value="">No contact groups available</option>
                    ) : (
                      groups.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name} ({contacts.filter((c) => c.groupId === g._id).length} contacts)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                /* Individual Contacts Multi-Select */
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Select Contacts</label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2 space-y-1 divide-y divide-zinc-900">
                    {contacts.length === 0 ? (
                      <p className="p-3 text-center text-xs text-zinc-500">No contacts available.</p>
                    ) : (
                      contacts.map((c) => (
                        <label
                          key={c._id}
                          className="flex items-center justify-between p-2 hover:bg-zinc-900/60 rounded cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedContactIds.includes(c._id)}
                              onChange={() => toggleContactSelection(c._id)}
                              className="rounded border-zinc-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span className="text-xs font-medium text-zinc-200">{c.name || "No Name"}</span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">{c.phone}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Message Composer Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span>2. Compose Message</span>
                </div>

                {/* Template Selection Dropdown */}
                {templates.length > 0 && (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Template ▼</option>
                    {templates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <textarea
                  ref={textareaRef}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message... Use {{name}} to personalize for each recipient."
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-sans"
                />

                {/* Controls & Variable Insert */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Personalize:</span>
                    <button
                      type="button"
                      onClick={handleInsertName}
                      className="px-2.5 py-1 rounded-md border border-indigo-500/40 bg-indigo-950/60 hover:bg-indigo-900/60 text-xs font-mono font-semibold text-indigo-300 transition-colors"
                    >
                      + {"{{name}}"}
                    </button>
                  </div>

                  {/* SMS Segment Counter */}
                  <div className="text-[11px] text-zinc-400 font-mono">
                    <span>{smsSegments.charCount} characters</span> ·{" "}
                    <span className="text-indigo-400 font-semibold">{smsSegments.segmentCount} SMS</span> ·{" "}
                    <span>{smsSegments.encoding}</span>
                  </div>
                </div>

                {/* Variable Validation Warning */}
                {!variableValidation.valid && (
                  <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Unsupported variable(s):{" "}
                      {variableValidation.invalidVariables.map((v) => `{{${v}}}`).join(", ")}. Please remove or fix placeholders.
                    </span>
                  </div>
                )}
              </div>

              {/* Submit / Send Button */}
              <button
                type="submit"
                disabled={isSending || resolvedContacts.length === 0 || !variableValidation.valid}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>
                      Sending {sendProgress ? `${sendProgress.current}/${sendProgress.total}` : "..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>
                      Send to {resolvedContacts.length} recipient{resolvedContacts.length === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Batch Result Summary Card */}
          {batchResult && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Batch Execution Complete</span>
                </h3>
                <span className="text-xs font-mono text-zinc-400">
                  {batchResult.sent}/{batchResult.total} Sent
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                  <span className="font-bold text-lg">{batchResult.sent}</span> Successful
                </div>
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300">
                  <span className="font-bold text-lg">{batchResult.failed}</span> Failed
                </div>
              </div>

              {batchResult.failures.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                  <span className="text-xs font-semibold text-red-400">Failure Details:</span>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {batchResult.failures.map((f, idx) => (
                      <div key={idx} className="p-2 rounded bg-zinc-950 text-[11px] font-mono text-zinc-300 flex justify-between">
                        <span>{f.name || f.phone}</span>
                        <span className="text-red-400 truncate max-w-[200px]" title={f.reason}>{f.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Personalized Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 shadow-xl sticky top-24">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-sm font-semibold text-zinc-200">3. Live Personalized Preview</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Previewing {previewContacts.length} of {resolvedContacts.length}
              </span>
            </div>

            {/* Missing Name Fallback Alert */}
            {missingNameCount > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{missingNameCount} contact(s) missing a name.</span>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    They will receive &quot;{fallbackName}&quot; as the fallback placeholder.
                  </p>
                </div>
              </div>
            )}

            {/* Preview Cards for representative recipients */}
            <div className="space-y-3">
              {previewContacts.map((c, index) => {
                const previewText = renderMessageTemplate(
                  message,
                  { name: c.name, phone: c.phone },
                  undefined,
                  fallbackName
                );

                return (
                  <div key={c._id || index} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-zinc-800/60 pb-2">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-indigo-400" />
                        {c.name || `Contact #${index + 1} (No Name)`}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500">{c.phone}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                      {previewText || <span className="text-zinc-600 italic">Empty message...</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100">Confirm SMS Batch Dispatch</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Recipients:</span>
                  <span className="font-bold text-zinc-100">{resolvedContacts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Est. Total SMS Count:</span>
                  <span className="font-bold text-indigo-400">
                    {resolvedContacts.length * smsSegments.segmentCount}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-zinc-400">Sample Rendered Message:</span>
                <p className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 whitespace-pre-wrap font-sans">
                  {renderMessageTemplate(message, previewContacts[0], undefined, fallbackName)}
                </p>
              </div>

              <p className="text-[11px] text-zinc-400 italic">
                Each contact will receive their own individually personalized SMS via Exotel.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors"
              >
                Send to {resolvedContacts.length} recipient{resolvedContacts.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Delivery Logs Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Outgoing Message Logs</h2>
            <p className="text-xs text-zinc-400">History of actual personalized messages sent per recipient.</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 font-mono text-zinc-400">
            {logs.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Actual Personalized Message</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No message log entries found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-zinc-200 whitespace-nowrap">{log.recipient}</td>
                    <td className="px-4 py-3 text-zinc-300 max-w-md truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold bg-indigo-950/70 text-indigo-400 border border-indigo-900/50">
                        {log.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          log.status === "DELIVERED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : log.status === "SENT" || log.status === "QUEUED"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                        title={log.errorMessage}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
