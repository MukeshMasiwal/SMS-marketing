"use client";

import { useState, useEffect } from "react";
import { Send, MessageSquare, AlertCircle, CheckCircle2, RefreshCw, Smartphone, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MessageLog {
  _id: string;
  messageId: string;
  recipient: string;
  message: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
  provider: string;
  errorMessage?: string;
  createdAt: string;
}

export default function MessagesPage() {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("Test SMS from SMS Marketing");
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<{ messageId?: string; message?: string } | null>(null);
  const [errorResult, setErrorResult] = useState<string | null>(null);

  const [smsType, setSmsType] = useState<"trial" | "custom">("trial");

  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success && data.data?.messages) {
        setLogs(data.data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch message logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessResult(null);
    setErrorResult(null);

    try {
      const res = await fetch("/api/sms/exotel/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: to.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessResult({
          messageId: data.data?.messageId || "N/A",
          message: data.data?.message || "SMS accepted by Exotel",
        });
        // Refresh logs list
        fetchLogs();
      } else {
        const errorMsg = data.error?.message || data.message || "Failed to send SMS via Exotel";
        setErrorResult(errorMsg);
      }
    } catch (err: any) {
      setErrorResult(err.message || "Network error while calling Exotel API route.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-indigo-500" />
            Messages & Exotel Integration
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Send real SMS messages via Exotel API and monitor delivery logs.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchLogs}
          className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
          Refresh Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Exotel Test SMS Card */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
                <Smartphone className="h-5 w-5" />
                <h2>Exotel Test SMS</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Dispatch a real SMS message to your verified Indian mobile number using Exotel.
              </p>
            </div>

            <form onSubmit={handleSendTestSms} className="space-y-4">
              {/* SMS Type Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-200">SMS Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      smsType === "trial"
                        ? "border-indigo-500/80 bg-indigo-950/40 text-indigo-200 shadow-sm"
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="smsType"
                      value="trial"
                      checked={smsType === "trial"}
                      onChange={() => setSmsType("trial")}
                      className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-100">Exotel Trial SMS</span>
                      <span className="text-[10px] text-zinc-400">Verified Numbers</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      smsType === "custom"
                        ? "border-indigo-500/80 bg-indigo-950/40 text-indigo-200 shadow-sm"
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="smsType"
                      value="custom"
                      checked={smsType === "custom"}
                      onChange={() => setSmsType("custom")}
                      className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-100">Custom SMS</span>
                      <span className="text-[10px] text-zinc-400">DLT Production</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-phone" className="text-xs font-medium text-zinc-200">
                  Phone Number (Indian Mobile)
                </Label>
                <Input
                  id="to-phone"
                  type="text"
                  placeholder="+919876543210 or 9876543210"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-sm focus-visible:ring-indigo-500"
                />
                <p className="text-[11px] text-zinc-500">Must be a 10-digit Indian mobile number starting with 6-9.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-message" className="text-xs font-medium text-zinc-200">
                  Message Content
                </Label>
                <Textarea
                  id="sms-message"
                  rows={4}
                  placeholder="Test SMS from SMS Marketing"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={1600}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-sm focus-visible:ring-indigo-500 resize-none"
                />
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Enforces standard SMS length rules</span>
                  <span>{message.length}/1600</span>
                </div>
              </div>

              {/* Trial Account Callout */}
              <div className="rounded-xl bg-indigo-950/30 border border-indigo-900/50 p-3.5 text-xs text-indigo-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Exotel Trial Account Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-300/90">
                  Exotel trial accounts permit sending SMS to numbers registered & verified in your Exotel dashboard. For production Indian SMS, DLT entity & template parameters are supported via environment variables.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Test SMS</span>
                  </>
                )}
              </Button>
            </form>

            {/* Results Feedback */}
            {successResult && (
              <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/60 p-4 text-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>✓ SMS accepted by Exotel</span>
                </div>
                <p className="text-zinc-300 mt-1">Status: Submitted / Queued</p>
                {successResult.messageId && (
                  <p className="font-mono text-emerald-300 text-[11px] bg-emerald-950/80 p-2 rounded border border-emerald-900/50 mt-2">
                    Message ID: {successResult.messageId}
                  </p>
                )}
              </div>
            )}

            {errorResult && (
              <div className="rounded-xl bg-rose-950/40 border border-rose-800/60 p-4 text-rose-200 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold text-rose-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>✕ SMS failed</span>
                </div>
                <p className="text-rose-300/90 leading-relaxed mt-1">{errorResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Delivery Logs Table */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl flex flex-col">
          <div className="border-b border-zinc-800/80 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Message Delivery Logs</h2>
              <p className="text-xs text-zinc-400">History of outgoing messages sent via real provider endpoints.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              {logs.length} logs
            </span>
          </div>

          {loadingLogs ? (
            <div className="flex-1 flex items-center justify-center py-16 text-zinc-500 text-xs">
              <RefreshCw className="h-5 w-5 animate-spin mr-2 text-indigo-400" />
              Loading delivery logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800/80 rounded-xl bg-zinc-900/20">
              <MessageSquare className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-300">No message logs found</p>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                Send your first test SMS using the form to see real-time delivery logs here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-zinc-400 bg-zinc-900/50">
                    <th className="py-3 px-3 font-medium">Recipient</th>
                    <th className="py-3 px-3 font-medium">Message</th>
                    <th className="py-3 px-3 font-medium">Provider</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-zinc-200">{log.recipient}</td>
                      <td className="py-3 px-3 text-zinc-300 max-w-[200px] truncate" title={log.message}>
                        {log.message}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/70 text-indigo-400 border border-indigo-900/50 uppercase">
                          {log.provider || "exotel"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {log.status === "DELIVERED" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-900/50">
                            DELIVERED
                          </span>
                        ) : log.status === "SENT" || log.status === "QUEUED" ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-900/50">
                            {log.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded text-[10px] font-semibold border border-rose-900/50" title={log.errorMessage}>
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-zinc-500 whitespace-nowrap text-[11px]">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
