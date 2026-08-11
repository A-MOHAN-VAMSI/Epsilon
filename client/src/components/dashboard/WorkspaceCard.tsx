"use client";

import { ArrowUpRight, Clock3, Code2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Workspace } from "@/lib/workspaceService";
import { formatUpdatedAt, languageColor } from "@/lib/workspaceLabels";

type WorkspaceCardProps = {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
};

export default function WorkspaceCard({ workspace, onEdit, onDelete }: WorkspaceCardProps) {
  return (
    <article className="group relative flex min-h-52 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:bg-white/[0.05] hover:shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--color-primary)]/[0.06] blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-[var(--color-primary)]"><Code2 size={19} /></span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#08101c]/60 px-2.5 py-1 text-[10px] font-medium text-white/55">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: languageColor(workspace.language) }} />
          {workspace.language || "Blank"}
        </span>
      </div>
      <div className="relative mt-5">
        <h3 className="text-base font-semibold text-white transition-colors group-hover:text-[var(--color-primary)]">{workspace.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/50">{workspace.description || "No description provided."}</p>
      </div>
      <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
        <div className="space-y-1 text-[11px] text-white/45">
          <span className="flex items-center gap-1.5"><Clock3 size={13} />{formatUpdatedAt(workspace.updated_at)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Edit ${workspace.name}`}
            onClick={() => onEdit(workspace)}
            className="rounded-lg p-2 text-white/45 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            aria-label={`Delete ${workspace.name}`}
            onClick={() => onDelete(workspace)}
            className="rounded-lg p-2 text-white/45 transition-colors hover:bg-red-400/10 hover:text-red-300"
          >
            <Trash2 size={14} />
          </button>
          <Link
            href={`/workspace/${workspace.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-foreground)] transition-all hover:scale-[1.03] hover:shadow-[0_6px_18px_rgba(200,255,61,0.25)]"
          >
            Open<ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
