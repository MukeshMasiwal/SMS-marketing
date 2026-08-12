"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ManageGroupContactsDialog } from "@/components/groups/manage-group-contacts-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { IContact } from "@/lib/db/models/Contact";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;
  
  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchGroup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const json = await res.json();
      
      if (!json.success) throw new Error(json.error?.message || "Unable to load group.");
      
      setGroup(json.data.group);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
      toast.error("Unable to load group details.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleRemoveFromGroup = async (contact: IContact) => {
    const contactId = String(contact._id);
    if (!window.confirm("Are you sure you want to remove this contact from the group? The contact will not be deleted from your address book.")) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/contacts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: [contactId] })
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error?.message);

      toast.success("Contact removed from group.");
      fetchGroup(); // Refresh list
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to remove contact from group.");
      } else {
        toast.error("Failed to remove contact from group.");
      }
    }
  };

  const handleEmptyStateAction = () => {
    setIsAddDialogOpen(true);
  };

  if (isLoading && !group) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-48 bg-zinc-800 rounded mb-4"></div>
          <div className="h-4 w-32 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Error Loading Group</h2>
        <p className="text-zinc-400 mb-6">{error}</p>
        <Button onClick={() => router.push("/groups")} variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300">
          Back to Groups
        </Button>
      </div>
    );
  }

  const existingContactIds = group?.contacts?.map((c: any) => String(c._id)) || [];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header section */}
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/groups")} 
          className="w-fit -ml-2 text-zinc-400 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Groups
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{group?.name}</h1>
            {group?.description && (
              <p className="text-zinc-400 mt-2 max-w-2xl">{group.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4 text-sm text-zinc-500">
              <span className="bg-zinc-800/50 px-2 py-1 rounded text-zinc-300 font-medium">
                {group?.contactCount || 0} Contacts
              </span>
            </div>
          </div>
          
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
            <Plus className="mr-2 h-4 w-4" />
            Add Contacts
          </Button>
        </div>
      </div>
      
      {/* Table section */}
      <div className="mt-4">
        <ContactsTable 
          contacts={group?.contacts || []} 
          isLoading={isLoading} 
          onEdit={() => {}} // Not used when onRemoveFromGroup is present
          onRefresh={fetchGroup}
          onAddContact={handleEmptyStateAction}
          onRemoveFromGroup={handleRemoveFromGroup}
        />
      </div>

      <ManageGroupContactsDialog 
        groupId={groupId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchGroup}
        existingContactIds={existingContactIds}
      />
    </div>
  );
}
