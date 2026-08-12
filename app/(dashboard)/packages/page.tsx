"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Sparkles } from "lucide-react";

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch("/api/packages");
        const json = await res.json();
        if (json.success) {
          setPackages(json.data.packages);
        }
      } catch (error) {
        console.error("Failed to load packages:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  return (
    <div className="flex flex-col gap-12 py-8 max-w-6xl mx-auto w-full">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-zinc-400">
          No hidden fees. No surprise charges. Pick the plan that best fits your scale and start sending SMS immediately.
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-96 rounded-2xl bg-zinc-900/50 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          {packages.map((pkg) => {
            const isPopular = pkg.popular;
            return (
              <div 
                key={pkg._id} 
                className={`relative flex flex-col rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 group ${
                  isPopular 
                    ? 'bg-gradient-to-b from-indigo-500/10 to-indigo-900/20 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 z-10 scale-105'
                    : 'bg-zinc-900/40 border border-white/10 hover:border-white/20'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-indigo-500/40">
                      <Sparkles className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${isPopular ? 'text-indigo-400' : 'text-zinc-200'}`}>
                    {pkg.name}
                  </h3>
                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ₹{pkg.price.toLocaleString()}
                    </span>
                    <span className="ml-1 text-xl font-semibold text-zinc-500">
                      /mo
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-zinc-400">
                    Includes <strong className="text-zinc-200">{pkg.messageLimit.toLocaleString()}</strong> SMS
                    <br/>
                    Valid for {pkg.validity} days
                  </p>
                </div>
                
                <ul className="flex-1 space-y-4 text-sm text-zinc-300 mb-8">
                  {pkg.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex gap-3">
                      <Check className={`h-5 w-5 shrink-0 ${isPopular ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => alert(`Upgrading to ${pkg.name} is disabled during the MVP.`)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {isPopular && <Zap className="h-4 w-4" />}
                  {pkg.buttonText || "Get Started"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
