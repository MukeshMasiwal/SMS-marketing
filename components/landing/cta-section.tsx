import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950 via-zinc-900 to-indigo-950 p-8 sm:p-12 lg:p-16 text-center shadow-2xl">
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 h-64 w-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-cyan-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
            <MessageSquare className="h-7 w-7" />
          </div>

          <h2 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight leading-tight">
            Ready to reach your customers?
          </h2>

          <p className="text-base sm:text-lg text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Start creating SMS campaigns today. Join hundreds of businesses driving higher engagement with instant SMS broadcasts.
          </p>

          <div className="pt-4">
            <Link href="/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full px-9 py-6 text-base shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
