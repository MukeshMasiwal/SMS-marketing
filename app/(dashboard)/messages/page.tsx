import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Messages</h1>
        <p className="text-zinc-400 mt-1">View the delivery log of individual SMS messages.</p>
      </div>
      
      <div className="flex-1">
        <EmptyState 
          title="No messages sent"
          description="Your individual message delivery logs will appear here."
          icon={<MessageSquare className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}
