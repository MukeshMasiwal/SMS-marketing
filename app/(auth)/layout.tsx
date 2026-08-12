import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50 p-4 font-sans selection:bg-indigo-500/30">
      <div className="mb-8 flex items-center gap-2 text-xl font-bold tracking-tight">
        <Link href="/" className="flex items-center gap-2 text-zinc-100 hover:text-indigo-400 transition-colors">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span>SMS Marketing</span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
