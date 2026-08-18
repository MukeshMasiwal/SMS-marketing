import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, LayoutDashboard, Megaphone, Package, Shield, ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    redirect("/login");
  }

  // Create a mock NextRequest for requireRole
  const mockReq = {
    cookies: cookieStore,
    headers: { get: () => `Bearer ${token}` }
  } as any;

  const auth = await requireRole(mockReq, "ADMIN");
  
  if (auth.error) {
    // If authenticated but not admin (403), or completely invalid (401)
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-zinc-950/50 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg">
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-zinc-100">Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Overview
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
            <Users className="h-5 w-5" />
            Users
          </Link>
          <Link href="/admin/campaigns" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
            <Megaphone className="h-5 w-5" />
            Campaigns
          </Link>
          <Link href="/admin/packages" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
            <Package className="h-5 w-5" />
            Packages
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Exit Admin</span>
          </Link>
          <AdminLogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center gap-4 border-b border-white/10 bg-black px-4 md:hidden">
          <AdminMobileNav />
          <div className="flex items-center gap-2 font-bold text-zinc-100">
            <Shield className="h-5 w-5 text-indigo-400" /> Admin
          </div>
        </header>
        
        <main className="flex-1 w-full min-w-0 overflow-y-auto bg-black p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl h-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
