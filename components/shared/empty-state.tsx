import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 md:p-12 text-center animate-in fade-in-50 min-h-[400px]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 text-zinc-300 mb-6 shadow-sm ring-1 ring-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold tracking-tight text-zinc-100">{title}</h3>
      <p className="mt-3 text-sm text-zinc-400 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <Button onClick={onAction} className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/20 px-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
