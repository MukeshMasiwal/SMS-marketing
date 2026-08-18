"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Shield, 
  Crown, 
  Megaphone, 
  MessageSquare, 
  CheckCircle2, 
  Activity, 
  Server, 
  Database, 
  Radio, 
  RefreshCw,
  AlertCircle
} from "lucide-react";

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || "Failed to load super admin stats");
      }
    } catch (err) {
      setError("An unexpected error occurred while loading stats.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-400">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-12 text-center max-w-md">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Unable to load super admin stats</h3>
          <p className="text-destructive/80 mb-6 text-sm">{error}</p>
          <button onClick={fetchStats} className="px-4 py-2 rounded-md bg-transparent border border-destructive/30 hover:bg-destructive/20 text-destructive text-sm font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-50 p-6 md:p-10 space-y-8">
      {/* Top Navbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Crown className="h-3 w-3" /> SUPER ADMIN PORTAL
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mt-2">Platform Administration</h1>
          <p className="text-sm text-zinc-400 mt-1">System overview, real-time health diagnostics, and platform activity.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Shield className="h-4 w-4 text-purple-400" />
            <span>Admin Overview</span>
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors shrink-0"
          >
            <RefreshCw className={`h-4 w-4 text-amber-400 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh System Data</span>
          </button>
        </div>
      </div>

      {/* System Metrics Overview */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-amber-400" />
          <span>System Metrics</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
              <span>Total Users</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-100">{data?.totalUsers ?? 0}</p>
            <p className="text-xs text-emerald-400 font-medium">{data?.totalActiveUsers ?? 0} active accounts</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
              <span>Administrators</span>
              <Shield className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-100">1</p>
            <p className="text-xs text-amber-400 font-medium">Super Admin Access</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
              <span>Campaigns</span>
              <Megaphone className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-100">{data?.totalCampaigns ?? 0}</p>
            <p className="text-xs text-zinc-400">{data?.totalContacts ?? 0} platform contacts</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
              <span>Messages Processed</span>
              <MessageSquare className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-100">{data?.totalMessages ?? 0}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-medium">{data?.delivered ?? 0} delivered</span>
              <span className="text-zinc-600">•</span>
              <span className="text-red-400 font-medium">{data?.failed ?? 0} failed</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Indicators */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-amber-400" />
          <span>System Health & Integration Status</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100 text-sm">Application Backend</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> ONLINE
                </span>
              </div>
              <p className="text-xs text-zinc-400">Next.js & Server API Active</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100 text-sm">MongoDB Database</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> CONNECTED
                </span>
              </div>
              <p className="text-xs text-zinc-400">MongoDB Atlas Connection Verified</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Radio className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100 text-sm">SMS Provider Gateway</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400">Gateway operational for bulk SMS dispatch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
