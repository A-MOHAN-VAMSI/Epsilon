import { getWorkspaceFiles, type WorkspaceFile } from "./fileService";
import { getUserWorkspaces } from "./workspaceService";

export type RecentActivityItem = {
  id: string;
  kind: "workspace" | "file";
  action: "created" | "updated";
  title: string;
  subtitle: string;
  timestamp: string;
  workspaceId: string;
  fileId?: string | null;
};

function classifyActivity(createdAt: string, updatedAt: string): "created" | "updated" {
  const createdMs = new Date(createdAt).getTime();
  const updatedMs = new Date(updatedAt).getTime();

  if (Number.isNaN(createdMs) || Number.isNaN(updatedMs)) {
    return "updated";
  }

  return updatedMs - createdMs <= 60_000 ? "created" : "updated";
}

export async function getRecentActivity(limit = 8): Promise<RecentActivityItem[]> {
  const workspaces = await getUserWorkspaces();
  if (!workspaces.length) return [];

  const activity = await Promise.all(
    workspaces.map(async (workspace) => {
      const workspaceAction = classifyActivity(workspace.created_at, workspace.updated_at);
      const workspaceItem: RecentActivityItem = {
        id: `workspace-${workspace.id}`,
        kind: "workspace",
        action: workspaceAction,
        title: `${workspace.name} ${workspaceAction}`,
        subtitle: "Workspace",
        timestamp: workspace.updated_at,
        workspaceId: workspace.id,
      };

      const files = await getWorkspaceFiles(workspace.id);
      const fileItems: RecentActivityItem[] = files
        .filter((file: WorkspaceFile) => file.type === "file")
        .map((file) => {
          const action = classifyActivity(file.created_at, file.updated_at);
          return {
            id: `file-${file.id}`,
            kind: "file",
            action,
            title: `${file.name} ${action}`,
            subtitle: workspace.name,
            timestamp: file.updated_at,
            workspaceId: workspace.id,
            fileId: file.id,
          } satisfies RecentActivityItem;
        });

      return [workspaceItem, ...fileItems];
    })
  );

  return activity
    .flat()
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, limit);
}
