import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/apiClient";
import { 
  Users, 
  Shield, 
  Crown, 
  Megaphone, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Server, 
  Database, 
  Radio, 
  RefreshCw 
} from "lucide-react";
import { toast } from "sonner";

export const SuperAdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const res = await fetchWithAuth("/api/super-admin/stats");
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        toast.error(json.error?.message || "Failed to load Super Admin dashboard.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-400">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const health = data?.health || {};
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-8">
      {/* Header */}
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

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
        >
          <RefreshCw className={`h-4 w-4 text-amber-400 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh System Data</span>
        </button>
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
            <p className="text-2xl font-bold text-zinc-100">{metrics.totalUsers ?? 0}</p>
            <p className="text-xs text-emerald-400 font-medium">{metrics.totalActiveUsers ?? 0} active accounts</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
              <span>Administrators</span>
              <Shield className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-100">{metrics.totalAdmins ?? 0}</p>
            <p className="text-xs text-amber-400 font-medium">{metrics.totalSuperAdmins ?? 0} Super Admins</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
              <span>Campaigns</span>
              <Megaphone className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-100">{metrics.totalCampaigns ?? 0}</p>
            <p className="text-xs text-zinc-400">{metrics.totalContacts ?? 0} platform contacts</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
              <span>Messages Processed</span>
              <MessageSquare className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-100">{metrics.totalMessages ?? 0}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-medium">{metrics.messagesSent ?? 0} sent</span>
              <span className="text-zinc-600">•</span>
              <span className="text-red-400 font-medium">{metrics.messagesFailed ?? 0} failed</span>
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
          {/* Express Backend */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100 text-sm">Express Backend</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> ONLINE
                </span>
              </div>
              <p className="text-xs text-zinc-400">{health.backend?.message || "Running on Node.js / Express"}</p>
            </div>
          </div>

          {/* Database */}
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
              <p className="text-xs text-zinc-400">{health.database?.message || "MongoDB Atlas active"}</p>
            </div>
          </div>

          {/* Exotel / SMS Provider */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Radio className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100 text-sm">Exotel Gateway</h3>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                  health.smsProvider?.kycStatus === "RESTRICTED"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                  {health.smsProvider?.kycStatus === "RESTRICTED" ? (
                    <>
                      <AlertTriangle className="h-3 w-3" /> RESTRICTED
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> ACTIVE
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {health.smsProvider?.kycStatus === "RESTRICTED"
                  ? "KYC pending verification. Dummy fallback mode enabled."
                  : "Gateway ready for bulk transmission."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Stream */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-amber-400" />
          <span>Recent Administrative Activity</span>
        </h2>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No recent audit log entries recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {recentActivity.map((log: any) => (
                <div key={log._id} className="p-4 flex items-center justify-between hover:bg-zinc-900/80 transition-colors text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-mono">
                      {log.actorRole?.[0] || "A"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">{log.action}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {log.actorEmail}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Target: {log.targetType || "System"} ({log.targetId || "N/A"})
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
