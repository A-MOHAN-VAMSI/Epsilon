"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardSection from "./DashboardSection";
import DashboardHeader from "./DashboardHeader";
import WorkspaceGrid from "./WorkspaceGrid";
import NewWorkspaceModal from "./NewWorkspaceModal";
import RenameWorkspaceModal from "./RenameWorkspaceModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import JoinWorkspaceModal from "./JoinWorkspaceModal";
import { getUserWorkspaces } from "@/lib/workspaceService";
import type { Workspace } from "@/lib/workspaceService";

type DashboardLayoutProps = {
  name: string;
};

export default function DashboardLayout({ name }: DashboardLayoutProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  function openNew() {
    setNewOpen(true);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 pb-20 lg:space-y-10 lg:pb-0">
<DashboardHeader name={name} onCreateWorkspace={openNew} onJoinWorkspace={() => setJoinOpen(true)} />

      <DashboardSection title="Quick Actions" description="Jump into your next task.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 rounded-xl border border-dashed border-white/12 bg-white/[0.02] transition-colors hover:border-[var(--color-primary)]/35 hover:bg-[var(--color-primary)]/[0.025]" />)}
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
          <div className="h-56 rounded-2xl border border-dashed border-white/12 bg-white/[0.02]" />
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
