import { Send, Users, BarChart3, CheckCircle2, Zap, ShieldCheck } from "lucide-react";

export function Features() {
  const features = [
    {
      title: "Bulk SMS Campaigns",
      description: "Send campaigns to thousands of contacts efficiently with customizable templates and instant delivery.",
      icon: Send,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Contact Management",
      description: "Organize contacts into custom groups, import subscribers seamlessly, and keep records clean.",
      icon: Users,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Campaign Analytics",
      description: "Track total sent messages, delivery rates, and failures in real-time with comprehensive charts.",
      icon: BarChart3,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Delivery Tracking",
      description: "Monitor the exact status of individual SMS broadcasts with granular delivery confirmations.",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Simple Campaign Management",
      description: "Create, schedule, or cancel broadcasts with an intuitive interface built for speed and clarity.",
      icon: Zap,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Secure & Organized",
      description: "Keep customer data separated, protected, and fully isolated with role-based access control.",
      icon: ShieldCheck,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
    },
  ];

  return (
    <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Features
        </h2>
        <p className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
          Everything you need for effective SMS marketing
        </p>
        <p className="text-zinc-400 text-base sm:text-lg">
          Designed to help modern businesses engage customers quickly, reliably, and without complexity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/60 hover:-translate-y-1"
            >
              <div className={`h-12 w-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6`}>
                <Icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-zinc-100 mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
