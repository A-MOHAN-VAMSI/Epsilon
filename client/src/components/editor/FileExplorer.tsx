"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { WorkspaceFile } from "@/lib/fileService";
import { languageFromFileName } from "@/lib/fileLanguage";

type FileExplorerProps = {
  files: WorkspaceFile[];
  activeFileId: string | null;
  /** When true, hide create/rename/delete controls (viewer role). */
  readOnly?: boolean;
  onSelectFile: (file: WorkspaceFile) => void;
  onCreateFile: (parentId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRename: (file: WorkspaceFile) => void;
  onDelete: (file: WorkspaceFile) => void;
};

const fileIconColor = (name: string) => {
  const lang = languageFromFileName(name);
  const colors: Record<string, string> = {
    javascript: "#f7df1e",
    typescript: "#4FC3F7",
    python: "#4B8BBE",
    java: "#E76F00",
    cpp: "#659AD2",
    c: "#659AD2",
    json: "#4FC3F7",
    html: "#e34c26",
    css: "#2965f1",
    markdown: "#9ca3af",
    sql: "#e38c00",
  };
  return colors[lang] ?? "#9ca3af";
};

function buildTree(files: WorkspaceFile[]): (WorkspaceFile & { children: TreeItem[] })[] {
  type TreeItem = WorkspaceFile & { children: TreeItem[] };
  const map = new Map<string, TreeItem>();
  const roots: TreeItem[] = [];

  for (const file of files) {
    map.set(file.id, { ...file, children: [] });
  }
  for (const file of files) {
    const node = map.get(file.id)!;
    if (file.parent_id && map.has(file.parent_id)) {
      map.get(file.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function sortTree(nodes: TreeItem[]): TreeItem[] {
  return [...nodes].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "folder" ? -1 : 1;
  });
}

type TreeItem = WorkspaceFile & { children: TreeItem[] };

export default function FileExplorer({
  files,
  activeFileId,
  readOnly = false,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}: FileExplorerProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const tree = useMemo(() => sortTree(buildTree(files)), [files]);

  function toggleFolder(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderNode(node: TreeItem, depth: number) {
    const isFolder = node.type === "folder";
    const isCollapsed = collapsed.has(node.id);
    const isActive = node.id === activeFileId;

    return (
      <div key={node.id}>
        <div
          className={`group relative flex cursor-pointer items-center gap-1.5 rounded-md py-[3px] pr-1 text-[12.5px] transition-colors hover:bg-white/[0.05] ${
            isActive ? "bg-[var(--color-primary)]/10 text-white" : "text-white/60"
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          onClick={() => {
            if (isFolder) toggleFolder(node.id);
            else onSelectFile(node);
          }}
        >
          {isFolder ? (
            <>
              {isCollapsed ? (
                <ChevronRight size={13} className="shrink-0 text-white/35" />
              ) : (
                <ChevronDown size={13} className="shrink-0 text-white/35" />
              )}
              {isCollapsed ? (
                <Folder size={14} className="shrink-0 text-[var(--color-primary)]/80" />
              ) : (
                <FolderOpen size={14} className="shrink-0 text-[var(--color-primary)]/80" />
              )}
            </>
          ) : (
            <>
              <span className="w-[13px] shrink-0" />
              <FileCode2 size={14} className="shrink-0" style={{ color: fileIconColor(node.name) }} />
            </>
          )}
<span className="truncate">{node.name}</span>

          {!readOnly && (
            <div className="ml-auto hidden items-center gap-0.5 group-hover:flex">
              <button
                type="button"
                aria-label={`New file in ${node.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onCreateFile(node.id);
                }}
                className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <FilePlus2 size={13} />
              </button>
              <button
                type="button"
                aria-label={`New folder in ${node.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onCreateFolder(node.id);
                }}
                className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <FolderPlus size={13} />
              </button>
              <button
                type="button"
                aria-label={`Actions for ${node.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuFor(menuFor === node.id ? null : node.id);
                }}
                className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <MoreHorizontal size={13} />
              </button>
            </div>
          )}

          {!readOnly && menuFor === node.id && (
            <div
              className="absolute right-1 top-full z-20 min-w-[140px] overflow-hidden rounded-lg border border-white/10 bg-[#0d141c] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => { onRename(node); setMenuFor(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white"
              >
                <Pencil size={13} /> Rename
              </button>
              <button
                type="button"
                onClick={() => { onDelete(node); setMenuFor(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>

        {isFolder && !isCollapsed && node.children.length > 0 && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#0a0f16]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-3">
<span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">Explorer</span>
        {!readOnly && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="New file"
              onClick={() => onCreateFile(null)}
              className="rounded p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
            >
              <FilePlus2 size={14} />
            </button>
            <button
              type="button"
              aria-label="New folder"
              onClick={() => onCreateFolder(null)}
              className="rounded p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-white/35">
            No files yet.
            <br />
            Create one to get started.
          </div>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>
    </aside>
  );
}
