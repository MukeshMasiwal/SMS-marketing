"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const res = await fetch("/api/admin/campaigns");
      const json = await res.json();
      
      if (json.success) {
        setCampaigns(json.data.campaigns);
      } else {
        setError(json.error?.message || "Failed to load campaigns");
      }
    } catch (err) {
      setError("An unexpected error occurred while loading campaigns.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.userId?.email?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Campaigns</h1>
          <p className="text-zinc-400 mt-1">Read-only view of all campaigns running on the platform.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search campaign or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-white/10 bg-zinc-950/50 pl-10 pr-4 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 h-96 animate-pulse" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error loading campaigns</h3>
          <p className="text-destructive/80 mb-6">{error}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Campaign</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Owner</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Recipients</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      No campaigns found.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((camp) => (
                    <tr key={camp._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-100">
                        <Link href={`/admin/campaigns/${camp._id}`} className="hover:text-indigo-400 hover:underline">
                          {camp.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-300">{camp.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{camp.userId?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-medium">
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{camp.recipientCount}</td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        {format(parseISO(camp.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
