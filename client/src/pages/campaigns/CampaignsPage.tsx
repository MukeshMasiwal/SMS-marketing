import React, { useState, useEffect, useCallback } from "react";
import { Plus, Megaphone, Search, Edit2, Trash2, UsersRound } from "lucide-react";
import { getCampaigns, deleteCampaign } from "../../services/campaignService";
import { Campaign } from "../../types";
import { ConfirmDialog } from "../../../../components/shared/confirm-dialog";
import { GroupFormDialog } from "../../../../components/groups/group-form-dialog";
import { toast } from "sonner";

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getCampaigns({ search: searchQuery, status: statusFilter });
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message || "Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateNew = () => {
    window.location.href = "/campaigns/create";
  };

  const handleEditDraft = (id: string) => {
    window.location.href = `/campaigns/${id}/edit`;
  };

  const confirmDelete = async () => {
    if (!deletingCampaign || !deletingCampaign._id) return;

    setIsDeleting(true);
    try {
      await deleteCampaign(deletingCampaign._id);
      toast.success("Campaign deleted successfully.");
      setDeletingCampaign(null);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete campaign.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            Draft
          </span>
        );
      case "sending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Sending
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            Failed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Campaigns</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage and create your SMS marketing campaigns.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAddGroupOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-100 text-sm font-medium transition-colors"
          >
            <UsersRound className="h-4 w-4 text-indigo-400" />
            <span>+ Add Group</span>
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search campaigns by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/10 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-[180px] bg-zinc-950 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 mb-4">
            <Megaphone className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">No campaigns yet</h3>
          <p className="mt-1 text-sm text-zinc-400 max-w-sm">
            Start engaging with your audience by creating your first SMS campaign draft.
          </p>
          <button
            onClick={handleCreateNew}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-zinc-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Campaign Name</th>
                  <th className="px-6 py-3.5 min-w-[200px]">Message Preview</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Recipients</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {campaigns.map((c) => {
                  const s = (c.status || "").toLowerCase();
                  const isDraft = s === "draft";
                  const isSending = s === "sending";

                  return (
                    <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-100">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 truncate max-w-[250px]" title={c.message}>
                        {c.message}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                      <td className="px-6 py-4 text-right font-mono text-zinc-300">
                        {(c.recipientCount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-xs whitespace-nowrap">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {isDraft && c._id && (
                            <button
                              onClick={() => handleEditDraft(c._id!)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                          )}
                          {!isSending && c._id && (
                            <button
                              onClick={() => setDeletingCampaign(c)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-red-500/10 border border-white/10 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingCampaign)}
        onOpenChange={(open) => !open && setDeletingCampaign(null)}
        title="Delete Campaign?"
        description={
          <>
            Are you sure you want to delete <strong className="text-zinc-100">{deletingCampaign?.name}</strong>?
            <br />
            Deleting this campaign will remove its campaign data and associated message records. Contacts and groups will <strong className="text-emerald-400">NOT</strong> be deleted.
          </>
        }
        confirmText="Delete Campaign"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
      />

      <GroupFormDialog
        open={isAddGroupOpen}
        onOpenChange={setIsAddGroupOpen}
        onSuccess={fetchCampaigns}
      />
    </div>
  );
};
