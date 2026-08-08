import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import { getUserWorkspaces, type Workspace } from "@/lib/workspaceService";

type AIContextSelectorProps = {
  value: string;
  onChange: (workspace: Workspace | null) => void;
};

export default function AIContextSelector({ value, onChange }: AIContextSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const items = await getUserWorkspaces();
        if (!cancelled) {
          setWorkspaces(items);
        }
      } catch {
        if (!cancelled) {
          setWorkspaces([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#07111b]/80 px-3 py-3 text-sm text-white/60">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#08101c]/80 text-[var(--color-primary)]">
        <FolderOpen size={15} />
      </span>
      <span className="font-medium text-white/80">Context:</span>
      <select
        value={value}
        onChange={(event) => {
          const selected = workspaces.find((workspace) => workspace.id === event.target.value) ?? null;
          onChange(selected);
        }}
        className="rounded-xl border border-white/10 bg-[#0b1420] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--color-primary)]/50"
      >
        <option value="">No workspace selected</option>
        {loading ? (
          <option value="loading" disabled>
            Loading workspaces...
          </option>
        ) : (
          workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
