import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

export const ForgotPasswordPage: React.FC = () => {
  const { resendOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await resendOtp(email, "PASSWORD_RESET");
      setSubmitted(true);
      toast.success("Reset code sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Forgot Password</h1>
          <p className="text-sm text-zinc-400">Enter your email to receive a 6-digit password reset code</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center space-y-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-sm text-zinc-200">
              If an account exists for <strong className="text-white">{email}</strong>, a 6-digit password reset code has been sent.
            </p>
            <button
              onClick={() => (window.location.href = `/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-all"
            >
              Enter Reset Code
            </button>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? "Sending Code..." : "Send Reset Code"}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-zinc-400">
          Remember your password?{" "}
          <a href="/login" className="font-semibold text-indigo-400 hover:underline">
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
};
