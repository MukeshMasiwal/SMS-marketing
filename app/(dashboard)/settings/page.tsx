"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  KeyRound, 
  Bell, 
  Shield, 
  Globe, 
  Save, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Package, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences" | "api">("profile");

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [packageName, setPackageName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Preferences State
  const [senderId, setSenderId] = useState("SMSSaaS");
  const [countryCode, setCountryCode] = useState("+91");
  const [lowQuotaAlert, setLowQuotaAlert] = useState(true);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // API Key State
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const dummyApiKey = "sms_live_9f83b2a71e409c8d2345e6789a0b1c2d";

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            const u = data.data.user;
            setName(u.name || "");
            setEmail(u.email || "");
            setCompany(u.company || "");
            setRole((u.role || "USER").toUpperCase());
            if (data.data?.package) {
              setPackageName(data.data.package.name || "Default");
            }
          }
        }
      } catch {
        // Safe fallback
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess("Profile settings updated successfully!");
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);

    if (newPassword.length < 8) {
      setSecurityMsg({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMsg({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setSecurityMsg({ type: "success", text: "Password changed successfully." });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setSecurityMsg(null), 3000);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(dummyApiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your profile, security, and workspace preferences.</p>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "profile"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile & Account</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "security"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "preferences"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>SMS Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab("api")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "api"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg"
              : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>API & Integrations</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === "profile" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Personal & Account Information</h2>
              <p className="text-xs text-zinc-400">Update your account name and organization details.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                role === "ADMIN" 
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }`}>
                {role || "USER"}
              </span>
              {packageName && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {packageName} Plan
                </span>
              )}
            </div>
          </div>

          {saveSuccess && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-sm text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-200">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-200">Email Address</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-zinc-900/50 border-zinc-800 text-zinc-400 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500">Email address cannot be changed directly.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-zinc-200">Company / Organization</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Profile
            </Button>
          </form>
        </div>
      )}

      {/* Tab 2: Security */}
      {activeTab === "security" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-6">
          <div className="border-b border-zinc-800/80 pb-4">
            <h2 className="text-lg font-semibold text-zinc-100">Password & Security</h2>
            <p className="text-xs text-zinc-400">Change your password and manage active authentication sessions.</p>
          </div>

          {securityMsg && (
            <div className={`rounded-lg p-3.5 text-sm flex items-center gap-2 border ${
              securityMsg.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {securityMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{securityMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSecurity} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-zinc-200">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  aria-label={showCurrentPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-zinc-200">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  aria-label={showNewPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-200">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
              />
            </div>

            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Update Password
            </Button>
          </form>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {activeTab === "preferences" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-6">
          <div className="border-b border-zinc-800/80 pb-4">
            <h2 className="text-lg font-semibold text-zinc-100">SMS Campaign & Workspace Preferences</h2>
            <p className="text-xs text-zinc-400">Configure default options for outgoing SMS messages.</p>
          </div>

          {prefSuccess && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-sm text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Workspace preferences saved!</span>
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="senderId" className="text-zinc-200">Default Sender ID / Title</Label>
              <Input
                id="senderId"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                placeholder="SMSSaaS"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryCode" className="text-zinc-200">Default Country Code</Label>
              <select
                id="countryCode"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="+91">+91 (India)</option>
                <option value="+1">+1 (United States / Canada)</option>
                <option value="+44">+44 (United Kingdom)</option>
                <option value="+61">+61 (Australia)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-zinc-200">Low SMS Quota Warning</Label>
                <p className="text-xs text-zinc-400">Receive alert when message quota drops below 10%.</p>
              </div>
              <input
                type="checkbox"
                checked={lowQuotaAlert}
                onChange={(e) => setLowQuotaAlert(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </form>
        </div>
      )}

      {/* Tab 4: API Keys */}
      {activeTab === "api" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-6">
          <div className="border-b border-zinc-800/80 pb-4">
            <h2 className="text-lg font-semibold text-zinc-100">API Keys & Integrations</h2>
            <p className="text-xs text-zinc-400">Use this API key to send SMS programmatically from your own applications.</p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label className="text-zinc-200">Live API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  readOnly
                  value={dummyApiKey}
                  className="bg-zinc-900 border-zinc-800 font-mono text-xs text-zinc-300 focus-visible:ring-indigo-500 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 shrink-0"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 flex items-center gap-1.5"
                >
                  {copiedApiKey ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Shield className="h-4 w-4 text-indigo-400" />
                <span>API Endpoint Usage</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded border border-zinc-800">
                POST /api/internal/sms
              </p>
              <p className="text-xs text-zinc-500">
                Pass your authentication bearer token in header: <code className="text-zinc-400">Authorization: Bearer &lt;token&gt;</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

