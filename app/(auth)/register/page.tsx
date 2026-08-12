"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || "Failed to register");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
      <div className="space-y-2 text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Create an account</h1>
        <p className="text-sm text-zinc-400">Get started with your SMS Marketing platform</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-200">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
          />
        </div>

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
          <Label htmlFor="password" className="text-zinc-200">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-all"
        >
          {loading ? "Creating account..." : "Get Started"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-400 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
