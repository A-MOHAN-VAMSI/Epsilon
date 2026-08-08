"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bot, Clock3, FileCode2, LoaderCircle, Plus, Sparkles, type LucideIcon } from "lucide-react";
import DashboardSection from "./DashboardSection";
import DashboardHeader from "./DashboardHeader";
import WorkspaceGrid from "./WorkspaceGrid";
import NewWorkspaceModal from "./NewWorkspaceModal";
import RenameWorkspaceModal from "./RenameWorkspaceModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import JoinWorkspaceModal from "./JoinWorkspaceModal";
import { getUserWorkspaces } from "@/lib/workspaceService";
import type { Workspace } from "@/lib/workspaceService";
import { getRecentActivity, type RecentActivityItem } from "@/lib/recentActivity";

type DashboardLayoutProps = {
  name: string;
};

export default function DashboardLayout({ name }: DashboardLayoutProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Workspace | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoadError("");
      const items = await getUserWorkspaces();
      setWorkspaces(items);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load your workspaces.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      setActivityError("");
      const items = await getRecentActivity(8);
      setActivity(items);
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : "Could not load recent activity.");
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();
    void loadActivity();
  }, [loadWorkspaces, loadActivity]);

  function openNew() {
    setNewOpen(true);
  }

  const recentWorkspace = workspaces[0] ?? null;

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 pb-20 lg:space-y-10 lg:pb-0">
<DashboardHeader name={name} onCreateWorkspace={openNew} onJoinWorkspace={() => setJoinOpen(true)} />

      <DashboardSection title="Quick Actions" description="Jump into your next task.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionCard
            title="New Workspace"
            description="Create a new collaborative workspace."
            icon={Plus}
            onClick={openNew}
          />
          <QuickActionCard
            title="Join Workspace"
            description="Open the existing join workspace flow."
            icon={ArrowUpRight}
            onClick={() => setJoinOpen(true)}
          />
          <QuickActionCard
            title="Open Recent Workspace"
            description={recentWorkspace ? `Jump back into ${recentWorkspace.name}.` : "Create or join a workspace to get started."}
            icon={Clock3}
            onClick={() => {
              if (recentWorkspace) {
                router.push(`/workspace/${recentWorkspace.id}`);
              }
            }}
            disabled={!recentWorkspace}
          />
          <QuickActionCard
            title="AI Assistant"
            description="Open the assistant workspace placeholder."
            icon={Bot}
            onClick={() => router.push("/assistant")}
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Workspaces" description="Your active collaborative coding environments.">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.02] text-sm text-white/45" aria-busy="true">
            Loading your workspaces...
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">
            {loadError}
          </div>
        ) : (
          <WorkspaceGrid
            workspaces={workspaces}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
            onCreate={openNew}
          />
        )}
      </DashboardSection>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-6">
        <DashboardSection title="Recent Activity" description="Latest changes across your workspaces." className="lg:col-span-3">
          {activityLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/45" aria-busy="true">
              <LoaderCircle size={16} className="mr-2 animate-spin text-[var(--color-primary)]" />
              Loading activity...
            </div>
          ) : activityError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">
              {activityError}
            </div>
          ) : activity.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--color-primary)]">
                <Sparkles size={18} />
              </div>
              <p className="mt-4 text-sm font-medium text-white/70">No recent activity yet</p>
              <p className="mt-1 text-sm text-white/45">Create or edit a file in one of your workspaces to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => {
                const href = item.fileId ? `/workspace/${item.workspaceId}?file=${item.fileId}` : `/workspace/${item.workspaceId}`;
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-[var(--color-primary)]/30 hover:bg-white/[0.05]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#08101c]/70 text-[var(--color-primary)]">
                      <FileCode2 size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <span className="rounded-full border border-white/10 bg-[#08101c]/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/45">
                          {item.action}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/45">{item.subtitle}</p>
                      <p className="mt-2 text-xs text-white/35">{formatRelativeTime(item.timestamp)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </DashboardSection>
        <DashboardSection title="Team Members" description="People currently collaborating." className="lg:col-span-2">
          <div className="h-56 rounded-2xl border border-dashed border-white/12 bg-white/[0.02]" />
        </DashboardSection>
      </div>

      <NewWorkspaceModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={() => { setNewOpen(false); void loadWorkspaces(); }}
      />

      <RenameWorkspaceModal
        workspace={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={() => { setEditTarget(null); void loadWorkspaces(); }}
      />

<DeleteConfirmModal
        workspace={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => { setDeleteTarget(null); void loadWorkspaces(); }}
      />

      <JoinWorkspaceModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
};

function QuickActionCard({ title, description, icon: Icon, onClick, disabled = false }: QuickActionCardProps) {
  const baseClassName = "group flex h-24 w-full flex-col justify-between rounded-xl border border-white/10 bg-[#07111b]/90 p-4 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)]/40 hover:bg-[#0b1621] hover:shadow-[0_10px_24px_rgba(0,0,0,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b11]";

  if (disabled) {
    return (
      <div className={`${baseClassName} cursor-not-allowed opacity-70`} aria-disabled="true">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#08101c]/80 text-white/60">
            <Icon size={16} />
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white/85">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-white/55">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClassName} cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#08101c]/80 text-[var(--color-primary)]">
          <Icon size={16} />
        </span>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-white/60">{description}</p>
      </div>
    </button>
  );
}

function formatRelativeTime(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "Recently updated";

  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: new Date(timestamp).getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}
