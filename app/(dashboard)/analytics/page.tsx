"use client";

import { useState, useEffect } from "react";
import { Users, Megaphone, MessageSquare, Percent, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { format, parseISO } from "date-fns";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";

// Colors for the charts
const COLORS = {
  DELIVERED: "#10b981", // Emerald 500
  FAILED: "#ef4444",    // Red 500
  SENT: "#3b82f6",      // Blue 500
  QUEUED: "#f59e0b",    // Amber 500
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch("/api/analytics");
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || "Failed to load analytics");
      }
    } catch (err) {
      setError("An unexpected error occurred while loading analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Analytics</h1>
          <p className="text-zinc-400 mt-1">Deep dive into your campaign performance.</p>
        </div>
        
        {/* Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 h-32 animate-pulse" />
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 h-96 animate-pulse" />
          <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 h-96 animate-pulse" />
          <div className="md:col-span-2 rounded-xl border border-white/10 bg-zinc-950/50 p-6 h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Analytics</h1>
          <p className="text-zinc-400 mt-1">Deep dive into your campaign performance.</p>
        </div>
        
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Unable to load analytics</h3>
          <p className="text-destructive/80 mb-6 max-w-md">{error}</p>
          <Button variant="outline" onClick={fetchAnalytics} className="border-destructive/30 hover:bg-destructive/20 text-destructive">
            Please try again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, deliveryStatus, messagesOverTime, campaignPerformance } = data;

  const hasNoData = summary.totalCampaigns === 0 && summary.totalMessages === 0;

  if (hasNoData) {
    return (
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Analytics</h1>
          <p className="text-zinc-400 mt-1">Deep dive into your campaign performance.</p>
        </div>
        
        <div className="flex-1">
          <EmptyState 
            title="No analytics data yet"
            description="Create and send your first campaign to see performance here."
            icon={<BarChart3 className="h-6 w-6" />}
            actionLabel="Create Campaign"
            onAction={() => window.location.href = "/campaigns"}
          />
        </div>
      </div>
    );
  }

  // Format dates for line chart (e.g., "Aug 15")
  const formattedMessagesOverTime = messagesOverTime.map((d: any) => ({
    ...d,
    formattedDate: format(parseISO(d.date), "MMM d")
  }));

  // Custom tooltip for line chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-xl">
          <p className="text-sm font-medium text-zinc-200 mb-1">{label}</p>
          <p className="text-sm text-zinc-400">
            Messages: <span className="font-semibold text-emerald-400">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Analytics</h1>
        <p className="text-zinc-400 mt-1">Deep dive into your campaign performance.</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-zinc-400">Total Contacts</h3>
            <Users className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{summary.totalContacts.toLocaleString()}</div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-zinc-400">Total Campaigns</h3>
            <Megaphone className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{summary.totalCampaigns.toLocaleString()}</div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-zinc-400">Total Messages</h3>
            <MessageSquare className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{summary.totalMessages.toLocaleString()}</div>
        </div>
        
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-indigo-400">Delivery Rate</h3>
            <Percent className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{summary.deliveryRate}%</div>
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 w-full min-w-0">
        {/* Delivery Status Donut Chart */}
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-4 sm:p-6 backdrop-blur-xl flex flex-col min-h-[400px] w-full min-w-0">
          <h3 className="text-lg font-medium text-zinc-100 mb-6">Delivery Status Breakdown</h3>
          
          {summary.totalMessages === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              No message data available
            </div>
          ) : (
            <div className="flex-1 relative min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="rgba(0,0,0,0)"
                  >
                    {deliveryStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name.toUpperCase() as keyof typeof COLORS] || "#52525b"} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-8">
                <span className="text-2xl sm:text-3xl font-bold text-zinc-100">{summary.totalMessages}</span>
                <span className="text-xs text-zinc-400 uppercase tracking-wider">Messages</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Messages Over Time Chart */}
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-4 sm:p-6 backdrop-blur-xl flex flex-col min-h-[400px] w-full min-w-0">
          <h3 className="text-lg font-medium text-zinc-100 mb-6">Message Volume (Last 30 Days)</h3>
          
          {summary.totalMessages === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              No message data available
            </div>
          ) : (
            <div className="flex-1 min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedMessagesOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#52525b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    minTickGap={25}
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "#10b981", stroke: "#18181b", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* Campaign Performance Bar Chart */}
        <div className="md:col-span-2 rounded-xl border border-white/10 bg-zinc-950/50 p-4 sm:p-6 backdrop-blur-xl flex flex-col min-h-[400px] w-full min-w-0">
          <h3 className="text-lg font-medium text-zinc-100 mb-6">Recent Campaigns Performance</h3>
          
          {campaignPerformance.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              No recent campaigns with message data
            </div>
          ) : (
            <div className="flex-1 min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignPerformance} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#52525b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    minTickGap={15}
                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
                  <Bar dataKey="delivered" name="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
