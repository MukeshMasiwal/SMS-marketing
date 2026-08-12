"use client";

import { useState, useEffect } from "react";
import { UserX, UserCheck, ShieldAlert, AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // Get current user email for self-disable prevention in UI
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUserEmail(meJson.user?.email || "");
      }
      
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      
      if (json.success) {
        setUsers(json.data.users);
      } else {
        setError(json.error?.message || "Failed to load users");
      }
    } catch (err) {
      setError("An unexpected error occurred while loading users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (id: string, currentStatus: boolean, email: string) => {
    if (email === currentUserEmail && currentStatus) {
      alert("You cannot disable your own admin account.");
      return;
    }
    
    const confirmMsg = currentStatus 
      ? `Are you sure you want to DISABLE ${email}? They will be logged out and unable to access their account.`
      : `Are you sure you want to ENABLE ${email}?`;
      
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      const json = await res.json();
      if (json.success) {
        // Update local state
        setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
      } else {
        alert(json.error?.message || "Failed to update user status");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">User Management</h1>
          <p className="text-zinc-400 mt-1">Manage system access and monitor user accounts.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-white/10 bg-zinc-950/50 pl-10 pr-4 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 h-96 animate-pulse" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error loading users</h3>
          <p className="text-destructive/80 mb-6">{error}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Email</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Role</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Joined</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3 font-medium text-zinc-100">
                        <Link href={`/admin/users/${user._id}`} className="hover:text-indigo-400 hover:underline">
                          {user.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {user.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          {user.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        {format(parseISO(user.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleUserStatus(user._id, user.isActive, user.email)}
                          disabled={user.email === currentUserEmail && user.isActive}
                          aria-label={user.isActive ? `Disable user ${user.email}` : `Enable user ${user.email}`}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            user.email === currentUserEmail && user.isActive
                              ? 'opacity-50 cursor-not-allowed border-white/5 text-zinc-500 bg-transparent'
                              : user.isActive
                                ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
