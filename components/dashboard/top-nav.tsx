import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export function TopNav() {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-4 md:px-6">
      <MobileNav />
      <div className="w-full flex-1">
        {/* Placeholder for future search bar or context title */}
      </div>
      <UserMenu />
    </header>
  );
}
