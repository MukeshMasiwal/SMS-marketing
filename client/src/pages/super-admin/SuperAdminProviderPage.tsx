import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/apiClient";
import { Radio, ShieldCheck, AlertCircle, Save, CheckCircle2, Key, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const SuperAdminProviderPage: React.FC = () => {
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [senderId, setSenderId] = useState("SMSSaaS");
  const [status, setStatus] = useState("ACTIVE");
  const [kycStatus, setKycStatus] = useState("RESTRICTED");

  const loadProvider = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/super-admin/provider");
      const json = await res.json();
      if (res.ok && json.success) {
        const p = json.data.provider;
        setProvider(p);
        setSenderId(p.senderId || "SMSSaaS");
        setStatus(p.status || "ACTIVE");
        setKycStatus(p.kycStatus || "RESTRICTED");
      } else {
        toast.error(json.error?.message || "Failed to load provider configuration.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvider();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/super-admin/provider", {
        method: "PUT",
        body: JSON.stringify({
          senderId,
          status,
          kycStatus,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Provider configuration updated successfully.");
        loadProvider();
      } else {
        toast.error(json.error?.message || "Failed to update provider configuration.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update provider settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-400">Loading Provider Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">SMS Gateway & Exotel Configuration</h1>
        <p className="text-sm text-zinc-400 mt-1">Provider connectivity diagnostics, status flags, and server-side secret configuration status.</p>
      </div>

      {/* Security Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-zinc-100">Server-Side Secret Retention Enforced</p>
          <p className="text-amber-300/80 leading-relaxed">
            API keys and tokens (<code className="bg-zinc-950 px-1 py-0.5 rounded font-mono">EXOTEL_API_KEY</code>, <code className="bg-zinc-950 px-1 py-0.5 rounded font-mono">EXOTEL_API_TOKEN</code>) remain strictly stored in server-side environment variables and are never transmitted to the browser.
          </p>
        </div>
      </div>

      {/* Provider Status Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Exotel Gateway Connection</h2>
              <p className="text-xs text-zinc-400">Primary telecommunication provider</p>
            </div>
          </div>

          <button
            onClick={loadProvider}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Check Status</span>
          </button>
        </div>

        {/* Credentials Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-zinc-500">API Key</span>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-zinc-200">
                {provider?.apiKeyConfigured ? "Configured ✓" : "Not Configured"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-zinc-500">API Token</span>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-zinc-200">
                {provider?.apiTokenConfigured ? "Configured ✓" : "Not Configured"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-zinc-500">Account SID</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-zinc-300">
                {provider?.accountSidMasked || "••••••••9F3A"}
              </span>
            </div>
          </div>
        </div>

        {/* Update Metadata Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-zinc-300">Default Sender ID</label>
              <input
                type="text"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-zinc-300">Gateway Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-zinc-300">Account / KYC Status</label>
              <select
                value={kycStatus}
                onChange={(e) => setKycStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none"
              >
                <option value="VERIFIED">VERIFIED</option>
                <option value="RESTRICTED">RESTRICTED (KYC Pending)</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-sm font-semibold text-black transition-all shadow-lg shadow-amber-500/20"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Provider Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
