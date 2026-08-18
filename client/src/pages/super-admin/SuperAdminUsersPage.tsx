import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/apiClient";
import { 
  Users, 
  Shield, 
  Crown, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  UserCheck, 
  UserX, 
  ArrowUpDown, 
  AlertTriangle,
  X 
} from "lucide-react";
import { toast } from "sonner";

export const SuperAdminUsersPage: React.FC<{ initialRoleFilter?: string }> = ({ initialRoleFilter }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter || "ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "ADMIN", company: "" });
  const [creating, setCreating] = useState(false);

  // Role Change Modal State
  const [roleModalUser, setRoleModalUser] = useState<any>(null);
  const [newRoleSelect, setNewRoleSelect] = useState("ADMIN");
  const [demoteConfirmPhrase, setDemoteConfirmPhrase] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  // Delete Modal State
  const [deleteModalUser, setDeleteModalUser] = useState<any>(null);
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (roleFilter !== "ALL") queryParams.append("role", roleFilter);
      if (statusFilter !== "ALL") queryParams.append("status", statusFilter);
      if (search) queryParams.append("search", search);

      const res = await fetchWithAuth(`/api/super-admin/users?${queryParams.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers(json.data.users);
      } else {
        toast.error(json.error?.message || "Failed to load users list.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  // Create Account Handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetchWithAuth("/api/super-admin/users", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Account created successfully.");
        setShowCreateModal(false);
        setCreateForm({ name: "", email: "", password: "", role: "ADMIN", company: "" });
        loadUsers();
      } else {
        toast.error(json.error?.message || "Failed to create user.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  // Toggle Account Status Handler
  const handleToggleStatus = async (user: any) => {
    const targetStatus = !user.isActive;
    try {
      const res = await fetchWithAuth(`/api/super-admin/users/${user._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: targetStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`User ${user.email} is now ${targetStatus ? "Active" : "Suspended"}.`);
        loadUsers();
      } else {
        toast.error(json.error?.message || "Failed to update account status.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update account status.");
    }
  };

  // Role Change Handler
  const handleRoleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setUpdatingRole(true);

    try {
      const res = await fetchWithAuth(`/api/super-admin/users/${roleModalUser._id}/role`, {
        method: "PATCH",
        body: JSON.stringify({
          newRole: newRoleSelect,
          confirmPhrase: demoteConfirmPhrase,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Role updated successfully.");
        setRoleModalUser(null);
        setDemoteConfirmPhrase("");
        loadUsers();
      } else {
        toast.error(json.error?.message || "Failed to change role.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to change role.");
    } finally {
      setUpdatingRole(false);
    }
  };

  // Delete User Handler
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModalUser) return;
    setDeleting(true);

    try {
      const res = await fetchWithAuth(`/api/super-admin/users/${deleteModalUser._id}`, {
        method: "DELETE",
        body: JSON.stringify({
          confirmPhrase: deleteConfirmPhrase,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Account deleted successfully.");
        setDeleteModalUser(null);
        setDeleteConfirmPhrase("");
        loadUsers();
      } else {
        toast.error(json.error?.message || "Failed to delete account.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">User & Admin Management</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage platform accounts, administrative roles, and access controls.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-600/20 shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create New User / Admin</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative w-full max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button type="submit" className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-400 uppercase">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admins</option>
              <option value="ADMIN">Admins</option>
              <option value="USER">Users</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm">Loading users list...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">No accounts found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((user) => {
                  const roleUpper = (user.role || "").toUpperCase();

                  return (
                    <tr key={user._id} className="hover:bg-zinc-900/80 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-zinc-100">{user.name}</p>
                          <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
                          {user.company && <p className="text-[11px] text-zinc-500">{user.company}</p>}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {roleUpper === "SUPER_ADMIN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Crown className="h-3 w-3" /> SUPER ADMIN
                          </span>
                        ) : roleUpper === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Shield className="h-3 w-3" /> ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <Users className="h-3 w-3" /> USER
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <UserCheck className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            <UserX className="h-3 w-3" /> Suspended
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        {/* Change Role Button */}
                        <button
                          onClick={() => {
                            setRoleModalUser(user);
                            setNewRoleSelect(roleUpper);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                          title="Change Role"
                        >
                          <ArrowUpDown className="h-3.5 w-3.5 inline mr-1" />
                          Role
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            user.isActive
                              ? "border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          }`}
                        >
                          {user.isActive ? "Suspend" : "Activate"}
                        </button>

                        {/* Delete User Button */}
                        <button
                          onClick={() => {
                            setDeleteModalUser(user);
                            setDeleteConfirmPhrase("");
                          }}
                          className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Create User / Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-zinc-100">Create New User / Administrative Account</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-zinc-300">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-zinc-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin.rahul@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-zinc-300">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-zinc-300">Account Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none"
                >
                  <option value="ADMIN">ADMIN (Operational Administrator)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Administrator)</option>
                  <option value="USER">USER (Standard Workspace)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/20"
                >
                  {creating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Role Change Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-zinc-100">Change User Role</h2>
              <button onClick={() => setRoleModalUser(null)} className="text-zinc-400 hover:text-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Target account: <span className="text-zinc-100 font-semibold">{roleModalUser.email}</span> (Current Role: <span className="text-amber-400 font-mono">{roleModalUser.role}</span>)
            </p>

            <form onSubmit={handleRoleChangeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-zinc-300">Select New Role</label>
                <select
                  value={newRoleSelect}
                  onChange={(e) => setNewRoleSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none"
                >
                  <option value="USER">USER (Standard Workspace)</option>
                  <option value="ADMIN">ADMIN (Operational Administration)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Control)</option>
                </select>
              </div>

              {roleModalUser.role === "SUPER_ADMIN" && newRoleSelect !== "SUPER_ADMIN" && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Demoting a Super Admin</span>
                  </div>
                  <p>Type <code className="bg-zinc-950 px-1 py-0.5 rounded text-amber-200 font-mono">DEMOTE SUPER ADMIN</code> below to confirm this action.</p>
                  <input
                    type="text"
                    required
                    placeholder="DEMOTE SUPER ADMIN"
                    value={demoteConfirmPhrase}
                    onChange={(e) => setDemoteConfirmPhrase(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-amber-500/30 text-xs text-zinc-100 font-mono focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingRole}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all"
                >
                  {updatingRole ? "Updating..." : "Update Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Phrase Confirmation Delete Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Delete Account
              </h2>
              <button onClick={() => setDeleteModalUser(null)} className="text-zinc-400 hover:text-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              You are about to delete account <span className="text-zinc-100 font-semibold">{deleteModalUser.email}</span> (<span className="font-mono text-amber-400">{deleteModalUser.role}</span>). This action cannot be undone.
            </p>

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-zinc-400">
                  Type phrase to confirm: <code className="text-red-400 bg-zinc-950 px-1 py-0.5 rounded font-mono">
                    {deleteModalUser.role === "ADMIN" ? "DELETE ADMIN" : deleteModalUser.role === "SUPER_ADMIN" ? "DELETE SUPER ADMIN" : "DELETE USER"}
                  </code>
                </label>
                <input
                  type="text"
                  required
                  placeholder={deleteModalUser.role === "ADMIN" ? "DELETE ADMIN" : deleteModalUser.role === "SUPER_ADMIN" ? "DELETE SUPER ADMIN" : "DELETE USER"}
                  value={deleteConfirmPhrase}
                  onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-red-500/30 font-mono text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-all shadow-lg shadow-red-600/20"
                >
                  {deleting ? "Deleting..." : "Permanently Delete Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
