"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IContact } from "@/lib/db/models/Contact";
import { Loader2, Users, Upload, Plus, FileText, Eye, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImportContactsDialog } from "@/components/messages/import-contacts-dialog";
import { GroupFormDialog } from "@/components/groups/group-form-dialog";
import {
  validateTemplateVariables,
  renderMessageTemplate,
  calculateSmsSegments,
  TEMPLATE_VARIABLES,
} from "@/lib/services/template-service";

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: any;
  onSave: (data: any) => Promise<void>;
  onSendNow?: (data: any) => Promise<void>;
}

export function CampaignFormDialog({
  open,
  onOpenChange,
  campaign,
  onSave,
  onSendNow,
}: CampaignFormDialogProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"ALL" | "GROUP" | "CONTACTS">("GROUP");

  // Data for selection
  const [groups, setGroups] = useState<any[]>([]);
  const [contacts, setContacts] = useState<IContact[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Selections
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [error, setError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxChars = 1600;

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [groupsRes, contactsRes, templatesRes] = await Promise.all([
        fetch("/api/groups", { credentials: "include" }),
        fetch("/api/contacts", { credentials: "include" }),
        fetch("/api/templates", { credentials: "include" }),
      ]);
      const groupsData = await groupsRes.json();
      const contactsData = await contactsRes.json();
      const templatesData = await templatesRes.json();

      if (groupsData.success) {
        setGroups(groupsData.data?.groups || groupsData.groups || []);
      }
      if (contactsData.success) {
        const rawContacts = contactsData.data?.contacts || contactsData.contacts || [];
        setContacts(rawContacts.filter((c: any) => c.status === "SUBSCRIBED"));
      }
      if (templatesData.success) {
        setTemplates(templatesData.data?.templates || []);
      }
    } catch (err) {
      console.error("Failed to load campaign data", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (open) {
      setError("");
      setSelectedTemplateId("");
      if (campaign) {
        setName(campaign.name || "");
        setMessage(campaign.message || "");
        const rawTarget = String(campaign.targetType || "GROUP").toUpperCase();
        setTargetType(rawTarget as any);
        setSelectedGroupIds((campaign.targetGroupIds || []).map((g: any) => (typeof g === "object" ? g._id : g)));
        setSelectedContactIds((campaign.targetContactIds || []).map((c: any) => (typeof c === "object" ? c._id : c)));
      } else {
        setName("");
        setMessage("");
        setTargetType("GROUP");
        setSelectedGroupIds([]);
        setSelectedContactIds([]);
      }
      fetchData();
    }
  }, [open, campaign]);

  // Insert Variable at Cursor Position
  const handleInsertVariable = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage((prev) => prev + placeholder);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = message.substring(0, start);
    const textAfter = message.substring(end);

    const newMessage = textBefore + placeholder + textAfter;
    setMessage(newMessage);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  // Handle Template Selection
  const handleSelectTemplate = (templateId: string | null) => {
    if (!templateId) return;
    setSelectedTemplateId(templateId);
    const selected = templates.find((t) => t._id === templateId);
    if (selected) {
      setMessage(selected.message);
    }
  };

  // Recipient Count Calculation
  const recipientCount = useMemo(() => {
    if (targetType === "ALL") {
      return contacts.length;
    }

    if (targetType === "GROUP") {
      const uniqueContactIds = new Set<string>();
      groups.forEach((g) => {
        const gId = String(g._id);
        if (selectedGroupIds.includes(gId) && Array.isArray(g.contactIds)) {
          g.contactIds.forEach((cid: any) => {
            const contactIdStr = typeof cid === "object" ? String(cid._id) : String(cid);
            uniqueContactIds.add(contactIdStr);
          });
        }
      });
      return uniqueContactIds.size;
    }

    if (targetType === "CONTACTS") {
      return selectedContactIds.length;
    }

    return 0;
  }, [targetType, contacts, groups, selectedGroupIds, selectedContactIds]);

  // Sample contact for preview
  const previewContact = useMemo(() => {
    if (targetType === "CONTACTS" && selectedContactIds.length > 0) {
      const found = contacts.find((c) => String(c._id) === selectedContactIds[0]);
      if (found) return found;
    }
    if (contacts.length > 0) return contacts[0];
    return { name: "Rahul", phone: "9876543210" };
  }, [targetType, selectedContactIds, contacts]);

  // Real-time Variable Validation
  const validation = useMemo(() => {
    return validateTemplateVariables(message);
  }, [message]);

  // Live Rendered Campaign Preview
  const renderedPreview = useMemo(() => {
    return renderMessageTemplate(message, previewContact, { name: name || "Summer Sale" });
  }, [message, previewContact, name]);

  // Real-time Segment Info calculated on RENDERED PREVIEW
  const segmentInfo = useMemo(() => {
    return calculateSmsSegments(renderedPreview);
  }, [renderedPreview]);

  const getFormData = () => {
    return {
      name,
      message,
      targetType,
      targetGroupIds: targetType === "GROUP" ? selectedGroupIds : [],
      targetContactIds: targetType === "CONTACTS" ? selectedContactIds : [],
    };
  };

  const handleSave = async (isSendNow = false) => {
    if (!name.trim()) return setError("Campaign name is required");
    if (!message.trim()) return setError("Message is required");
    if (!validation.valid) {
      return setError(
        `Unsupported variable(s): {{${validation.invalidVariables.join("}}, {{")}}}. Allowed variables are {{name}}, {{phone}}, and {{campaign_name}}.`
      );
    }
    if (targetType === "GROUP" && selectedGroupIds.length === 0) return setError("Select at least one group");
    if (targetType === "CONTACTS" && selectedContactIds.length === 0) return setError("Select at least one contact");

    setError("");
    const actionState = isSendNow ? setIsSending : setIsSubmitting;
    actionState(true);

    try {
      if (isSendNow && onSendNow) {
        await onSendNow(getFormData());
      } else {
        await onSave(getFormData());
      }
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      actionState(false);
    }
  };

  const toggleSelection = (id: string, type: "GROUP" | "CONTACTS") => {
    if (type === "GROUP") {
      setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]));
    } else {
      setSelectedContactIds((prev) => (prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !isSubmitting && !isSending && onOpenChange(val)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-zinc-950 text-zinc-100 border-zinc-800">
          <DialogHeader>
            <DialogTitle>{campaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Compose your SMS message, use templates with dynamic variables, and select target recipients.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl bg-rose-950/40 p-3 text-xs text-rose-300 border border-rose-800/60 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-5 py-2">
            {/* Campaign Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-zinc-200">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g. Summer Sale Announcement"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting || isSending}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-sm focus-visible:ring-indigo-500"
              />
            </div>

            {/* Load Saved Template Dropdown */}
            {templates.length > 0 && (
              <div className="grid gap-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Load Message Template</span>
                  </Label>
                  <span className="text-[11px] text-zinc-500">Loads raw template with variables</span>
                </div>
                <Select value={selectedTemplateId} onValueChange={handleSelectTemplate} disabled={isSubmitting || isSending}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs h-9">
                    <SelectValue placeholder="Select a saved template..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    {templates.map((t) => (
                      <SelectItem key={t._id} value={t._id} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Message & Variable Controls */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message" className="text-xs font-semibold text-zinc-200">
                  Message Body
                </Label>
                <span className={`text-xs ${message.length > maxChars ? "text-rose-400 font-bold" : "text-zinc-500"}`}>
                  {message.length} / {maxChars} characters
                </span>
              </div>

              {/* Variable Buttons */}
              <div className="flex flex-wrap gap-1.5 items-center p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
                <span className="text-[11px] text-zinc-400 font-medium mr-1">Insert variable:</span>
                {TEMPLATE_VARIABLES.map((v) => (
                  <Button
                    key={v.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertVariable(v.placeholder)}
                    disabled={isSubmitting || isSending}
                    className="h-6 text-[11px] font-mono border-indigo-900/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 hover:text-white px-2"
                  >
                    + {v.placeholder}
                  </Button>
                ))}
              </div>

              <Textarea
                ref={textareaRef}
                id="message"
                placeholder="Type your campaign message here... e.g. Hi {{name}}, welcome to {{campaign_name}}!"
                className="h-28 resize-none bg-zinc-900 border-zinc-800 text-zinc-100 text-sm focus-visible:ring-indigo-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSubmitting || isSending}
              />
            </div>

            {/* Validation Warning */}
            {!validation.valid && (
              <div className="rounded-xl bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-200 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-rose-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Unsupported Variable Detected</span>
                </div>
                <p className="text-[11px] text-rose-300/90 leading-relaxed">
                  The placeholder(s){" "}
                  <strong className="font-mono text-white">
                    {`{{${validation.invalidVariables.join("}}, {{")}}}`}
                  </strong>{" "}
                  are not supported. Only <code className="text-indigo-300">{"{{name}}"}</code>,{" "}
                  <code className="text-indigo-300">{"{{phone}}"}</code>, and{" "}
                  <code className="text-indigo-300">{"{{campaign_name}}"}</code> are permitted.
                </p>
              </div>
            )}

            {/* Live Personalized Campaign Preview */}
            <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Eye className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Personalized Campaign Preview</span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  Sample recipient: <strong className="text-zinc-200">{previewContact.name}</strong> ({previewContact.phone})
                </span>
              </div>

              <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/80 text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed min-h-[50px]">
                {renderedPreview || <span className="text-zinc-500 italic">Preview will update as you type...</span>}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
                <div className="flex items-center gap-3">
                  <span>Characters: <strong className="text-zinc-200">{segmentInfo.charCount}</strong></span>
                  <span>SMS Segments: <strong className="text-indigo-300">{segmentInfo.segmentCount}</strong></span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
                    {segmentInfo.encoding}
                  </span>
                </div>
                {segmentInfo.segmentCount > 1 && (
                  <span className="text-amber-400 font-medium">
                    Requires {segmentInfo.segmentCount} SMS credits / contact
                  </span>
                )}
              </div>
            </div>

            {/* Recipient Selection */}
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <Label className="text-sm font-semibold text-zinc-100">Recipients</Label>
                  <p className="text-xs text-zinc-400">Select audience segment or import new contacts.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Users className="h-3.5 w-3.5" />
                    {recipientCount.toLocaleString()} contacts
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportOpen(true)}
                    className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800"
                  >
                    <Upload className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Import Contacts</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Add Group</span>
                  </Button>
                </div>
              </div>

              {/* Target Type Selector */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-zinc-300">Target Type</Label>
                  <Select
                    value={targetType}
                    onValueChange={(v: any) => setTargetType(v)}
                    disabled={isSubmitting || isSending}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectValue placeholder="Select target type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                      <SelectItem value="ALL">All Contacts ({contacts.length})</SelectItem>
                      <SelectItem value="GROUP">Select Groups</SelectItem>
                      <SelectItem value="CONTACTS">Select Contacts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Options List */}
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-zinc-300">
                    {targetType === "ALL"
                      ? "All Subscribed Audience"
                      : targetType === "GROUP"
                      ? "Select Groups"
                      : "Select Contacts"}
                  </Label>

                  {targetType === "ALL" ? (
                    <div className="flex h-[120px] items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 p-4 text-center text-xs text-zinc-400">
                      Targeting all {contacts.length} subscribed contacts in your database.
                    </div>
                  ) : (
                    <ScrollArea className="h-[120px] rounded-md border border-zinc-800 bg-zinc-900 p-2">
                      {isLoadingData ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                        </div>
                      ) : targetType === "GROUP" ? (
                        groups.length > 0 ? (
                          <div className="space-y-2">
                            {groups.map((group: any) => {
                              const gId = String(group._id);
                              const gCount = Array.isArray(group.contactIds) ? group.contactIds.length : 0;
                              return (
                                <div key={gId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`group-${gId}`}
                                    checked={selectedGroupIds.includes(gId)}
                                    onCheckedChange={() => toggleSelection(gId, "GROUP")}
                                  />
                                  <Label htmlFor={`group-${gId}`} className="text-xs font-normal cursor-pointer text-zinc-200">
                                    {group.name} <span className="text-zinc-500">({gCount} contacts)</span>
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-500 p-2 text-center">No groups found</div>
                        )
                      ) : contacts.length > 0 ? (
                        <div className="space-y-2">
                          {contacts.map((contact: any) => {
                            const cId = String(contact._id);
                            return (
                              <div key={cId} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`contact-${cId}`}
                                  checked={selectedContactIds.includes(cId)}
                                  onCheckedChange={() => toggleSelection(cId, "CONTACTS")}
                                />
                                <Label htmlFor={`contact-${cId}`} className="text-xs font-normal cursor-pointer truncate text-zinc-200">
                                  {contact.name} <span className="text-zinc-500">({contact.phone})</span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 p-2 text-center">No subscribed contacts found</div>
                      )}
                    </ScrollArea>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSubmitting || isSending || isLoadingData || !validation.valid}
              className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Draft
            </Button>
            {!campaign || String(campaign.status).toUpperCase() === "DRAFT" ? (
              <Button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSubmitting || isSending || isLoadingData || !validation.valid}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Now
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportContactsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={fetchData}
      />

      <GroupFormDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        onSuccess={fetchData}
      />
    </>
  );
}
