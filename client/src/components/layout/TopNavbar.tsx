import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import Logo from "./Logo";
import UserProfile from "./UserProfile";

type TopNavbarProps = {
  title?: string;
  user: { name: string; email: string };
};

export default function TopNavbar({ title = "workspace", user }: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#08101c]/75 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="mx-auto flex h-11 max-w-[1600px] items-center gap-3">
        <button type="button" aria-label="Open navigation" className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"><Menu size={19} /></button>
        <div className="shrink-0"><Logo /></div>

        <div className="mx-auto hidden w-full max-w-xl px-8 sm:block">
          <label className="group flex h-10 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-white/45 shadow-inner transition-all duration-200 focus-within:border-[var(--color-primary)]/45 focus-within:bg-white/[0.055] focus-within:shadow-[0_0_0_3px_rgba(200,255,61,0.06)]">
            <Search size={16} className="transition-colors group-focus-within:text-[var(--color-primary)]" />
            <input aria-label="Search workspaces" placeholder={`Search ${title}`} className="min-w-0 flex-1 bg-transparent text-sm text-white/80 outline-none placeholder:text-white/35" />
            <kbd className="hidden rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/35 md:inline">⌘ K</kbd>
          </label>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button type="button" aria-label="Search workspaces" className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white sm:hidden"><Search size={18} /></button>
          <button type="button" aria-label="Notifications, 3 unread" className="relative rounded-lg p-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"><Bell size={18} /><span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#08101c] bg-[var(--color-primary)] px-1 text-[8px] font-bold text-[#07100b]">3</span></button>
          <button type="button" aria-label="Toggle theme" className="group rounded-lg p-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-[var(--color-primary)]"><Sun size={17} className="hidden sm:block" /><Moon size={17} className="sm:hidden" /></button>
          <div className="ml-1 border-l border-white/10 pl-2"><UserProfile name={user.name} email={user.email} /></div>
        </div>
      </div>
    </header>
  );
}
