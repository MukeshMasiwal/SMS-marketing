import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/apiClient";
import { Activity, Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const SuperAdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState("ALL");
  const [actorEmailSearch, setActorEmailSearch] = useState("");

  const loadAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (actionFilter !== "ALL") params.append("action", actionFilter);
      if (actorEmailSearch) params.append("actorEmail", actorEmailSearch);

      const res = await fetchWithAuth(`/api/super-admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setLogs(json.data.logs);
        setPagination(json.data.pagination);
      } else {
        toast.error(json.error?.message || "Failed to load audit logs.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs(1);
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAuditLogs(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Audit Logs</h1>
          <p className="text-sm text-zinc-400 mt-1">Immutable security log of administrative actions, role changes, and system modifications.</p>
        </div>

        <button
          onClick={() => loadAuditLogs(pagination.page)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative w-full max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by actor email..."
              value={actorEmailSearch}
              onChange={(e) => setActorEmailSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <button type="submit" className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase">Action Type:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            <option value="ADMIN_CREATED">ADMIN_CREATED</option>
            <option value="ADMIN_DELETED">ADMIN_DELETED</option>
            <option value="USER_SUSPENDED">USER_SUSPENDED</option>
            <option value="USER_ACTIVATED">USER_ACTIVATED</option>
            <option value="PROVIDER_SETTINGS_CHANGED">PROVIDER_SETTINGS_CHANGED</option>
            <option value="SECURITY_SETTINGS_CHANGED">SECURITY_SETTINGS_CHANGED</option>
            <option value="SYSTEM_SETTINGS_CHANGED">SYSTEM_SETTINGS_CHANGED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">No audit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-zinc-900/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-zinc-100 text-xs font-mono">{log.actorEmail}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono">
                          {log.actorRole}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs font-bold text-amber-400">
                      {log.action}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                      {log.targetType ? `${log.targetType} (${log.targetId || "N/A"})` : "System"}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-zinc-400 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "{}"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAuditLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => loadAuditLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
