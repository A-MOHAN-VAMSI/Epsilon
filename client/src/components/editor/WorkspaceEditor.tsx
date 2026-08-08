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

import EditorAIActionBar from "./EditorAIActionBar";
import EditorAIPanel, { type EditorAIPanelState } from "./EditorAIPanel";
import RunButton from "./RunButton";
import ExecutionPanel from "./ExecutionPanel";
import type { AIEditAction, AISelectionContext, StoredAIProposal } from "@/lib/ai/editorTypes";
import { buildStoredProposal, isProposalStale, requestEditorAI } from "@/lib/ai/aiEditService";
import { detectExecutionLanguage, type ExecutionRunMetadata } from "@/lib/execution/executionTypes";
import { runExecution } from "@/lib/execution/executionService";

const CollaborativeEditor = dynamic(() => import("./CollaborativeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <span>Loading editor...</span>
    </div>
  ),
});

import {
  createFile,
  deleteFile,
  getWorkspaceFiles,
  renameFile,
  updateFileContent,
  type WorkspaceFile,
} from "@/lib/fileService";
import { languageFromFileName, languageLabel, starterFileForWorkspace } from "@/lib/fileLanguage";
import { useCollabSession } from "@/lib/collabProvider";
import type { WorkspaceAccess } from "@/lib/workspaceService";
import type { EditorApplyInput } from "./CollaborativeEditor";

type WorkspaceEditorProps = {
  workspaceId: string;
  workspaceLanguage: string | null;
  workspaceName: string;
  initialFileId?: string | null;
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
  initialFileId,
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

  // ---- AI editing state ----
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [aiPanelState, setAIPanelState] = useState<EditorAIPanelState>({ kind: "idle" });
  const [selection, setSelection] = useState<AISelectionContext | null>(null);
  const [aiGenerating, setAIGenerating] = useState(false);
  const generationRef = useRef(false);
  const lastProposalRef = useRef<StoredAIProposal | null>(null);
  const generateTokenRef = useRef<string | null>(null);
  const lastActionRef = useRef<AIEditAction | null>(null);
  const lastRequestRef = useRef<string | undefined>(undefined);

  const editorApiRef = useRef<{
    getEditor: () => unknown;
    getLiveContent: () => string;
    getSelection: () => AISelectionContext | null;
    applyAISelectionEdit: (input: EditorApplyInput) => void;
    applyAIWholeFileEdit: (input: EditorApplyInput) => void;
  } | null>(null);

  // ---- Execution state ----
  const [executionRuns, setExecutionRuns] = useState<ExecutionRunMetadata[]>([]);
  const [executionRunning, setExecutionRunning] = useState(false);
  const [executionPanelOpen, setExecutionPanelOpen] = useState(false);
  const cancelExecutionRef = useRef(false);
  const execRunIdRef = useRef(0);

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

  useEffect(() => {
    if (!initialFileId) return;

    const target = files.find((file) => file.id === initialFileId && file.type === "file");
    if (!target) return;

    setActiveFileId(target.id);
    setOpenFiles((prev) => (prev.some((file) => file.id === target.id) ? prev : [...prev, target]));
  }, [files, initialFileId]);

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
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, content } : f)));
      setOpenFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, content } : f)));
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
      const trimmedName = name.trim();
      await renameFile(file.id, trimmedName);
      setFiles((prev) => prev.map((item) => (item.id === file.id ? { ...item, name: trimmedName } : item)));
      setOpenFiles((prev) => prev.map((item) => (item.id === file.id ? { ...item, name: trimmedName } : item)));
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

  // ---- AI editing handlers ----
