"use client";

import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLogoutButtonProps {
  className?: string;
}

export function AdminLogoutButton({ className }: AdminLogoutButtonProps) {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors text-left",
        className
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span>Log Out</span>
    </button>
  );
}
