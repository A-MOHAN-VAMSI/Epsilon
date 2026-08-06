"use client";

import { FileCode2, X } from "lucide-react";
import type { WorkspaceFile } from "@/lib/fileService";

type EditorTabsProps = {
  openFiles: WorkspaceFile[];
  activeFileId: string | null;
  dirtyIds: Set<string>;
  onSelect: (file: WorkspaceFile) => void;
  onClose: (file: WorkspaceFile) => void;
};

export default function EditorTabs({ openFiles, activeFileId, dirtyIds, onSelect, onClose }: EditorTabsProps) {
  if (openFiles.length === 0) return null;

  return (
    <div className="flex h-10 items-stretch overflow-x-auto border-b border-white/10 bg-[#0a0f16]">
      {openFiles.map((file) => {
        const active = file.id === activeFileId;
        const dirty = dirtyIds.has(file.id);
        return (
          <div
            key={file.id}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(file)}
            className={`group flex shrink-0 cursor-pointer items-center gap-2 border-r border-white/[0.07] px-3 text-xs transition-colors ${
              active
                ? "border-t-2 border-t-[var(--color-primary)] bg-[#0d141c] text-white"
                : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
            }`}
          >
            <FileCode2 size={13} className={active ? "text-[var(--color-primary)]" : "text-white/35"} />
            <span className="max-w-[140px] truncate">{file.name}</span>
            <button
              type="button"
              aria-label={`Close ${file.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onClose(file);
              }}
              className="rounded p-0.5 text-white/35 transition-colors hover:bg-white/10 hover:text-white"
            >
              {dirty ? <span className="block h-2 w-2 rounded-full bg-[var(--color-primary)]" /> : <X size={13} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
