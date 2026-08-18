import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-50 md:flex-row font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 w-full min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
