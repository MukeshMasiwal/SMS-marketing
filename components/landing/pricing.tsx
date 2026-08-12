"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PackageData {
  _id?: string;
  name: string;
  price: number;
  messageLimit: number | "Unlimited";
  validity: number;
  popular?: boolean;
  buttonText?: string;
  features: string[];
}

const DEFAULT_PACKAGES: PackageData[] = [
  {
    name: "Free",
    price: 0,
    messageLimit: 1000,
    validity: 30,
    popular: false,
    buttonText: "Start Free",
    features: ["1,000 SMS Credits", "Contact Management", "Basic Analytics", "Community Support"],
  },
  {
    name: "Starter",
    price: 499,
    messageLimit: 10000,
    validity: 30,
    popular: false,
    buttonText: "Get Started",
    features: ["10,000 SMS Credits", "Bulk Campaigns", "Contact Management", "Email Support"],
  },
  {
    name: "Growth",
    price: 999,
    messageLimit: 25000,
    validity: 30,
    popular: true,
    buttonText: "Choose Growth",
    features: ["25,000 SMS Credits", "Advanced Analytics", "Priority Support", "Real SMS Provider"],
  },
  {
    name: "Business",
    price: 1999,
    messageLimit: 100000,
    validity: 30,
    popular: false,
    buttonText: "Get Started",
    features: ["100,000 SMS Credits", "Advanced Analytics", "24/7 Phone Support", "Dedicated Account Manager"],
  },
];

export function Pricing() {
  const [packages, setPackages] = useState<PackageData[]>(DEFAULT_PACKAGES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch("/api/packages");
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.packages) && json.data.packages.length > 0) {
          setPackages(json.data.packages);
        }
      } catch (error) {
        console.error("Failed to load pricing packages:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  return (
    <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Offers Promotional Banner */}
      <div className="mb-12 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-zinc-900/80 to-indigo-950/60 p-6 sm:p-8 backdrop-blur-md shadow-xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          <Tag className="h-3.5 w-3.5" />
          <span>Special Launch Offer</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Get more SMS credits with our best-value plans
        </h3>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
          Upgrade your campaign capacity and reach more customers instantly with transparent pricing and no hidden fees.
        </p>
      </div>

      {/* Pricing Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Pricing Plans
        </h2>
        <p className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
          Simple Pricing. Powerful SMS Marketing.
        </p>
        <p className="text-zinc-400 text-base sm:text-lg">
          Pick the plan that best fits your scale and start sending SMS immediately.
        </p>
      </div>

      {/* Pricing Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[450px] rounded-3xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
          {packages.map((pkg, idx) => {
            const isPopular = Boolean(pkg.popular);
            const formattedLimit =
              typeof pkg.messageLimit === "number"
                ? `${pkg.messageLimit.toLocaleString()} SMS`
                : "Unlimited SMS";

            return (
              <div
                key={pkg._id || idx}
                className={`relative flex flex-col rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 ${
                  isPopular
                    ? "bg-gradient-to-b from-indigo-950/60 to-zinc-900/90 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 lg:-translate-y-2 z-10"
                    : "bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60"
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="bg-indigo-600 text-white text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/40">
                      <Sparkles className="h-3.5 w-3.5" /> MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Package Header */}
                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${isPopular ? "text-indigo-400" : "text-zinc-100"}`}>
                    {pkg.name}
                  </h3>

                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ₹{pkg.price.toLocaleString()}
                    </span>
                    <span className="ml-1.5 text-sm font-medium text-zinc-400">
                      /month
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    <p className="font-semibold text-zinc-200">{formattedLimit}</p>
                    <p className="text-xs text-zinc-500">Valid for {pkg.validity} days</p>
                  </div>
                </div>

                {/* Features List */}
                <ul className="flex-1 space-y-3.5 text-sm text-zinc-300 mb-8 border-t border-zinc-800/80 pt-6">
                  {pkg.features.map((feature: string, fIdx: number) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isPopular ? "text-indigo-400" : "text-emerald-400"}`} />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link href="/register" className="w-full mt-auto">
                  <Button
                    className={`w-full py-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      isPopular
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
                    }`}
                  >
                    {isPopular && <Zap className="h-4 w-4" />}
                    <span>{pkg.buttonText || "Get Started"}</span>
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
