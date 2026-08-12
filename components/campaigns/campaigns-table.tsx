"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CampaignStatus, TargetType } from "@/lib/db/models/Campaign";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Play, Square, Trash, Pencil, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface ICampaignListing {
  _id: string;
  name: string;
  status: CampaignStatus;
  recipientCount: number;
  targetType: TargetType;
  createdAt: string;
  scheduledAt?: string;
}

interface CampaignsTableProps {
  campaigns: ICampaignListing[];
  onDelete: (id: string) => Promise<void>;
  onSend: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onEdit: (campaign: ICampaignListing) => void;
}

export function CampaignsTable({ campaigns, onDelete, onSend, onCancel, onEdit }: CampaignsTableProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>, id: string) => {
    try {
      setIsProcessing(id);
      await action();
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case "DRAFT": return <Badge variant="secondary">Draft</Badge>;
      case "SENDING": return <Badge variant="default" className="bg-blue-600 hover:bg-blue-600">Sending</Badge>;
      case "COMPLETED": return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">Completed</Badge>;
      case "FAILED": return <Badge variant="destructive">Failed</Badge>;
      case "CANCELLED": return <Badge variant="outline">Cancelled</Badge>;
      case "SCHEDULED": return <Badge variant="default" className="bg-amber-600 hover:bg-amber-600">Scheduled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (campaigns.length === 0) {
    return null; // Handled by EmptyState in the parent
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/50 backdrop-blur-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-900/50 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Name</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Status</th>
              <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Recipients</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Target</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Created</th>
              <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {campaigns.map((campaign) => (
              <tr key={campaign._id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-200">
                  <Link href={`/campaigns/${campaign._id}`} className="hover:underline">
                    {campaign.name}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(campaign.status)}
                </td>
                <td className="px-6 py-4 text-right text-zinc-300">
                  {campaign.recipientCount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-zinc-400 capitalize">
                  {campaign.targetType.toLowerCase()}
                </td>
                <td className="px-6 py-4 text-zinc-400">
                  {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors" disabled={isProcessing === campaign._id}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem onClick={() => window.location.href = `/campaigns/${campaign._id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      
                      {campaign.status === "DRAFT" && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(campaign)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(() => onSend(campaign._id), campaign._id)}>
                            <Play className="mr-2 h-4 w-4 text-emerald-500" />
                            Send Now
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleAction(() => onDelete(campaign._id), campaign._id)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}

                      {campaign.status === "SENDING" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleAction(() => onCancel(campaign._id), campaign._id)}
                            className="text-amber-500 focus:text-amber-500"
                          >
                            <Square className="mr-2 h-4 w-4" />
                            Cancel Send
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
