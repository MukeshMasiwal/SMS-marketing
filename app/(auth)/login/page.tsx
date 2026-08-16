"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"user" | "admin" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || "Failed to log in");
      }

      const userRole = (data.data?.user?.role || "").toUpperCase();
      const destination = userRole === "ADMIN" ? "/admin" : "/dashboard";

      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: "USER" | "ADMIN") => {
    setError(null);
    setLoading(true);
    setDemoLoading(role === "ADMIN" ? "admin" : "user");

    const demoEmail = role === "ADMIN" ? "admin@example.com" : "user@example.com";
    const demoPassword = role === "ADMIN" ? "Admin@12345" : "User@12345";
    const destination = role === "ADMIN" ? "/admin" : "/dashboard";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || "Demo account is unavailable. Please run the seed command.");
      }

      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Demo account is unavailable. Please run the seed command.");
    } finally {
      setLoading(false);
      setDemoLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
      <div className="space-y-2 text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Welcome back</h1>
        <p className="text-sm text-zinc-400">Enter your credentials to access your account</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-200">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-zinc-200">Password</Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 focus:outline-none focus:text-zinc-200"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-all"
        >
          {loading && !demoLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {/* Demo Accounts */}
      <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative bg-zinc-900 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Demo Accounts
          </span>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleDemoLogin("USER")}
            className="w-full justify-center border-zinc-800 bg-zinc-950/60 text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all font-medium py-2 rounded-lg"
          >
            <User className="mr-2 h-4 w-4 text-indigo-400" />
            {demoLoading === "user" ? "Logging in as Demo User..." : "Login as Demo User"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleDemoLogin("ADMIN")}
            className="w-full justify-center border-zinc-800 bg-zinc-950/60 text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all font-medium py-2 rounded-lg"
          >
            <Shield className="mr-2 h-4 w-4 text-purple-400" />
            {demoLoading === "admin" ? "Logging in as Demo Admin..." : "Login as Demo Admin"}
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-indigo-400 hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
