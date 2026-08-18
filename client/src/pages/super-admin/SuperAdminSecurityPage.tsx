import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/apiClient";
import { KeyRound, ShieldAlert, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const SuperAdminSecurityPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(1440);
  const [maxFailedLoginAttempts, setMaxFailedLoginAttempts] = useState(5);
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = useState(15);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [requireMfa, setRequireMfa] = useState(false);

  const loadSecuritySettings = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/super-admin/security");
      const json = await res.json();
      if (res.ok && json.success) {
        const s = json.data.settings;
        setSettings(s);
        setSessionTimeoutMinutes(s.sessionTimeoutMinutes || 1440);
        setMaxFailedLoginAttempts(s.maxFailedLoginAttempts || 5);
        setLockoutDurationMinutes(s.lockoutDurationMinutes || 15);
        setPasswordMinLength(s.passwordMinLength || 8);
        setRequireMfa(Boolean(s.requireMfa));
      } else {
        toast.error(json.error?.message || "Failed to load security policies.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/super-admin/security", {
        method: "PUT",
        body: JSON.stringify({
          sessionTimeoutMinutes,
          maxFailedLoginAttempts,
          lockoutDurationMinutes,
          passwordMinLength,
          requireMfa,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Security policies updated successfully.");
        loadSecuritySettings();
      } else {
        toast.error(json.error?.message || "Failed to update security policies.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update security settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-400">Loading Security Policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Global Security Policies</h1>
        <p className="text-sm text-zinc-400 mt-1">Configure session expiration times, lockout policies, and authentication thresholds.</p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Authentication & Session Rules</h2>
            <p className="text-xs text-zinc-400">Backend enforced security parameters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-300">Session Timeout (Minutes)</label>
            <input
              type="number"
              min="15"
              max="10080"
              value={sessionTimeoutMinutes}
              onChange={(e) => setSessionTimeoutMinutes(parseInt(e.target.value, 10) || 1440)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <p className="text-[11px] text-zinc-500">Default: 1440 minutes (24 hours)</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-300">Max Failed Login Attempts</label>
            <input
              type="number"
              min="3"
              max="20"
              value={maxFailedLoginAttempts}
              onChange={(e) => setMaxFailedLoginAttempts(parseInt(e.target.value, 10) || 5)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <p className="text-[11px] text-zinc-500">Threshold before temporary account lockout</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-300">Lockout Duration (Minutes)</label>
            <input
              type="number"
              min="5"
              max="1440"
              value={lockoutDurationMinutes}
              onChange={(e) => setLockoutDurationMinutes(parseInt(e.target.value, 10) || 15)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <p className="text-[11px] text-zinc-500">Duration of account lockout after max failed attempts</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-300">Minimum Password Length</label>
            <input
              type="number"
              min="8"
              max="32"
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(parseInt(e.target.value, 10) || 8)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <p className="text-[11px] text-zinc-500">Minimum characters required for passwords</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-zinc-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-sm font-semibold text-black transition-all shadow-lg shadow-amber-500/20"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Security Policies"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
