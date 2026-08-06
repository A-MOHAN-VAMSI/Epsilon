"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileCode2, LoaderCircle } from "lucide-react";
import FileExplorer from "./FileExplorer";
import EditorTabs from "./EditorTabs";
import EditorStatusBar, { type SaveStatus } from "./EditorStatusBar";
import WorkspaceTopBar from "./WorkspaceTopBar";
import ConfirmDialog from "./ConfirmDialog";
import FileInputDialog from "./FileInputDialog";
import InviteModal from "./InviteModal";
import dynamic from "next/dynamic";

const CollaborativeEditor = dynamic(
  () => import("./CollaborativeEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <span>Loading editor...</span>
      </div>
    ),
  }
);
import {
  createFile,
  deleteFile,
  getWorkspaceFiles,
  renameFile,
  updateFileContent,
  type WorkspaceFile,
} from "@/lib/fileService";
import { languageFromFileName, languageLabel, starterFileForWorkspace } from "@/lib/fileLanguage";
import { collabRoomId, useCollabSession } from "@/lib/collabProvider";
import type { WorkspaceAccess } from "@/lib/workspaceService";

type WorkspaceEditorProps = {
  workspaceId: string;
  workspaceLanguage: string | null;
  workspaceName: string;
  userId: string;
  userName: string;
  /** Current user's role in this workspace (owner/editor/viewer). */
  role: WorkspaceAccess["role"];
  isOwner: boolean;
  onBack: () => void;
};

type DialogState =
  | { kind: "create-file"; parentId: string | null }
  | { kind: "create-folder"; parentId: string | null }
  | { kind: "rename"; file: WorkspaceFile }
  | null;

const AUTOSAVE_MS = 800;

export default function WorkspaceEditor({
  workspaceId,
  workspaceLanguage,
  workspaceName,
  userId,
  userName,
  role,
  isOwner,
  onBack,
}: WorkspaceEditorProps) {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [openFiles, setOpenFiles] = useState<WorkspaceFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });

  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogError, setDialogError] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceFile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

const activeFileIdRef = useRef<string | null>(null);
  const openFilesRef = useRef<WorkspaceFile[]>([]);
  const dirtyRef = useRef<Set<string>>(new Set());
  const saveInFlightRef = useRef(false);
  const canWriteRef = useRef(false);

  activeFileIdRef.current = activeFileId;
  openFilesRef.current = openFiles;
  dirtyRef.current = dirtyIds;

  // Editors/owners can modify files; viewers are read-only.
  const canWrite = role === "owner" || role === "editor";
  canWriteRef.current = canWrite;

  // ---- Load files on mount ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const items = await getWorkspaceFiles(workspaceId);
        if (cancelled) return;

        setFiles(items);
        const fileItems = items.filter((f) => f.type === "file");

        if (fileItems.length === 0 && canWriteRef.current) {
          // Only owners/editors may seed a fresh starter file (viewers are
          // read-only and RLS would reject the insert).
          const starter = starterFileForWorkspace(workspaceLanguage);
          const created = await createFile({
            workspaceId,
            name: starter.name,
            type: "file",
            language: starter.language,
            content: starter.content,
          });
          if (cancelled) return;
          setFiles([created]);
          setOpenFiles([created]);
          setActiveFileId(created.id);
          setSaveStatus("saved");
        } else {
          setFiles(items);
          const first = fileItems[0];
          if (first) {
            setOpenFiles([first]);
            setActiveFileId(first.id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Could not load workspace files.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, workspaceLanguage]);

  // ---- Active file ----
  const activeFile = openFiles.find((f) => f.id === activeFileId) ?? null;
  const activeLanguage = activeFile ? languageFromFileName(activeFile.name) : "plaintext";
  const activeLanguageLabel = activeFile ? languageLabel(activeFile.name, workspaceLanguage) : "Plain Text";

  // ---- Collaboration session for the active file ----
  const collabEnabled = !!activeFile && !loading;
  const initialContent = activeFile?.content ?? "";

const handleRemoteUpdate = useCallback(
    (content: string) => {
      // Viewers are read-only and must not write to Supabase (RLS would reject
      // the update and surface a spurious "Save failed"). Only owners/editors
      // persist the collaborative document.
      if (!canWriteRef.current) return;
      if (!activeFileIdRef.current) return;
      const fileId = activeFileIdRef.current;
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.add(fileId);
        return next;
      });
      setSaveStatus("dirty");
      schedulePersist(fileId, content);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

const collabSession = useCollabSession({
    workspaceId,
    fileId: activeFile?.id ?? "",
    userName,
    userId,
    enabled: collabEnabled,
    initialContent,
    canWrite: role === "owner" || role === "editor",
    onRemoteUpdate: handleRemoteUpdate,
  });

  // ---- Persistence (debounced) ----
  const persistRef = useRef<Map<string, string>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePersist = (fileId: string, content: string) => {
    persistRef.current.set(fileId, content);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persistNow();
    }, AUTOSAVE_MS);
  };

