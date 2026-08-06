"use client";

import WorkspaceCard from "./WorkspaceCard";
import EmptyWorkspaces from "./EmptyWorkspaces";
import type { Workspace } from "@/lib/workspaceService";

type WorkspaceGridProps = {
  workspaces: Workspace[];
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  onCreate: () => void;
};

export default function WorkspaceGrid({ workspaces, onEdit, onDelete, onCreate }: WorkspaceGridProps) {
  if (workspaces.length === 0) {
    return <EmptyWorkspaces onCreate={onCreate} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
