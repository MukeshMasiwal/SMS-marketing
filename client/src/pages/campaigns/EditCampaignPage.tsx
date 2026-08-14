import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SMSComposer } from "../../components/campaigns/SMSComposer";
import { getCampaignById, updateCampaign } from "../../services/campaignService";
import { Campaign } from "../../types";

export const EditCampaignPage: React.FC = () => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Extract ID from pathname: /campaigns/:id/edit
  const pathParts = window.location.pathname.split("/");
  const campaignId = pathParts[2]; // /campaigns/<id>/edit

  useEffect(() => {
    async function loadCampaign() {
      if (!campaignId) {
        setError("Invalid campaign URL");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await getCampaignById(campaignId);
        setCampaign(data);
      } catch (err: any) {
        setError(err.message || "Failed to load campaign");
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaign();
  }, [campaignId]);

  const handleSave = async (formData: { name: string; message: string }) => {
    if (!campaignId) throw new Error("Missing campaign ID");
    return updateCampaign(campaignId, formData);
  };

  const handleContinue = (id: string) => {
    window.location.href = `/campaigns/${id}/edit?step=recipients`;
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm">Loading campaign draft...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12">
        <button
          onClick={() => (window.location.href = "/campaigns")}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campaigns</span>
        </button>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400 space-y-3">
          <h3 className="text-lg font-semibold">Error Loading Campaign</h3>
          <p className="text-sm">{error || "Campaign not found"}</p>
          <button
            onClick={() => (window.location.href = "/campaigns")}
            className="px-4 py-2 rounded bg-zinc-900 border border-white/10 text-white text-xs font-medium hover:bg-zinc-800"
          >
            Return to Campaigns List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <button
          onClick={() => (window.location.href = "/campaigns")}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campaigns</span>
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Edit Campaign Draft</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            Draft
          </span>
        </div>
        <p className="text-zinc-400 text-sm mt-1">
          Modify campaign details, update SMS message content, and save draft updates.
        </p>
      </div>

      <SMSComposer
        initialData={campaign}
        onSave={handleSave}
        onContinue={handleContinue}
        isEditMode={true}
      />
    </div>
  );
};
