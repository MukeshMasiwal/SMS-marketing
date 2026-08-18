import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export function TopNav() {
  return (
    <header className="flex h-16 items-center justify-between gap-2 sm:gap-4 border-b border-zinc-800 bg-zinc-950 px-3 sm:px-6">
      <MobileNav />
      <div className="flex-1 min-w-0">
        {/* Placeholder for search or title */}
      </div>
      <UserMenu />
    </header>
  );
}
