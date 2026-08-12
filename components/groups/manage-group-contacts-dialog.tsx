"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { IContact } from "@/lib/db/models/Contact";
import { Search } from "lucide-react";

interface ManageGroupContactsDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingContactIds: string[];
}

export function ManageGroupContactsDialog({ groupId, open, onOpenChange, onSuccess, existingContactIds }: ManageGroupContactsDialogProps) {
  const [contacts, setContacts] = useState<IContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = searchQuery ? `/api/contacts?search=${encodeURIComponent(searchQuery)}` : "/api/contacts";
      const res = await fetch(url);
      const json = await res.json();
      
      if (!json.success) throw new Error(json.error?.message || "Failed to load contacts.");
      
      setContacts(json.data.contacts);
    } catch (error) {
      toast.error("Unable to fetch contacts.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      fetchContacts();
      setSelectedIds(new Set()); // Reset selections on open
    }
  }, [open, fetchContacts]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAddContacts = async () => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: Array.from(selectedIds) })
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to add contacts.");
      }

      toast.success("Contacts added to group successfully.");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Unable to add contacts.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 text-zinc-50 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Add Contacts to Group</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Select contacts to add to this group. Contacts already in the group are disabled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search your contacts..." 
              className="pl-9 bg-zinc-900 border-zinc-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="border border-zinc-800 rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-zinc-500 text-sm">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">No contacts found.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {contacts.map(contact => {
                  const id = String(contact._id);
                  const isExisting = existingContactIds.includes(id);
                  const isSelected = selectedIds.has(id);

                  return (
                    <div 
                      key={id} 
                      className={`flex items-center justify-between p-3 transition-colors ${isExisting ? 'opacity-50 bg-zinc-900/50' : 'hover:bg-zinc-900 cursor-pointer'}`}
                      onClick={() => !isExisting && toggleSelection(id)}
                    >
                      <div>
                        <p className="font-medium text-zinc-200 text-sm">{contact.name}</p>
                        <p className="text-zinc-500 text-xs">{contact.phone}</p>
                      </div>
                      <div>
                        {isExisting ? (
                          <span className="text-xs text-zinc-500 px-2">In group</span>
                        ) : (
                          <div className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-600'}`}>
                            {isSelected && <span className="text-[10px]">✓</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            Cancel
          </Button>
          <Button type="button" onClick={handleAddContacts} disabled={isSubmitting || selectedIds.size === 0} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {isSubmitting ? "Adding..." : `Add ${selectedIds.size > 0 ? selectedIds.size : ''} Contacts`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
