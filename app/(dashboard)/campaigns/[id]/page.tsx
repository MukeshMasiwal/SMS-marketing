"use client";

import { useState, useEffect, useCallback, use } from "react";
import { format } from "date-fns";
import { ArrowLeft, Megaphone, CheckCircle2, XCircle, Clock, Send, Percent, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 25;

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = await res.json();
      if (data.success) {
        setCampaign(data.data.campaign);
        setMessages(data.data.messages || []);
      } else {
        setError(data.error?.message || "Failed to load campaign");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
    
    let interval: NodeJS.Timeout;
    if (campaign?.status === "SENDING") {
      interval = setInterval(fetchDetails, 3000);
    }
    return () => clearInterval(interval);
  }, [fetchDetails, campaign?.status]);

  if (isLoading && !campaign) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p>Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => window.location.href = "/campaigns"} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
        </Button>
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive text-center flex flex-col items-center">
          <XCircle className="h-10 w-10 mb-4 opacity-50" />
          <h2 className="text-lg font-semibold mb-2">Error Loading Campaign</h2>
          <p>{error}</p>
          <Button variant="outline" onClick={() => { setError(""); setIsLoading(true); fetchDetails(); }} className="mt-4 border-destructive/30 hover:bg-destructive/20 text-destructive">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const stats = {
    total: messages.length,
    delivered: messages.filter(m => m.status === "DELIVERED").length,
    sent: messages.filter(m => m.status === "SENT").length,
    failed: messages.filter(m => m.status === "FAILED").length,
    queued: messages.filter(m => m.status === "QUEUED").length,
  };

  const deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge variant="secondary">Draft</Badge>;
      case "SENDING": return <Badge variant="default" className="bg-blue-600">Sending</Badge>;
      case "COMPLETED": return <Badge variant="default" className="bg-emerald-600">Completed</Badge>;
      case "FAILED": return <Badge variant="destructive">Failed</Badge>;
      case "CANCELLED": return <Badge variant="outline">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.max(1, Math.ceil(messages.length / PAGE_SIZE));
  const paginatedMessages = messages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <Button variant="ghost" onClick={() => window.location.href = "/campaigns"} className="mb-2 -ml-4 text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Megaphone className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 break-words">{campaign.name}</h1>
            <div>{getStatusBadge(campaign.status)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-medium text-zinc-100 mb-4">Message Details</h3>
            <div className="rounded-lg bg-zinc-900/50 p-4 border border-white/5 whitespace-pre-wrap text-zinc-300">
              {campaign.message}
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Target Type</p>
                <p className="text-sm text-zinc-200 capitalize">{campaign.targetType.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-1">Created</p>
                <p className="text-sm text-zinc-200">{format(new Date(campaign.createdAt), "PPp")}</p>
              </div>
              {campaign.startedAt && (
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Started Sending</p>
                  <p className="text-sm text-zinc-200">{format(new Date(campaign.startedAt), "PPp")}</p>
                </div>
              )}
              {campaign.completedAt && (
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Completed</p>
                  <p className="text-sm text-zinc-200">{format(new Date(campaign.completedAt), "PPp")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-medium text-zinc-100 mb-4">Target Audience</h3>
            {campaign.targetType === "GROUP" ? (
              <div className="space-y-2">
                {campaign.targetGroupIds.map((g: any) => (
                  <Badge key={g._id} variant="secondary" className="mr-2">{g.name}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-400">
                {campaign.targetContactIds.length} specific contacts selected
              </div>
            )}
            <p className="text-sm text-zinc-500 mt-4">
              Final resolved recipient count: <span className="font-medium text-zinc-200">{campaign.recipientCount}</span>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-medium text-zinc-100 mb-4">Delivery Statistics</h3>
            
            {campaign.status === "DRAFT" ? (
              <div className="text-sm text-zinc-500 text-center py-6 border border-dashed border-zinc-800 rounded-lg">
                Send campaign to view statistics
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-indigo-400" />
                    <span className="font-medium text-indigo-100">Delivery Rate</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-400">{deliveryRate}%</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-400">Total</span>
                    </div>
                    <span className="text-lg font-semibold text-zinc-200">{stats.total}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-500">Delivered</span>
                    </div>
                    <span className="text-lg font-semibold text-emerald-400">{stats.delivered}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Send className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-medium text-blue-500">Sent</span>
                    </div>
                    <span className="text-lg font-semibold text-blue-400">{stats.sent}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs font-medium text-destructive">Failed</span>
                    </div>
                    <span className="text-lg font-semibold text-red-400">{stats.failed}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 col-span-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-500">Queued</span>
                    </div>
                    <span className="text-lg font-semibold text-amber-400">{stats.queued}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="w-full min-w-0 rounded-xl border border-white/10 bg-zinc-950/50 p-4 sm:p-6 backdrop-blur-xl overflow-hidden flex flex-col min-h-[400px]">
        <h3 className="text-lg font-medium text-zinc-100 mb-4">Message Log</h3>
        
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20">
            <FileText className="h-8 w-8 text-zinc-600 mb-3" />
            <h4 className="text-zinc-300 font-medium">No messages yet.</h4>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm">
              This campaign hasn't generated any message records yet.
            </p>
          </div>
        ) : (
          <>
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm text-left">
                <thead className="text-xs text-zinc-400 bg-zinc-900/50 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-medium">Recipient</th>
                    <th className="px-4 py-3 font-medium min-w-[200px]">Message</th>
                    <th className="px-4 py-3 font-medium">Provider</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Error</th>
                    <th className="px-4 py-3 font-medium text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedMessages.map((msg, i) => (
                    <tr key={msg._id || i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-zinc-200">{msg.recipient}</td>
                      <td className="px-4 py-3 text-zinc-400 truncate max-w-[200px]" title={msg.message}>
                        {msg.message}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{msg.provider || "Unknown"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          msg.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-500" :
                          msg.status === "SENT" ? "bg-blue-500/10 text-blue-500" :
                          msg.status === "FAILED" ? "bg-destructive/10 text-destructive" :
                          "bg-amber-500/10 text-amber-500"
                        }`}>
                          {msg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-destructive max-w-[150px] truncate" title={msg.errorMessage}>
                        {msg.errorMessage || "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400 whitespace-nowrap">
                        {format(new Date(msg.createdAt), "HH:mm:ss")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-zinc-300 border-white/10 bg-transparent hover:bg-white/5 hover:text-white"
              >
                Previous
              </Button>
              <span className="text-sm text-zinc-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-zinc-300 border-white/10 bg-transparent hover:bg-white/5 hover:text-white"
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
