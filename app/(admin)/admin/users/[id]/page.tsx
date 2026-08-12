"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Calendar, Shield, Contact, Megaphone, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = params.id as string;

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/admin/users/${userId}`);
        const json = await res.json();
        
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error?.message || "Failed to load user details");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) fetchUserDetail();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
        <div className="h-48 rounded-xl bg-zinc-950/50 border border-white/10 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-950/50 border border-white/10 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Unable to load user</h3>
        <p className="text-destructive/80 mb-6 max-w-md">{error || "User not found"}</p>
        <button onClick={() => router.push("/admin/users")} className="px-4 py-2 rounded-md bg-transparent border border-destructive/30 hover:bg-destructive/20 text-destructive">
          Back to Users
        </button>
      </div>
    );
  }

  const { user, stats, recentCampaigns } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{user.name}</h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
            user.isActive 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {user.isActive ? 'Active Account' : 'Disabled Account'}
          </span>
        </div>
      </div>
      
      {/* User Profile Card */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/50 overflow-hidden">
        <div className="p-6 md:p-8">
          <h2 className="text-lg font-medium text-zinc-100 mb-6">Profile Information</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-1">
                <User className="h-4 w-4" /> Name
              </div>
              <div className="text-zinc-100">{user.name}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-1">
                <Mail className="h-4 w-4" /> Email
              </div>
              <div className="text-zinc-100">{user.email}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-1">
                <Shield className="h-4 w-4" /> Role
              </div>
              <div className="text-zinc-100">{user.role}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-1">
                <Calendar className="h-4 w-4" /> Joined
              </div>
              <div className="text-zinc-100">{format(parseISO(user.createdAt), "MMM d, yyyy")}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Usage Stats */}
      <h2 className="text-lg font-medium text-zinc-100 mt-2">Usage Statistics</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Contact className="h-4 w-4" />
            <span className="text-sm font-medium">Contacts</span>
          </div>
          <div className="text-3xl font-bold text-zinc-100">{stats.contactCount.toLocaleString()}</div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Megaphone className="h-4 w-4" />
            <span className="text-sm font-medium">Campaigns</span>
          </div>
          <div className="text-3xl font-bold text-zinc-100">{stats.campaignCount.toLocaleString()}</div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Messages Sent</span>
          </div>
          <div className="text-3xl font-bold text-zinc-100">{stats.messageCount.toLocaleString()}</div>
        </div>
      </div>
      
      {/* Recent Campaigns (Read Only) */}
      <h2 className="text-lg font-medium text-zinc-100 mt-4">Recent Campaigns</h2>
      <div className="rounded-xl border border-white/10 bg-zinc-950/50 overflow-hidden">
        {recentCampaigns.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            This user has not created any campaigns yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Recipients</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {recentCampaigns.map((camp: any) => (
                  <tr key={camp._id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-zinc-100">{camp.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs">{camp.status}</span>
                    </td>
                    <td className="px-4 py-3">{camp.recipientCount}</td>
                    <td className="px-4 py-3 text-zinc-500">{format(parseISO(camp.createdAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
