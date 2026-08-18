"use client";

import { useState } from "react";
import { Edit2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IContact } from "@/lib/db/models/Contact";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface ContactsTableProps {
  contacts: IContact[];
  isLoading: boolean;
  onEdit: (contact: IContact) => void;
  onRefresh: () => void;
  onAddContact?: () => void;
  onRemoveFromGroup?: (contact: IContact) => void;
}

export function ContactsTable({
  contacts,
  isLoading,
  onEdit,
  onRefresh,
  onAddContact,
  onRemoveFromGroup,
}: ContactsTableProps) {
  const [deletingContact, setDeletingContact] = useState<IContact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingContact) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${deletingContact._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to delete contact");
      }

      toast.success("Contact deleted successfully.");
      setDeletingContact(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Unable to delete contact.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-w-0 rounded-md border border-zinc-800 overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 whitespace-nowrap">Name</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Phone</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Email</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Tags</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Status</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i} className="border-zinc-800">
                <TableCell><div className="h-4 w-24 bg-zinc-800 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 w-32 bg-zinc-800 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 w-32 bg-zinc-800 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 w-16 bg-zinc-800 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-6 w-20 bg-zinc-800 rounded-full animate-pulse"></div></TableCell>
                <TableCell><div className="h-8 w-16 bg-zinc-800 rounded ml-auto animate-pulse"></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        title="No contacts found"
        description="Add your first contact to start building your audience."
        icon={<Users className="h-6 w-6" />}
        actionLabel={onAddContact ? "Add Contact" : undefined}
        onAction={onAddContact}
      />
    );
  }

  return (
    <>
      <div className="w-full min-w-0 rounded-md border border-zinc-800 overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Name</TableHead>
              <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Phone</TableHead>
              <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Email</TableHead>
              <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Tags</TableHead>
              <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Status</TableHead>
              <TableHead className="text-zinc-400 font-medium whitespace-nowrap text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={String(contact._id)} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                <TableCell className="font-medium text-zinc-200">{contact.name}</TableCell>
                <TableCell className="text-zinc-300 font-mono">{contact.phone}</TableCell>
                <TableCell className="text-zinc-400">{contact.email || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                        {tag}
                      </Badge>
                    ))}
                    {(!contact.tags || contact.tags.length === 0) && <span className="text-zinc-500">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={contact.status === "SUBSCRIBED" ? "default" : "destructive"}
                    className={
                      contact.status === "SUBSCRIBED"
                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                    }
                  >
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onRemoveFromGroup ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveFromGroup(contact)}
                        className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                      >
                        Remove
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(contact)}
                          className="h-8 w-8 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10"
                          aria-label={`Edit contact ${contact.name}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingContact(contact)}
                          className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                          aria-label={`Delete contact ${contact.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={Boolean(deletingContact)}
        onOpenChange={(open) => !open && setDeletingContact(null)}
        title="Delete Contact?"
        description={
          <>
            Are you sure you want to delete <strong className="text-zinc-100">{deletingContact?.name}</strong> ({deletingContact?.phone})?
            <br />
            This action cannot be undone.
          </>
        }
        confirmText="Delete Contact"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
