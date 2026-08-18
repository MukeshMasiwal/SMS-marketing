import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Shield, Crown, AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const LoginPage: React.FC = () => {
  const { login, resendOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const redirectByRole = (userRole?: string) => {
    const roleUpper = (userRole || "").toUpperCase();
    if (roleUpper === "SUPER_ADMIN") {
      window.location.href = "/super-admin";
    } else if (roleUpper === "ADMIN") {
      window.location.href = "/admin/users";
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      redirectByRole(user.role);
    } catch (err: any) {
      if (err.emailVerified === false) {
        setUnverifiedEmail(err.email || email);
        setError(err.message || "Please verify your email before logging in.");
      } else {
        setError(err.message || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = unverifiedEmail || email;
    if (!targetEmail) return;

    setIsResending(true);
    try {
      await resendOtp(targetEmail, "EMAIL_VERIFICATION");
      toast.success("Verification code resent! Check your inbox.");
      window.location.href = `/verify-email?email=${encodeURIComponent(targetEmail)}`;
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleDemoLogin = async (role: "SUPER_ADMIN" | "ADMIN" | "USER") => {
    setError("");
    setLoading(true);
    let demoEmail = "user@example.com";
    let demoPassword = "User@12345";

    if (role === "SUPER_ADMIN") {
      demoEmail = "superadmin@example.com";
      demoPassword = "SuperAdmin@12345";
    } else if (role === "ADMIN") {
      demoEmail = "admin@example.com";
      demoPassword = "Admin@12345";
    }

    try {
      const user = await login(demoEmail, demoPassword);
      toast.success(`Logged in as ${role === "SUPER_ADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : "User"}`);
      redirectByRole(user.role);
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Welcome Back</h1>
          <p className="text-sm text-zinc-400">Sign in to your SMS Marketing account</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            {unverifiedEmail && (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`} />
                <span>{isResending ? "Resending Code..." : "Resend Verification Code"}</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Password</label>
              <a href="/forgot-password" className="text-xs font-medium text-indigo-400 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 focus:outline-none focus:text-zinc-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo Login Options */}
        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">Demo Accounts</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("SUPER_ADMIN")}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition-colors"
            >
              <Crown className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Login as Super Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("ADMIN")}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition-colors"
            >
              <Shield className="h-4 w-4 text-purple-400 shrink-0" />
              <span>Login as Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("USER")}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium transition-colors"
            >
              <User className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Login as User</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-zinc-400">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-semibold text-indigo-400 hover:underline">
            Create account
          </a>
        </div>
      </div>
    </div>
  );
};
