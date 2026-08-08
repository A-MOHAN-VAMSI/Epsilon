/**
 * Strict, reusable types for the EPSILON AI editing milestone.
 *
 * These types describe the data exchanged between the Monaco editor, the
 * client-side AI service, and the server-side `/api/ai/editor` route.
 */

/** The predefined (and custom) editor AI actions. */
export type AIEditAction = "explain" | "fix" | "refactor" | "optimize" | "ask";

/**
 * A snapshot of the current Monaco selection.
 *
 * Lines and columns are 1-based to match Monaco's IRange convention.
 */
export type AISelectionContext = {
  selectedText: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

/** How a proposed AI edit should be applied. */
export type AIEditKind = "replace_selection" | "replace_file";

/**
 * The structured contract returned by the AI for code-changing actions.
 * `edit` is null for explanation-only responses (e.g. Explain).
 */
export type AIEditProposal = {
  explanation: string;
  edit: {
    type: AIEditKind;
    replacement: string;
  } | null;
};

/**
 * The full payload the editor sends to `/api/ai/editor`.
 * `activeFile.content` is the LIVE collaborative content (preferred over the
 * stale Supabase copy).
 */
export type AICodeEditRequest = {
  action: AIEditAction;
  /** Custom instruction for the "ask" action. */
  userRequest?: string;
  workspaceId: string;
  workspaceName: string;
  activeFile: {
    id: string;
    path: string;
    language: string;
    content: string;
  };
  selection: AISelectionContext | null;
};

/**
 * A proposal enriched with the base state captured when the request began.
 * Used for stale-edit protection and for rendering the diff preview.
 */
export type StoredAIProposal = {
  id: string;
  action: AIEditAction;
  explanation: string;
  editKind: AIEditKind | null;
  replacement: string;
  /** Live file content at the moment the request started. */
  baseContent: string;
  /** Selection at the moment the request started (non-null for replace_selection). */
  baseSelection: AISelectionContext | null;
  /** Hash of baseContent for fast whole-file staleness checks. */
  baseHash: string;
};
