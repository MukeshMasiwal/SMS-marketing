"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Megaphone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { CampaignsTable, ICampaignListing } from "@/components/campaigns/campaigns-table";
import { CampaignFormDialog } from "@/components/campaigns/campaign-form-dialog";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<ICampaignListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data.campaigns);
      } else {
        setError(data.error?.message || "Failed to load campaigns");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateOrUpdate = async (formData: any) => {
    const url = editingCampaign ? `/api/campaigns/${editingCampaign._id}` : "/api/campaigns";
    const method = editingCampaign ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Failed to save campaign");
    }
    
    await fetchCampaigns();
    return data.data.campaign;
  };

  const handleSendNow = async (formData: any) => {
    // 1. Create or Update the draft
    const savedCampaign = await handleCreateOrUpdate(formData);
    
    // 2. Trigger Send
    const res = await fetch(`/api/campaigns/${savedCampaign._id}/send`, {
      method: "POST",
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Failed to send campaign");
    }
    
    await fetchCampaigns();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft campaign?")) return;
    
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCampaigns(campaigns.filter((c) => c._id !== id));
    } else {
      const data = await res.json();
      alert(data.error?.message || "Failed to delete");
    }
  };

  const handleSendFromTable = async (id: string) => {
    if (!confirm("Are you sure you want to send this campaign now?")) return;
    
    const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
    if (res.ok) {
      await fetchCampaigns();
    } else {
      const data = await res.json();
      alert(data.error?.message || "Failed to send campaign");
    }
  };

  const handleCancelFromTable = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this campaign? Some messages may have already been sent.")) return;
    
    const res = await fetch(`/api/campaigns/${id}/cancel`, { method: "POST" });
    if (res.ok) {
      await fetchCampaigns();
    } else {
      const data = await res.json();
      alert(data.error?.message || "Failed to cancel campaign");
    }
  };

  const openCreateDialog = () => {
    setEditingCampaign(null);
    setIsFormOpen(true);
  };

  const openEditDialog = async (campaign: ICampaignListing) => {
    // Fetch full campaign details for editing (need the target IDs)
    const res = await fetch(`/api/campaigns/${campaign._id}`);
    const data = await res.json();
    if (data.success) {
      const c = data.data.campaign;
      setEditingCampaign({
        ...c,
        targetGroupIds: c.targetGroupIds.map((g: any) => g._id),
        targetContactIds: c.targetContactIds.map((con: any) => con._id),
      });
      setIsFormOpen(true);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Campaigns</h1>
          <p className="text-zinc-400 mt-1">Manage and send SMS marketing campaigns.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/50 backdrop-blur-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="No campaigns yet"
          description="Start engaging with your audience by creating your first SMS campaign."
          actionLabel="Create Campaign"
          onAction={openCreateDialog}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-950/50 border-white/10"
              />
            </div>
            <div className="w-full sm:w-[180px]">
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="bg-zinc-950/50 border-white/10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="SENDING">Sending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900/50 text-zinc-400 mb-4">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">No campaigns found</h3>
              <p className="mt-2 text-sm text-zinc-400 max-w-sm">
                Try changing your search or filter.
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }} className="mt-4">
                Clear Filters
              </Button>
            </div>
          ) : (
            <CampaignsTable 
              campaigns={filteredCampaigns} 
              onDelete={handleDelete} 
              onSend={handleSendFromTable}
              onCancel={handleCancelFromTable}
              onEdit={openEditDialog}
            />
          )}
        </div>
      )}

      <CampaignFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        campaign={editingCampaign}
        onSave={handleCreateOrUpdate}
        onSendNow={handleSendNow}
      />
    </div>
  );
}
