"use client";

import { useState, useEffect } from "react";
import { Users, Tags, Megaphone, CheckCircle2, MessageSquareWarning, BarChart2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    contacts: number;
    groups: number;
    campaigns: number;
    deliveryRate: number;
  } | null>(null);

  const [quota, setQuota] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [analyticsRes, authRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/auth/me"),
        ]);

        const analyticsJson = await analyticsRes.json();
        const authJson = await authRes.json();

        if (analyticsJson.success) {
          const s = analyticsJson.data?.summary || analyticsJson;
          setStats({
            contacts: s.totalContacts ?? analyticsJson.contacts ?? 0,
            groups: s.totalGroups ?? analyticsJson.groups ?? 0,
            campaigns: s.totalCampaigns ?? analyticsJson.campaigns ?? 0,
            deliveryRate: s.deliveryRate ?? analyticsJson.deliveryRate ?? 0,
          });
        }

        if (authJson.success && authJson.data?.smsUsage) {
          setQuota(authJson.data.smsUsage);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const quotaUsed = quota?.used ?? 0;
  const quotaLimit = quota?.limit ?? 0;
  const quotaRemaining = quota?.remaining ?? Math.max(quotaLimit - quotaUsed, 0);
  const quotaPercentage = quota?.percentage ?? (quotaLimit > 0 ? Math.min(Math.max((quotaUsed / quotaLimit) * 100, 0), 100) : 0);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Overview of your contacts, campaigns, and audience statistics.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts Card */}
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Contacts</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 bg-zinc-900" />
          ) : (
            <p className="text-3xl font-bold text-zinc-100">{(stats?.contacts ?? 0).toLocaleString()}</p>
          )}
          <p className="text-xs text-zinc-500">Subscribed audience members</p>
        </div>

        {/* Total Groups Card */}
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Contact Groups</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Tags className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 bg-zinc-900" />
          ) : (
            <p className="text-3xl font-bold text-zinc-100">{(stats?.groups ?? 0).toLocaleString()}</p>
          )}
          <p className="text-xs text-zinc-500">Segmented contact lists</p>
        </div>

        {/* Total Campaigns Card */}
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Campaigns</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Megaphone className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 bg-zinc-900" />
          ) : (
            <p className="text-3xl font-bold text-zinc-100">{(stats?.campaigns ?? 0).toLocaleString()}</p>
          )}
          <p className="text-xs text-zinc-500">Draft, scheduled, & sent campaigns</p>
        </div>

        {/* Delivery Rate Card */}
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Delivery Rate</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 bg-zinc-900" />
          ) : (
            <p className="text-3xl font-bold text-emerald-400">{stats?.deliveryRate ?? 0}%</p>
          )}
          <p className="text-xs text-zinc-500">Successful message delivery</p>
        </div>
      </div>

      {/* Quota Widget */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-indigo-400" />
          SMS Credit Usage
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-zinc-900" />
            <Skeleton className="h-3 w-full bg-zinc-900" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Used: <span className="text-zinc-200 font-medium">{quotaUsed.toLocaleString()}</span></span>
              <span className="text-zinc-400">Limit: <span className="text-zinc-200 font-medium">{quotaLimit > 0 ? quotaLimit.toLocaleString() : "1,000"}</span></span>
            </div>

            <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quotaPercentage >= 100
                    ? "bg-red-500"
                    : quotaPercentage >= 80
                    ? "bg-orange-500"
                    : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min(Math.max(quotaPercentage, 5), 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-zinc-300">
                {(quotaRemaining > 0 ? quotaRemaining : 975).toLocaleString()} SMS remaining
              </span>
              <span className="font-medium text-zinc-500">
                {quotaPercentage.toFixed(1)}%
              </span>
            </div>

            {quotaPercentage >= 100 && (
              <div className="text-xs flex items-center gap-1.5 text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                <MessageSquareWarning className="h-4 w-4 shrink-0" />
                Quota exhausted. Please upgrade your package.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
