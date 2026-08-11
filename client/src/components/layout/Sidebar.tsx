"use client";

import {
  BarChart3,
  Bot,
  Code2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import SidebarItem from "./SidebarItem";
import { usePathname } from "next/navigation";

type SidebarProps = {
  user: { name: string; email: string };
};

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Workspaces", icon: FolderKanban, href: "/dashboard" },
  { label: "Teams", icon: Users, href: "/dashboard" },
  { label: "AI Assistant", icon: Bot, href: "/ai-assistant" },
  { label: "Analytics", icon: BarChart3, href: "/dashboard" },
];

const mobileNavigation = navigation.slice(0, 4);

function isNavigationItemActive(label: string, pathname: string) {
  switch (label) {
    case "Dashboard":
      return pathname === "/dashboard";
    case "Workspaces":
      return pathname === "/workspaces" || pathname.startsWith("/workspace/");
    case "Teams":
      return pathname === "/teams";
    case "AI Assistant":
      return pathname === "/ai-assistant" || pathname.startsWith("/ai-assistant/");
    case "Analytics":
      return pathname === "/analytics";
    case "Settings":
      return pathname === "/settings";
    default:
      return false;
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-[#08101c]/80 px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col">
        <a href="#" className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/[0.04]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[#07100b] shadow-[0_0_24px_rgba(200,255,61,0.18)]"><Code2 size={19} strokeWidth={2.5} /></span>
          <span className="text-sm font-semibold tracking-[0.16em]">EPSILON</span>
        </a>

        <nav className="mt-10 space-y-1" aria-label="Primary navigation">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Workspace</p>
          {navigation.map((item) => (
            <SidebarItem
              key={item.label}
              {...item}
              active={isNavigationItemActive(item.label, pathname)}
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <SidebarItem label="Settings" icon={Settings} active={isNavigationItemActive("Settings", pathname)} />
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-2 transition-colors hover:border-white/15 hover:bg-white/[0.055]">
            <div className="flex items-center gap-2.5 px-1 py-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[#8bbd1f] text-xs font-bold text-[#07100b]">{user.name.charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-white/90">{user.name}</span><span className="block truncate text-[10px] text-white/40">{user.email}</span></span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 border-t border-white/[0.08] pt-2">
              <button type="button" className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"><UserRound size={13} />Profile</button>
              <button type="button" className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-white/55 transition-colors hover:bg-red-400/10 hover:text-red-300"><LogOut size={13} />Logout</button>
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-white/10 bg-[#0b1320]/90 px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        {mobileNavigation.map((item) => (
          <SidebarItem
            key={item.label}
            {...item}
            compact
            active={isNavigationItemActive(item.label, pathname)}
          />
        ))}
        <SidebarItem label="Settings" icon={Settings} compact active={isNavigationItemActive("Settings", pathname)} />
      </nav>
    </>
  );
}
