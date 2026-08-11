import type { LucideIcon } from "lucide-react";

type SidebarItemProps = {
  label: string;
  href?: string;
  icon: LucideIcon;
  active?: boolean;
  compact?: boolean;
};

export default function SidebarItem({ label, href = "#", icon: Icon, active = false, compact = false }: SidebarItemProps) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      title={compact ? label : undefined}
      className={`group relative flex items-center rounded-lg transition-all duration-200 ${compact ? "h-11 w-11 justify-center" : "gap-3 px-3 py-2.5 text-sm"} ${active ? "bg-[var(--color-primary)]/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(200,255,61,0.12)]" : "text-[var(--color-text-muted)] hover:-translate-y-px hover:bg-[var(--color-primary)]/[0.06] hover:text-white"}`}
    >
      {active && <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-[var(--color-primary)]" />}
      <Icon
        size={compact ? 18 : 17}
        className={`shrink-0 transition-all duration-200 group-hover:scale-110 ${
          active ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] group-hover:text-white"
        }`}
      />
      {!compact && <span>{label}</span>}
    </a>
  );
}
