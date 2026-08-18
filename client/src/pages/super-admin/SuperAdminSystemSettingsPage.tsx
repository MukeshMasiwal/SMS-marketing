import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/apiClient";
import { Sliders, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const SuperAdminSystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appName, setAppName] = useState("SMS Marketing SaaS");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [globalMessageLimit, setGlobalMessageLimit] = useState(1000000);
  const [maxCampaignSize, setMaxCampaignSize] = useState(50000);
  const [defaultProvider, setDefaultProvider] = useState("EXOTEL");

  const loadSystemSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/super-admin/system");
      const json = await res.json();
      if (res.ok && json.success) {
        const s = json.data.settings;
        setSettings(s);
        setAppName(s.appName || "SMS Marketing SaaS");
        setMaintenanceMode(Boolean(s.maintenanceMode));
        setRegistrationEnabled(Boolean(s.registrationEnabled ?? true));
        setGlobalMessageLimit(s.globalMessageLimit || 1000000);
        setMaxCampaignSize(s.maxCampaignSize || 50000);
        setDefaultProvider(s.defaultProvider || "EXOTEL");
      } else {
        toast.error(json.error?.message || "Failed to load system settings.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/super-admin/system", {
        method: "PUT",
        body: JSON.stringify({
          appName,
          maintenanceMode,
          registrationEnabled,
          globalMessageLimit,
          maxCampaignSize,
          defaultProvider,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("System configuration updated successfully.");
        loadSystemSettings();
      } else {
        toast.error(json.error?.message || "Failed to update system settings.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update system settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-400">Loading System Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Platform System Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Configure platform parameters, maintenance mode, registration policy, and campaign volume limits.</p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Global Application Controls</h2>
            <p className="text-xs text-zinc-400">System-wide platform parameters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-300">Application Name</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-300">Default SMS Gateway Provider</label>
            <select
              value={defaultProvider}
              onChange={(e) => setDefaultProvider(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none"
            >
              <option value="EXOTEL">Exotel Telecommunications</option>
              <option value="MOCK">Mock Gateway (Test Mode)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-300">Global Message Volume Limit</label>
            <input
              type="number"
              value={globalMessageLimit}
              onChange={(e) => setGlobalMessageLimit(parseInt(e.target.value, 10) || 1000000)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-300">Max Single Campaign Size</label>
            <input
              type="number"
              value={maxCampaignSize}
              onChange={(e) => setMaxCampaignSize(parseInt(e.target.value, 10) || 50000)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
              <p className="font-semibold text-zinc-200 text-sm">Public User Registration</p>
              <p className="text-xs text-zinc-400">Allow new users to sign up for accounts</p>
            </div>
            <input
              type="checkbox"
              checked={registrationEnabled}
              onChange={(e) => setRegistrationEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
              <p className="font-semibold text-zinc-200 text-sm">Platform Maintenance Mode</p>
              <p className="text-xs text-zinc-400">Restrict normal user access during scheduled system maintenance</p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-5 w-5 rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-zinc-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-sm font-semibold text-black transition-all shadow-lg shadow-amber-500/20"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save System Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
