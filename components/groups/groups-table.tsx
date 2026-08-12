"use client";

import { useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IGroup } from "@/lib/db/models/Group";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { UsersRound } from "lucide-react";
import Link from "next/link";

interface GroupsTableProps {
  groups: any[]; // using any for mapped UI data that includes contactCount
  isLoading: boolean;
  onEdit: (group: any) => void;
  onRefresh: () => void;
  onAddGroup: () => void;
}

export function GroupsTable({ groups, isLoading, onEdit, onRefresh, onAddGroup }: GroupsTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this group? Contacts inside the group will not be deleted.")) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      
      toast.success("Group deleted successfully.");
      onRefresh();
    } catch (error) {
      toast.error("Unable to delete group.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border border-zinc-800 overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 whitespace-nowrap">Name</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Description</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap">Contact Count</TableHead>
              <TableHead className="text-zinc-400 whitespace-nowrap text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i} className="border-zinc-800">
                <TableCell><div className="h-4 w-32 bg-zinc-800 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 w-48 bg-zinc-800 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 w-12 bg-zinc-800 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-8 w-24 bg-zinc-800 rounded ml-auto animate-pulse"></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyState 
        title="No groups found"
        description="Create groups to organize your contacts for campaigns."
        icon={<UsersRound className="h-6 w-6" />}
        actionLabel="Create Group"
        onAction={onAddGroup}
      />
    );
  }

  return (
    <div className="rounded-md border border-zinc-800 overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader className="bg-zinc-900/50">
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Name</TableHead>
            <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Description</TableHead>
            <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Contact Count</TableHead>
            <TableHead className="text-zinc-400 font-medium whitespace-nowrap text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={String(group._id)} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors">
              <TableCell className="font-medium text-zinc-200">{group.name}</TableCell>
              <TableCell className="text-zinc-400">{group.description || "—"}</TableCell>
              <TableCell className="text-zinc-300">{group.contactCount}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/groups/${group._id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10" title="View Group Contacts" aria-label={`View contacts for ${group.name}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(group)} className="h-8 w-8 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10" title="Edit Group" aria-label={`Edit group ${group.name}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(String(group._id))} disabled={isDeleting === String(group._id)} className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-400/10" title="Delete Group" aria-label={`Delete group ${group.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
