import { Send, Building2, CheckCircle2, Globe } from "lucide-react";

export function Stats() {
  const stats = [
    {
      value: "10K+",
      label: "Messages Sent",
      icon: Send,
      description: "Delivered across campaigns",
    },
    {
      value: "500+",
      label: "Active Businesses",
      icon: Building2,
      description: "Growing with our platform",
    },
    {
      value: "95%",
      label: "Delivery Rate",
      icon: CheckCircle2,
      description: "High provider reliability",
    },
    {
      value: "20+",
      label: "Countries Supported",
      icon: Globe,
      description: "Global broadcast reach",
    },
  ];

  return (
    <section className="py-12 border-y border-zinc-800/80 bg-zinc-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 text-center backdrop-blur-sm transition-all hover:border-zinc-700/80 hover:bg-zinc-900/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-zinc-200 mt-1">
                  {stat.label}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