function handleSelectionChange(sel: AISelectionContext | null) {
    setSelection(sel);
    // If the user changes selection while a proposal exists, clear it so they
    // don't accidentally accept against a stale/incorrect target.
    if (sel && lastProposalRef.current) {
      lastProposalRef.current = null;
      setAIPanelState({ kind: "idle" });
    }
  }

  function closeAIPanel() {
    setAIPanelOpen(false);
  }

  async function runAIAction(action: AIEditAction, customRequest?: string) {
    if (generationRef.current) return;
    if (!activeFile || !collabSession) {
      setAIPanelOpen(true);
      setAIPanelState({ kind: "error", message: "Open a file before using EPSILON AI." });
      return;
    }
    if (!canWriteRef.current && action !== "explain") {
      setAIPanelOpen(true);
      setAIPanelState({ kind: "error", message: "Viewers can only request explanations." });
      return;
    }

    generationRef.current = true;
    setAIGenerating(true);
    setAIPanelOpen(true);
    lastActionRef.current = action;
    lastRequestRef.current = customRequest;
    setAIPanelState({ kind: "generating", action });

    const token = Math.random().toString(36).slice(2);
    generateTokenRef.current = token;

    const liveContent = editorApiRef.current?.getLiveContent() ?? collabSession.text.toString();
    const currentSelection = editorApiRef.current?.getSelection() ?? selection ?? null;

    try {
      const proposal = await requestEditorAI({
        action,
        userRequest: customRequest,
        workspaceId,
        workspaceName,
        activeFile: {
          id: activeFile.id,
          path: activeFile.name,
          language: activeLanguage,
          content: liveContent,
        },
        selection: currentSelection,
      });

      if (generateTokenRef.current !== token) return; // superseded

      const stored = buildStoredProposal({
        action,
        explanation: proposal.explanation,
        editKind: proposal.editKind,
        replacement: proposal.replacement,
        baseContent: liveContent,
        baseSelection: currentSelection,
      });
      lastProposalRef.current = stored;

      if (!proposal.editKind) {
        // Explanation-only response.
        setAIPanelState({ kind: "explanation", explanation: proposal.explanation });
        return;
      }

      setAIPanelState({ kind: "proposal", proposal: stored });
    } catch (err) {
      if (generateTokenRef.current !== token) return;
      const message =
        err instanceof Error ? err.message : "EPSILON AI could not generate a suggestion.";
      setAIPanelState({ kind: "error", message });
    } finally {
      if (generateTokenRef.current === token) {
        generationRef.current = false;
        setAIGenerating(false);
      }
    }
  }

  function rejectProposal() {
    lastProposalRef.current = null;
    setAIPanelState({ kind: "idle" });
  }

  function regenerateProposal() {
    const action = lastActionRef.current;
    if (!action) return;
    void runAIAction(action, lastRequestRef.current);
  }

  function acceptProposal(proposal: StoredAIProposal) {
    const editorApi = editorApiRef.current;
    if (!proposal || !editorApi || !collabSession) return;

    // Viewers must never apply edits (client-side guard; server also enforces).
    if (!canWriteRef.current) {
      setAIPanelState({ kind: "error", message: "Viewers cannot apply AI edits." });
      return;
    }

    const liveContent = editorApi.getLiveContent();
    const currentSelection = editorApi.getSelection();

    // Stale-edit protection: verify the base state still matches.
    if (isProposalStale(proposal, liveContent, currentSelection)) {
      setAIPanelState({
        kind: "stale",
        message:
          "This code changed while EPSILON AI was generating the suggestion. Review the latest version before applying.",
      });
      return;
    }

    if (proposal.editKind === "replace_selection" && proposal.baseSelection) {
      editorApi.applyAISelectionEdit({
        text: collabSession.text,
        kind: "replace_selection",
        replacement: proposal.replacement,
        selection: proposal.baseSelection,
      });
    } else if (proposal.editKind === "replace_file") {
      editorApi.applyAIWholeFileEdit({
        text: collabSession.text,
        kind: "replace_file",
        replacement: proposal.replacement,
        selection: null,
      });
    }

    lastProposalRef.current = null;
    setAIPanelState({ kind: "applied" });

    // Schedule persistence through the existing debounced pipeline.
    const id = activeFileIdRef.current;
    if (id) {
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
setSaveStatus("dirty");
      schedulePersist(id, collabSession.text.toString());
    }
  }

  // ---- Execution handlers ----
  async function handleRun() {
    if (!activeFile || !collabSession) {
      setExecutionPanelOpen(true);
      setExecutionRuns((prev) => [
        ...prev,
        {
          fileId: "",
          filename: "No active file",
          language: "",
          status: "unsupported",
          result: null,
          errorMessage: "Open a file before running code.",
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    const lang = detectExecutionLanguage(activeFile.name);
    if (!lang) {
      setExecutionPanelOpen(true);
      setExecutionRuns((prev) => [
        ...prev,
        {
          fileId: activeFile.id,
          filename: activeFile.name,
          language: "",
          status: "unsupported",
          result: null,
          errorMessage: "Execution is not currently supported for this language.",
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    if (executionRunning) {
      // Stop current execution.
      cancelExecutionRef.current = true;
      return;
    }

// Read the LIVE collaborative content (never the stale Supabase copy).
    const liveContent = editorApiRef.current?.getLiveContent() ?? collabSession.text.toString();

    cancelExecutionRef.current = false;
    setExecutionRunning(true);
    setExecutionPanelOpen(true);

    const runId = ++execRunIdRef.current;
    const timestamp = Date.now();

    setExecutionRuns((prev) => [
      ...prev,
      {
        fileId: activeFile.id,
        filename: activeFile.name,
        language: lang,
        status: "running",
        result: null,
        errorMessage: "",
        timestamp,
      },
    ]);

    try {
      const result = await runExecution({
        workspaceId,
        fileId: activeFile.id,
        filename: activeFile.name,
        language: lang,
        content: liveContent,
      });

      if (execRunIdRef.current !== runId) return; // newer run superseded this one

      setExecutionRuns((prev) =>
        prev.map((run) =>
          run.timestamp === timestamp
            ? { ...run, status: result.status, result }
            : run
        )
      );
    } catch (err) {
      if (execRunIdRef.current !== runId) return;
      const message =
        err instanceof Error ? err.message : "Something went wrong while executing the code.";
      setExecutionRuns((prev) =>
        prev.map((run) =>
          run.timestamp === timestamp
            ? { ...run, status: "error", errorMessage: message }
            : run
        )
      );
    } finally {
      if (execRunIdRef.current === runId) {
        setExecutionRunning(false);
        cancelExecutionRef.current = false;
      }
    }
  }

  function handleClearOutput() {
    setExecutionRuns([]);
  }

  function handleCloseOutput() {
    setExecutionPanelOpen(false);
  }

  function handleFixWithAI(run: ExecutionRunMetadata) {
    if (!activeFile || !collabSession) return;
    // Reuse the existing editor AI architecture with a Fix action, passing the
    // runtime error as the custom instruction so Gemini diagnoses it.
    const stderr = run.result?.stderr ?? "";
    const stdout = run.result?.stdout ?? "";
    const exitCode = run.result?.exitCode ?? null;
    const instruction = [
      "The following code produced a runtime error when executed.",
      run.filename ? `File: ${run.filename}` : "",
      run.language ? `Language: ${run.language}` : "",
      exitCode !== null ? `Exit code: ${exitCode}` : "",
      run.result?.timedOut ? "Status: timed out" : "",
      stderr ? `--- stderr ---\n${stderr}` : "",
      stdout ? `--- stdout ---\n${stdout}` : "",
      "Diagnose the failure and propose a corrected version of the file.",
    ]
      .filter(Boolean)
      .join("\n");

    setAIPanelOpen(true);
    void runAIAction("fix", instruction);
  }

  // Ctrl/Cmd+Enter to run/stop the active file.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "enter") {
        // Only trigger when the editor is focused to avoid hijacking inputs.
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) return;
        event.preventDefault();
        void handleRun();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionRunning, activeFile, collabSession]);

  // ---- Render states ----
  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center text-sm text-white/55"
        aria-busy="true"
      >
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
          onCreateFile={(parentId) => {
            setDialogError("");
            setDialog({ kind: "create-file", parentId });
          }}
          onCreateFolder={(parentId) => {
            setDialogError("");
            setDialog({ kind: "create-folder", parentId });
          }}
          onRename={(file) => {
            setDialogError("");
            setDialog({ kind: "rename", file });
          }}
          onDelete={(file) => setDeleteTarget(file)}
        />

<div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center border-b border-white/10">
            <EditorTabs
              openFiles={openFiles}
              activeFileId={activeFileId}
              dirtyIds={dirtyIds}
              onSelect={selectFile}
              onClose={closeTab}
            />
            <div className="ml-auto flex shrink-0 items-center gap-2 px-2">
              <RunButton
                running={executionRunning}
                disabled={!canWrite}
                supported={activeFile ? detectExecutionLanguage(activeFile.name) !== null : false}
                onClick={() => void handleRun()}
              />
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1">
            <div className="relative min-w-0 flex-1">
              {activeFile && collabSession ? (
                <CollaborativeEditor
                  key={`${activeFile.id}-${collabSession.roomId}`}
                  session={collabSession}
                  language={activeLanguage}
                  path={`${workspaceId}/${activeFile.id}`}
                  onCursorChange={(line, column) => setCursor({ line, column })}
                  onSelectionChange={handleSelectionChange}
                  editorApiRef={editorApiRef}
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

              {activeFile && collabSession ? (
                <EditorAIActionBar
                  hasSelection={!!selection}
                  canWrite={canWrite}
                  disabled={aiGenerating}
                  onAction={(action, request) => void runAIAction(action, request)}
                />
              ) : null}
            </div>

            {aiPanelOpen && activeFile && collabSession ? (
              <div className="w-[420px] max-w-[45%] shrink-0">
                <EditorAIPanel
                  open={aiPanelOpen}
                  state={aiPanelState}
                  filePath={activeFile.name}
                  language={activeLanguage}
                  canWrite={canWrite}
                  onAccept={acceptProposal}
                  onReject={rejectProposal}
                  onRegenerate={regenerateProposal}
                  onClose={closeAIPanel}
                />
              </div>
            ) : null}
          </div>

<EditorStatusBar
            languageLabel={activeLanguageLabel}
            line={cursor.line}
            column={cursor.column}
            saveStatus={saveStatus}
            connectionStatus={collabSession?.connectionStatus ?? "connecting"}
          />

          {executionPanelOpen ? (
            <ExecutionPanel
              runs={executionRuns}
              running={executionRunning}
              onClear={handleClearOutput}
              onClose={handleCloseOutput}
              onFixWithAI={handleFixWithAI}
            />
          ) : null}
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
