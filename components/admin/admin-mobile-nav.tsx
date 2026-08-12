"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Shield, LayoutDashboard, Users, Megaphone, Package } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
  { name: "Packages", href: "/admin/packages", icon: Package },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }), "shrink-0 md:hidden bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800")}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle admin menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col bg-black border-r-zinc-800 p-0 text-zinc-50">
        <SheetTitle className="sr-only">Admin Menu</SheetTitle>
        <div className="flex h-16 items-center border-b border-white/10 px-6 gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg">
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-zinc-100">Admin</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto grid gap-2 p-4 text-sm font-medium">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/admin");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 transition-all",
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400"
                    : "text-zinc-400 hover:text-zinc-100 active:bg-zinc-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
            Exit Admin
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
