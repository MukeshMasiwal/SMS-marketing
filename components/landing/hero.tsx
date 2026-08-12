import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      {/* Background glow decorator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md">
          <Zap className="h-3.5 w-3.5 text-indigo-400" />
          <span>High Delivery SMS Marketing Platform</span>
        </div>

        {/* Primary H1 Heading */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
          Reach More Customers. <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">
            Grow Your Business With SMS.
          </span>
        </h1>

        {/* Subtitle / Supporting text */}
        <p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
          Manage contacts, build targeted campaigns, send bulk messages, track delivery in real-time, and analyze campaign performance — all from a single powerful dashboard.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full px-8 py-6 text-base transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2">
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <Link href="#pricing" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 py-6 text-base border-zinc-700 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
              View Pricing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
