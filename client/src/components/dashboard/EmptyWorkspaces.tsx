"use client";

import { Plus } from "lucide-react";

type EmptyWorkspacesProps = {
  onCreate: () => void;
};

export default function EmptyWorkspaces({ onCreate }: EmptyWorkspacesProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--color-primary)]">
        <Plus size={26} />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-white">No workspaces yet</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
        Create your first workspace and start collaborating with your team in real time.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[0_8px_22px_rgba(200,255,61,0.18)] transition-all hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(200,255,61,0.28)]"
      >
        <Plus size={16} />
        Create your first workspace
      </button>
    </div>
  );
}
