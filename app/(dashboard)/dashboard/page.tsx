"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, MessageSquareWarning } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [quota, setQuota] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success && json.data.smsUsage) {
          setQuota(json.data.smsUsage);
        }
      } catch (err) {
        console.error("Failed to load quota", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuota();
  }, []);

  const quotaUsed = quota?.used ?? 0;
  const quotaLimit = quota?.limit ?? 0;
  const quotaRemaining = quota?.remaining ?? Math.max(quotaLimit - quotaUsed, 0);
  const quotaPercentage = quota?.percentage ?? (quotaLimit > 0 ? Math.min(Math.max((quotaUsed / quotaLimit) * 100, 0), 100) : 0);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Welcome back! Here is an overview of your activity.</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quota Widget */}
        <div className="rounded-xl border border-white/10 bg-black p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              SMS Usage
            </h2>
            
            {isLoading ? (
              <div className="mt-6 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : quota ? (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Used: <span className="text-zinc-200 font-medium">{quotaUsed.toLocaleString()}</span></span>
                  <span className="text-zinc-400">Limit: <span className="text-zinc-200 font-medium">{quotaLimit.toLocaleString()}</span></span>
                </div>
                
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      quotaPercentage >= 100 
                        ? 'bg-red-500' 
                        : quotaPercentage >= 80 
                          ? 'bg-orange-500' 
                          : 'bg-indigo-500'
                    }`} 
                    style={{ width: `${Math.min(Math.max(quotaPercentage, 0), 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-zinc-300">
                    {quotaRemaining.toLocaleString()} remaining
                  </span>
                  <span className="font-medium text-zinc-500">
                    {quotaPercentage.toFixed(1)}%
                  </span>
                </div>
                
                {quotaPercentage >= 100 && (
                  <div className="mt-2 text-xs flex items-center gap-1 text-red-400 bg-red-500/10 p-2 rounded">
                    <MessageSquareWarning className="h-4 w-4" />
                    Quota exhausted. Please upgrade your package.
                  </div>
                )}
                {quotaPercentage >= 80 && quotaPercentage < 100 && (
                  <div className="mt-2 text-xs flex items-center gap-1 text-orange-400 bg-orange-500/10 p-2 rounded">
                    <MessageSquareWarning className="h-4 w-4" />
                    Approaching SMS limit.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 text-sm text-zinc-500">
                No active package assigned to this account.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 mt-6">
        <EmptyState 
          title="No data to display yet"
          description="Your dashboard statistics will appear here once you start sending campaigns."
          icon={<LayoutDashboard className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}
