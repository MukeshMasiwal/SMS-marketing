import { EmptyState } from "@/components/shared/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Settings</h1>
        <p className="text-zinc-400 mt-1">Configure your account and workspace preferences.</p>
      </div>
      
      <div className="flex-1">
        <EmptyState 
          title="Settings module"
          description="Configuration options will be available here."
          icon={<Settings className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}
