import { UserPlus, FileText, Send, PieChart } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Add Contacts",
      description: "Import your audience or organize subscribers into custom target groups.",
      icon: UserPlus,
    },
    {
      number: "02",
      title: "Create Campaign",
      description: "Compose message templates and choose targeted recipient groups.",
      icon: FileText,
    },
    {
      number: "03",
      title: "Send SMS",
      description: "Broadcast messages instantly or schedule broadcasts for peak engagement.",
      icon: Send,
    },
    {
      number: "04",
      title: "Track Results",
      description: "Monitor real-time delivery logs, status updates, and quota usage.",
      icon: PieChart,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-800/80">
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Workflow
        </h2>
        <p className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
          How It Works
        </p>
        <p className="text-zinc-400 text-base sm:text-lg">
          Launch effective SMS marketing campaigns in four simple steps.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="relative flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl font-black text-indigo-500/40 tracking-tighter">
                  {step.number}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-zinc-100 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
