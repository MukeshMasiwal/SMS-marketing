import React, { useState, useEffect, useCallback } from "react";
import { fetchWithAuth, formatApiErrorMessage } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { UserCheck, UserX, AlertCircle, Search, RefreshCw, Shield, User as UserIcon, Crown, Lock } from "lucide-react";
import { toast } from "sonner";

export interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  smsUsed?: number;
}

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchWithAuth("/api/admin/users");
      const json = await res.json();

      if (res.ok && json.success) {
        setUsers(json.data?.users || []);
      } else {
        const errorMsg = json.error?.message || formatApiErrorMessage(res, "Failed to load users list.");
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "Unable to connect to the backend server. Please check that the API server is running.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (userItem: AdminUserItem) => {
    const isSuperAdminTarget = (userItem.role || "").toUpperCase() === "SUPER_ADMIN";
    if (isSuperAdminTarget) {
      toast.error("Admins cannot modify Super Admin accounts.");
      return;
    }

    const isSelf = currentUser && (currentUser.id === userItem._id || currentUser.email === userItem.email);

    if (isSelf && userItem.isActive) {
      toast.error("You cannot disable your own active admin account.");
      return;
    }

    const actionText = userItem.isActive ? "disable" : "enable";
    const confirmMsg = `Are you sure you want to ${actionText} user "${userItem.email}"?`;
    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(userItem._id);

    try {
      const res = await fetchWithAuth(`/api/admin/users/${userItem._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !userItem.isActive }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userItem._id ? { ...u, isActive: !userItem.isActive } : u))
        );
        toast.success(`User ${userItem.email} has been ${userItem.isActive ? "disabled" : "enabled"}.`);
      } else {
        toast.error(json.error?.message || formatApiErrorMessage(res, `Failed to ${actionText} user.`));
      }
    } catch (err: any) {
      toast.error(err.message || `Unable to ${actionText} user due to connection error.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-400" />
            <span>User Management</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage system access, monitor user accounts, and review demo users.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={fetchUsers}
            disabled={isLoading}
            title="Refresh Users List"
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-red-400 shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-red-400">Failed to Load Users</h3>
            <p className="text-xs text-red-300/80 mt-1 max-w-md">{error}</p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
          <p className="text-xs text-zinc-400 font-medium">Loading user accounts...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = currentUser && (currentUser.id === u._id || currentUser.email === u.email);
                    const isUpdating = updatingId === u._id;
                    const isDemo = u.email === "admin@example.com" || u.email === "user@example.com" || u.email === "superadmin@example.com";
                    const isSuperAdminTarget = (u.role || "").toUpperCase() === "SUPER_ADMIN";

                    return (
                      <tr key={u._id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-zinc-100 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                            {isSuperAdminTarget ? (
                              <Crown className="h-3.5 w-3.5 text-amber-400" />
                            ) : u.role.toLowerCase() === "admin" ? (
                              <Shield className="h-3.5 w-3.5 text-purple-400" />
                            ) : (
                              <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span>{u.name}</span>
                            {isDemo && (
                              <span className="text-[10px] text-indigo-400 font-mono">Demo Account</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-300">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-semibold ${
                              isSuperAdminTarget
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : u.role.toLowerCase() === "admin"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.isActive
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {u.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {u.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-semibold ${
                              u.emailVerified ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {u.emailVerified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSuperAdminTarget ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20">
                              <Lock className="h-3.5 w-3.5 text-amber-400" />
                              <span>Protected</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleUserStatus(u)}
                              disabled={Boolean(isSelf && u.isActive) || isUpdating}
                              title={isSelf && u.isActive ? "Cannot disable your own active account" : ""}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                                isSelf && u.isActive
                                  ? "opacity-40 cursor-not-allowed border-zinc-800 text-zinc-500 bg-transparent"
                                  : u.isActive
                                  ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              }`}
                            >
                              {isUpdating ? "Updating..." : u.isActive ? "Disable" : "Enable"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
