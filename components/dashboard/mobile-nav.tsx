"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Megaphone, LayoutDashboard, Users, Tags, MessageSquare, BarChart3, Package, Settings, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
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

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }), "shrink-0 md:hidden bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800")}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col bg-zinc-950 border-r-zinc-800 p-0 text-zinc-50">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 font-bold text-lg text-zinc-100">
            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            SMS SaaS
          </Link>
        </div>
        <nav className="grid gap-2 p-4 text-sm font-medium overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 transition-all",
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 active:bg-zinc-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
