import { ArrowUpRight, Plus } from "lucide-react";

type DashboardHeaderProps = {
  name: string;
  onCreateWorkspace: () => void;
  onJoinWorkspace: () => void;
};

export default function DashboardHeader({
  name,
  onCreateWorkspace,
  onJoinWorkspace,
}: DashboardHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-7 sm:py-8">
      <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-[var(--color-primary)]/[0.07] blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Your workspace</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Welcome back, {name}.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">Pick up where your team left off, or start a fresh collaborative space.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
<button type="button" onClick={onJoinWorkspace} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/80 transition-all hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.08] hover:text-white"><ArrowUpRight size={16} />Join Workspace</button>
          <button type="button" onClick={onCreateWorkspace} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[0_8px_22px_rgba(200,255,61,0.18)] transition-all hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(200,255,61,0.28)]"><Plus size={17} />New Workspace</button>
        </div>
      </div>
    </section>
  );
}
