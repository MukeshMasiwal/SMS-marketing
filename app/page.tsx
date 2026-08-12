import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "SMS Marketing Platform — Reach Customers Instantly",
  description: "Manage contacts, create SMS campaigns, send bulk messages, track delivery, and analyze campaign performance with simple transparent pricing.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Features />
        <Pricing />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
