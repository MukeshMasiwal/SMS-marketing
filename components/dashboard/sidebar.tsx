"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Tags, 
  Megaphone, 
  MessageSquare, 
  BarChart3, 
  Package, 
  Settings,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Groups", href: "/groups", icon: Tags },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Packages", href: "/packages", icon: Package },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r border-zinc-800 bg-zinc-950 md:block w-64 lg:w-72">
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-zinc-100">
            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            SMS SaaS
          </Link>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
