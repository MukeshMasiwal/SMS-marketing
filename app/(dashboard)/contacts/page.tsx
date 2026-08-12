"use client";

import { useState, useEffect, useCallback } from "react";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { IContact } from "@/lib/db/models/Contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<IContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<IContact | null>(null);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = searchQuery ? `/api/contacts?search=${encodeURIComponent(searchQuery)}` : "/api/contacts";
      const res = await fetch(url);
      const json = await res.json();
      
      if (!json.success) throw new Error(json.error?.message || "Unable to load contacts.");
      
      setContacts(json.data.contacts);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
      toast.error("Unable to load contacts.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchContacts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const handleAdd = () => {
    setSelectedContact(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (contact: IContact) => {
    setSelectedContact(contact);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Contacts</h1>
          <p className="text-zinc-400 mt-1">Manage your audience and subscribers.</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search by name, phone, or email..." 
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchContacts} className="ml-auto bg-transparent border-red-500/20 hover:bg-red-500/20 text-red-400">
            Retry
          </Button>
        </div>
      ) : (
        <ContactsTable 
          contacts={contacts} 
          isLoading={isLoading} 
          onEdit={handleEdit} 
          onRefresh={fetchContacts}
          onAddContact={handleAdd}
        />
      )}

      <ContactFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        contact={selectedContact}
        onSuccess={fetchContacts}
      />
    </div>
  );
}
