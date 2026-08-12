"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [targetType, setTargetType] = useState<"CONTACTS" | "GROUP">("GROUP");
  
  // Data for selection
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [contacts, setContacts] = useState<IContact[]>([]);
  
  // Selections
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState("");

  const maxChars = 1600;
  
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [groupsRes, contactsRes] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/contacts")
      ]);
      const groupsData = await groupsRes.json();
      const contactsData = await contactsRes.json();
      
      if (groupsData.success) setGroups(groupsData.data.groups);
      if (contactsData.success) setContacts(contactsData.data.contacts.filter((c: any) => c.status === "SUBSCRIBED"));
    } catch (err) {
      console.error("Failed to load targets", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setError("");
      if (campaign) {
        setName(campaign.name);
        setMessage(campaign.message || "");
        setTargetType(campaign.targetType || "GROUP");
        setSelectedGroupIds(campaign.targetGroupIds || []);
        setSelectedContactIds(campaign.targetContactIds || []);
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
      setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
    } else {
      setSelectedContactIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && !isSending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{campaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
          <DialogDescription>
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
              placeholder="Type your message here..."
              className="h-32 resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting || isSending}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Target Type</Label>
              <Select 
                value={targetType} 
                onValueChange={(v: any) => setTargetType(v)}
                disabled={isSubmitting || isSending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GROUP">Contact Groups</SelectItem>
                  <SelectItem value="CONTACTS">Individual Contacts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{targetType === "GROUP" ? "Select Groups" : "Select Contacts (Subscribed only)"}</Label>
              
              <ScrollArea className="h-[120px] rounded-md border border-input p-2">
                {isLoadingData ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                  </div>
                ) : targetType === "GROUP" ? (
                  groups.length > 0 ? (
                    <div className="space-y-2">
                      {groups.map((group: any) => (
                        <div key={group._id.toString()} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`group-${group._id.toString()}`} 
                            checked={selectedGroupIds.includes(group._id.toString())}
                            onCheckedChange={() => toggleSelection(group._id.toString(), "GROUP")}
                          />
                          <Label htmlFor={`group-${group._id}`} className="text-sm font-normal cursor-pointer">
                            {group.name} <span className="text-zinc-500 text-xs">({group.contactIds.length})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 p-2 text-center">No groups found</div>
                  )
                ) : (
                  contacts.length > 0 ? (
                    <div className="space-y-2">
                      {contacts.map((contact: any) => (
                        <div key={contact._id.toString()} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`contact-${contact._id.toString()}`} 
                            checked={selectedContactIds.includes(contact._id.toString())}
                            onCheckedChange={() => toggleSelection(contact._id.toString(), "CONTACTS")}
                          />
                          <Label htmlFor={`contact-${contact._id}`} className="text-sm font-normal cursor-pointer truncate">
                            {contact.name} <span className="text-zinc-500 text-xs">({contact.phone})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 p-2 text-center">No subscribed contacts found</div>
                  )
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSubmitting || isSending || isLoadingData}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save as Draft
          </Button>
          {!campaign || campaign.status === "DRAFT" ? (
            <Button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSubmitting || isSending || isLoadingData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Now
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