const persistNow = useCallback(async () => {
    if (saveInFlightRef.current) return;
    // Viewers are read-only — never write to Supabase (RLS would reject it).
    if (!canWriteRef.current) return;
    const fileId = activeFileIdRef.current;
    if (!fileId) return;
    const content = persistRef.current.get(fileId);
    if (content === undefined) return;

    saveInFlightRef.current = true;
    setSaveStatus("saving");
    try {
      await updateFileContent(fileId, content);
      // Update the in-memory file content so refresh returns latest.
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, content } : f))
      );
      setOpenFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, content } : f))
      );
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      saveInFlightRef.current = false;
    }
  }, []);

  // Ctrl/Cmd+S immediate save of the collaborative document.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        const id = activeFileIdRef.current;
        if (id) {
          const content = collabSession?.text.toString() ?? "";
          persistRef.current.set(id, content);
          void persistNow();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [collabSession, persistNow]);

  // ---- File selection ----
  function selectFile(file: WorkspaceFile) {
    setActiveFileId(file.id);
    setOpenFiles((prev) => (prev.some((f) => f.id === file.id) ? prev : [...prev, file]));
  }

  function closeTab(file: WorkspaceFile) {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.id !== file.id);
      if (activeFileIdRef.current === file.id && next.length > 0) {
        setActiveFileId(next[next.length - 1].id);
      }
      return next;
    });
  }

  // ---- Create file / folder ----
  async function submitCreate(kind: "file" | "folder", name: string, parentId: string | null) {
    setDialogLoading(true);
    setDialogError("");
    try {
      const starter = kind === "file" ? starterFileForWorkspace(workspaceLanguage) : null;
      const created = await createFile({
        workspaceId,
        parentId,
        name,
        type: kind,
        language: kind === "file" ? languageFromFileName(name) : null,
        content: kind === "file" ? starter?.content ?? "" : null,
      });
      setFiles((prev) => [...prev, created]);

      if (kind === "file") {
        setOpenFiles((prev) => [...prev, created]);
        setActiveFileId(created.id);
      }
      setDialog(null);
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Could not create the item.");
    } finally {
      setDialogLoading(false);
    }
  }

  // ---- Rename ----
  async function submitRename(file: WorkspaceFile, name: string) {
    setDialogLoading(true);
    setDialogError("");
    try {
      const updated = await renameFile(file.id, name);
      if (updated) {
        setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        setOpenFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
      setDialog(null);
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Could not rename the item.");
    } finally {
      setDialogLoading(false);
    }
  }

  // ---- Delete ----
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteFile(deleteTarget.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id && f.parent_id !== deleteTarget.id));
      setOpenFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      if (activeFileIdRef.current === deleteTarget.id) {
        setActiveFileId(null);
      }
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ---- Render states ----
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-white/55" aria-busy="true">
        <LoaderCircle size={18} className="animate-spin text-[var(--color-primary)]" />
        <span className="ml-2">Loading workspace...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-sm text-red-300">{loadError}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isViewer = collabSession ? !collabSession.canWrite : false;

  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f16] shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
      <WorkspaceTopBar
        workspaceName={workspaceName}
        saveStatus={saveStatus}
        connectionStatus={collabSession?.connectionStatus ?? "connecting"}
        peers={collabSession?.peers ?? []}
        currentUser={{ name: userName, isOwner }}
        isViewer={isViewer}
        onBack={onBack}
        onInvite={() => setInviteOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
<FileExplorer
          files={files}
          activeFileId={activeFileId}
          readOnly={!canWrite}
          onSelectFile={selectFile}
          onCreateFile={(parentId) => { setDialogError(""); setDialog({ kind: "create-file", parentId }); }}
          onCreateFolder={(parentId) => { setDialogError(""); setDialog({ kind: "create-folder", parentId }); }}
          onRename={(file) => { setDialogError(""); setDialog({ kind: "rename", file }); }}
          onDelete={(file) => setDeleteTarget(file)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <EditorTabs
            openFiles={openFiles}
            activeFileId={activeFileId}
            dirtyIds={dirtyIds}
            onSelect={selectFile}
            onClose={closeTab}
          />

          <div className="relative min-h-0 flex-1">
            {activeFile && collabSession ? (
              <CollaborativeEditor
                key={`${activeFile.id}-${collabSession.roomId}`}
                session={collabSession}
                language={activeLanguage}
                path={`${workspaceId}/${activeFile.id}`}
                onCursorChange={(line, column) => setCursor({ line, column })}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/40">
                  <FileCode2 size={26} />
                </span>
                <p className="mt-4 text-sm font-medium text-white/60">Select a file to start editing</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-white/35">
                  Use the explorer to create or open files in this workspace.
                </p>
              </div>
            )}
          </div>

          <EditorStatusBar
            languageLabel={activeLanguageLabel}
            line={cursor.line}
            column={cursor.column}
            saveStatus={saveStatus}
            connectionStatus={collabSession?.connectionStatus ?? "connecting"}
          />
        </div>
      </div>

      {/* Create/rename dialogs */}
      <FileInputDialog
        open={dialog?.kind === "create-file"}
        title="New file"
        label="File name"
        placeholder="e.g. index.ts"
        submitLabel="Create"
        loading={dialogLoading}
        error={dialogError}
        onSubmit={(name) => {
          if (dialog?.kind === "create-file") submitCreate("file", name, dialog.parentId);
        }}
        onCancel={() => setDialog(null)}
      />
      <FileInputDialog
        open={dialog?.kind === "create-folder"}
        title="New folder"
        label="Folder name"
        placeholder="e.g. components"
        submitLabel="Create"
        loading={dialogLoading}
        error={dialogError}
        onSubmit={(name) => {
          if (dialog?.kind === "create-folder") submitCreate("folder", name, dialog.parentId);
        }}
        onCancel={() => setDialog(null)}
      />
      <FileInputDialog
        open={dialog?.kind === "rename"}
        title="Rename"
        label="New name"
        placeholder="New name"
        initialValue={dialog?.kind === "rename" ? dialog.file.name : ""}
        submitLabel="Rename"
        loading={dialogLoading}
        error={dialogError}
        onSubmit={(name) => {
          if (dialog?.kind === "rename") submitRename(dialog.file, name);
        }}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget?.type === "folder" ? "Delete folder" : "Delete file"}
        message={
          deleteTarget?.type === "folder"
            ? `Delete "${deleteTarget?.name}" and all of its contents? This cannot be undone.`
            : `Delete "${deleteTarget?.name}"? This cannot be undone.`
        }
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <InviteModal
        open={inviteOpen}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}
