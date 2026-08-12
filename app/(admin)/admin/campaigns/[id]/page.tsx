"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Megaphone, CheckCircle, XCircle, Clock, Send, AlertCircle, Percent } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function AdminCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const campaignId = params.id as string;

  useEffect(() => {
    const fetchCampaignDetail = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/admin/campaigns/${campaignId}`);
        const json = await res.json();
        
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error?.message || "Failed to load campaign details");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (campaignId) fetchCampaignDetail();
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
        <div className="h-48 rounded-xl bg-zinc-950/50 border border-white/10 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-950/50 border border-white/10 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Unable to load campaign</h3>
        <p className="text-destructive/80 mb-6 max-w-md">{error || "Campaign not found"}</p>
        <button onClick={() => router.push("/admin/campaigns")} className="px-4 py-2 rounded-md bg-transparent border border-destructive/30 hover:bg-destructive/20 text-destructive">
          Back to Campaigns
        </button>
      </div>
    );
  }

  const { campaign, stats } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/campaigns" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{campaign.name}</h1>
          <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-white/10">
            {campaign.status}
          </span>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaign Info */}
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-zinc-100 mb-6 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-400" />
              Campaign Info
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-zinc-500 mb-1">Message Content</div>
                <div className="p-4 bg-zinc-900 rounded-lg text-sm text-zinc-300 border border-white/5">
                  {campaign.message}
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-zinc-400">Target Type</span>
                <span className="text-sm font-medium text-zinc-200">{campaign.targetType}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-zinc-400">Created At</span>
                <span className="text-sm font-medium text-zinc-200">{format(parseISO(campaign.createdAt), "PPp")}</span>
              </div>
              {campaign.scheduledAt && (
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-400">Scheduled For</span>
                  <span className="text-sm font-medium text-zinc-200">{format(parseISO(campaign.scheduledAt), "PPp")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-zinc-100 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-400" />
              Owner Info
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-zinc-400">Name</span>
                <Link href={`/admin/users/${campaign.userId._id}`} className="text-sm font-medium text-indigo-400 hover:underline">
                  {campaign.userId.name}
                </Link>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-zinc-400">Email</span>
                <span className="text-sm font-medium text-zinc-200">{campaign.userId.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-zinc-400">User ID</span>
                <span className="text-xs font-mono text-zinc-500">{campaign.userId._id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Stats */}
      <h2 className="text-lg font-medium text-zinc-100 mt-4">Delivery Statistics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-6">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Percent className="h-4 w-4" />
            <span className="text-sm font-medium">Delivery Rate</span>
          </div>
          <div className="text-3xl font-bold text-indigo-400">{stats.deliveryRate}%</div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <span className="text-sm font-medium">Total</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">{stats.totalMessages}</div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Delivered</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">{stats.delivered}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Failed</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">{stats.failed}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Queued</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">{stats.queued}</div>
        </div>
      </div>
    </div>
  );
}
