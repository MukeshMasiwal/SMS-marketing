import React from "react";
import { ArrowLeft } from "lucide-react";
import { SMSComposer } from "../../components/campaigns/SMSComposer";
import { createCampaign } from "../../services/campaignService";

export const CreateCampaignPage: React.FC = () => {
  const handleSave = async (formData: { name: string; message: string }) => {
    return createCampaign(formData);
  };

  const handleContinue = (campaignId: string) => {
    window.location.href = `/campaigns/${campaignId}/edit?step=recipients`;
  };

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
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Create SMS Campaign</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Compose your SMS message, check segment counts, and save your campaign draft.
        </p>
      </div>

      <SMSComposer onSave={handleSave} onContinue={handleContinue} />
    </div>
  );
};
