"use client";

import { useState, useEffect, useCallback } from "react";
import { GroupsTable } from "@/components/groups/groups-table";
import { GroupFormDialog } from "@/components/groups/group-form-dialog";
import { ImportContactsDialog } from "@/components/messages/import-contacts-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = searchQuery ? `/api/groups?search=${encodeURIComponent(searchQuery)}` : "/api/groups";
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) throw new Error(json.error?.message || "Unable to load groups.");

      setGroups(json.data?.groups || json.groups || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
      toast.error("Unable to load groups.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchGroups]);

  const handleAdd = () => {
    setSelectedGroup(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (group: any) => {
    setSelectedGroup(group);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Groups</h1>
          <p className="text-zinc-400 mt-1">Organize your contacts into segments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <ImportContactsDialog onImportSuccess={fetchGroups} />
          <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
            <Plus className="mr-2 h-4 w-4" />
            + Create Group
          </Button>
        </div>
      </div>

      <div className="flex items-center w-full">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search groups by name..."
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
          <Button variant="outline" size="sm" onClick={fetchGroups} className="ml-auto bg-transparent border-red-500/20 hover:bg-red-500/20 text-red-400">
            Retry
          </Button>
        </div>
      ) : (
        <GroupsTable
          groups={groups}
          isLoading={isLoading}
          onEdit={handleEdit}
          onRefresh={fetchGroups}
          onAddGroup={handleAdd}
        />
      )}

      <GroupFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        group={selectedGroup}
        onSuccess={fetchGroups}
      />
    </div>
  );
}
