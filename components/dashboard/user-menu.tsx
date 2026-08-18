"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon, Settings, LogOut, Shield } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
}

export function UserMenu() {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            setUserData(data.data.user);
          }
        }
      } catch {
        // Fallback to anonymous display if request fails
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      window.location.href = "/login";
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email && email.length > 0) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const isAdmin = (userData?.role || "").toUpperCase() === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full focus-visible:ring-1 focus-visible:ring-indigo-500")}>
        <Avatar className="h-8 w-8 border border-zinc-800">
          <AvatarFallback className="bg-indigo-600/20 text-indigo-400 font-semibold text-xs">
            {getInitials(userData?.name, userData?.email)}
          </AvatarFallback>
        </Avatar>
        <span className="sr-only">Toggle user menu</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 max-w-[calc(100vw-1rem)] bg-zinc-950 border-zinc-800 text-zinc-100 p-1.5 shadow-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal px-2 py-1.5">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none text-zinc-100">{userData?.name || "My Account"}</p>
              <p className="text-xs leading-none text-zinc-400 truncate">{userData?.email || "Signed in"}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-zinc-800 my-1" />

          <DropdownMenuItem className="focus:bg-zinc-900 focus:text-zinc-100 cursor-pointer rounded-md p-0">
            <Link href="/settings" className="flex w-full items-center px-2 py-1.5">
              <UserIcon className="mr-2 h-4 w-4 text-indigo-400" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="focus:bg-zinc-900 focus:text-zinc-100 cursor-pointer rounded-md p-0">
            <Link href="/settings" className="flex w-full items-center px-2 py-1.5">
              <Settings className="mr-2 h-4 w-4 text-zinc-400" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>

          {isAdmin && (
            <DropdownMenuItem className="focus:bg-zinc-900 focus:text-purple-300 cursor-pointer rounded-md p-0">
              <Link href="/admin" className="flex w-full items-center px-2 py-1.5">
                <Shield className="mr-2 h-4 w-4 text-purple-400" />
                <span>Admin Portal</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-zinc-800 my-1" />

        <DropdownMenuItem 
          onClick={handleLogout} 
          className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer rounded-md font-medium"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
