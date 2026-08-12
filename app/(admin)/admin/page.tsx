"use client";

import { useState, useEffect } from "react";
import { Users, UserCheck, Contact, Megaphone, MessageSquare, Send, XCircle, Clock, CheckCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertCircle } from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || "Failed to load stats");
      }
    } catch (err) {
      setError("An unexpected error occurred while loading stats.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Overview</h1>
          <p className="text-zinc-400 mt-1">Platform-wide statistics and metrics.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-12 text-center h-[50vh]">
        <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Unable to load admin stats</h3>
        <p className="text-destructive/80 mb-6 max-w-md">{error}</p>
        <button onClick={fetchStats} className="px-4 py-2 rounded-md bg-transparent border border-destructive/30 hover:bg-destructive/20 text-destructive">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Overview</h1>
        <p className="text-zinc-400 mt-1">Platform-wide statistics and metrics.</p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Core Metrics */}
        <StatCard title="Total Users" value={data.totalUsers} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Active Users" value={data.totalActiveUsers} icon={<UserCheck className="h-4 w-4" />} />
        <StatCard title="Total Contacts" value={data.totalContacts} icon={<Contact className="h-4 w-4" />} />
        <StatCard title="Total Campaigns" value={data.totalCampaigns} icon={<Megaphone className="h-4 w-4" />} />
        
        {/* Message Metrics */}
        <StatCard title="Total Messages" value={data.totalMessages} icon={<MessageSquare className="h-4 w-4" />} />
        <StatCard title="Delivered Messages" value={data.delivered} icon={<CheckCircle className="h-4 w-4 text-emerald-400" />} />
        <StatCard title="Failed Messages" value={data.failed} icon={<XCircle className="h-4 w-4 text-destructive" />} />
        
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-indigo-400">System Delivery Rate</h3>
          </div>
          <div className="text-2xl font-bold text-indigo-400">{data.deliveryRate}%</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between pb-2 text-zinc-400">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className="text-2xl font-bold text-zinc-100">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}
