"use client";

import { useState, useEffect, useMemo } from "react";
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
import { IGroup } from "@/lib/db/models/Group";
import { IContact } from "@/lib/db/models/Contact";
import { Loader2, Users, Upload, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImportContactsDialog } from "@/components/messages/import-contacts-dialog";
import { GroupFormDialog } from "@/components/groups/group-form-dialog";

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

  // Selections
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [error, setError] = useState("");

  const maxChars = 1600;

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [groupsRes, contactsRes] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/contacts"),
      ]);
      const groupsData = await groupsRes.json();
      const contactsData = await contactsRes.json();

      if (groupsData.success) {
        setGroups(groupsData.data?.groups || groupsData.groups || []);
      }
      if (contactsData.success) {
        const rawContacts = contactsData.data?.contacts || contactsData.contacts || [];
        setContacts(rawContacts.filter((c: any) => c.status === "SUBSCRIBED"));
      }
    } catch (err) {
      console.error("Failed to load targets", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (open) {
      setError("");
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

  // Recipient Count Calculation with Deduplication across groups
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
        <DialogContent className="sm:max-w-[650px] bg-zinc-950 text-zinc-100 border-zinc-800">
          <DialogHeader>
            <DialogTitle>{campaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Compose your SMS message and select your target audience.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g. Summer Sale Announcement"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting || isSending}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="message">Message</Label>
                <span className={`text-xs ${message.length > maxChars ? "text-destructive" : "text-zinc-500"}`}>
                  {message.length} / {maxChars} characters
                </span>
              </div>
              <Textarea
                id="message"
                placeholder="Type your message here... Use {{name}} to personalize."
                className="h-32 resize-none bg-zinc-900 border-zinc-800 text-zinc-100"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSubmitting || isSending}
              />
            </div>

            {/* Recipient Selection Header */}
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <Label className="text-sm font-semibold text-zinc-100">Recipients</Label>
                  <p className="text-xs text-zinc-400">Select audience segment or import new contacts.</p>
                </div>
                <div className="flex items-center gap-2">
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
              <div className="grid gap-4 md:grid-cols-2">
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
              disabled={isSubmitting || isSending || isLoadingData}
              className="border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Draft
            </Button>
            {!campaign || String(campaign.status).toUpperCase() === "DRAFT" ? (
              <Button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSubmitting || isSending || isLoadingData}
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
