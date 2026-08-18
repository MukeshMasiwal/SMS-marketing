import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/apiClient";
import { Crown, Shield, Users, Check, X, Lock } from "lucide-react";
import { toast } from "sonner";

export const SuperAdminRolesPage: React.FC = () => {
  const [rolesData, setRolesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await fetchWithAuth("/api/super-admin/roles");
        const json = await res.json();
        if (res.ok && json.success) {
          setRolesData(json.data.roles);
        } else {
          toast.error(json.error?.message || "Failed to load role hierarchy.");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to connect to backend server.");
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-400">Loading Role Matrix...</p>
        </div>
      </div>
    );
  }

  const allPermissionKeys = [
    { key: "VIEW_USERS", label: "View Users", category: "Operational" },
    { key: "MANAGE_USERS", label: "Manage Users", category: "Operational" },
    { key: "SUSPEND_USERS", label: "Suspend/Activate Users", category: "Operational" },
    { key: "VIEW_CONTACTS", label: "View Contacts", category: "Operational" },
    { key: "VIEW_CAMPAIGNS", label: "View Campaigns", category: "Operational" },
    { key: "VIEW_MESSAGES", label: "View Messages", category: "Operational" },
    { key: "VIEW_ANALYTICS", label: "View Analytics", category: "Operational" },
    { key: "CREATE_ADMIN", label: "Create Administrative Accounts", category: "Sensitive Platform" },
    { key: "DELETE_ADMIN", label: "Delete Administrative Accounts", category: "Sensitive Platform" },
    { key: "CHANGE_USER_ROLE", label: "Change User Roles", category: "Sensitive Platform" },
    { key: "MANAGE_ROLES", label: "Manage Roles & Permissions", category: "Sensitive Platform" },
    { key: "MANAGE_PROVIDER_SETTINGS", label: "Manage Provider Configuration", category: "Sensitive Platform" },
    { key: "MANAGE_SECURITY_SETTINGS", label: "Manage Security Policies", category: "Sensitive Platform" },
    { key: "MANAGE_SYSTEM_SETTINGS", label: "Manage Platform System Settings", category: "Sensitive Platform" },
    { key: "VIEW_AUDIT_LOGS", label: "View Full System Audit Logs", category: "Sensitive Platform" },
    { key: "VIEW_SYSTEM_HEALTH", label: "View System Health & Diagnostics", category: "Sensitive Platform" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Role Hierarchy & Permission Matrix</h1>
        <p className="text-sm text-zinc-400 mt-1">Read-only role definitions, platform hierarchy levels, and centralized permission mappings.</p>
      </div>

      {/* Role Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rolesData.map((item) => (
          <div
            key={item.role}
            className={`rounded-2xl border p-6 space-y-4 relative overflow-hidden bg-zinc-900/60 ${
              item.role === "SUPER_ADMIN"
                ? "border-amber-500/30"
                : item.role === "ADMIN"
                ? "border-purple-500/30"
                : "border-indigo-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.role === "SUPER_ADMIN" ? (
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Crown className="h-5 w-5" />
                  </div>
                ) : item.role === "ADMIN" ? (
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Shield className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Users className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-zinc-100 text-lg">{item.title}</h3>
                  <span className="text-[11px] font-mono font-semibold uppercase text-zinc-500">Level {item.level}</span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-950 text-zinc-300 border border-zinc-800">
                {item.userCount} users
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>

            <div className="pt-3 border-t border-zinc-800/60 text-xs text-zinc-500 font-mono flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>{item.permissions.length} total permissions enabled</span>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-200">Centralized Permission Inspection Matrix</h2>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Permission Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">User (L1)</th>
                  <th className="px-6 py-4 text-center">Admin (L2)</th>
                  <th className="px-6 py-4 text-center">Super Admin (L3)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {allPermissionKeys.map((p) => {
                  const superAdminHas = true;
                  const adminRoleObj = rolesData.find((r) => r.role === "ADMIN");
                  const userRoleObj = rolesData.find((r) => r.role === "USER");

                  const adminHas = adminRoleObj?.permissions?.includes(p.key) ?? false;
                  const userHas = userRoleObj?.permissions?.includes(p.key) ?? false;

                  return (
                    <tr key={p.key} className="hover:bg-zinc-900/80 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-zinc-200">
                        {p.label}
                        <span className="block text-[11px] font-mono text-zinc-500">{p.key}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                          p.category === "Sensitive Platform"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        }`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {userHas ? (
                          <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-zinc-600 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {adminHas ? (
                          <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-zinc-600 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {superAdminHas ? (
                          <Check className="h-4 w-4 text-amber-400 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-zinc-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
