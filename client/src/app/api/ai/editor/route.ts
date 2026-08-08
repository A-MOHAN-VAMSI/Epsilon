import { NextResponse } from "next/server";
import { loadWorkspaceAiContext } from "@/lib/ai/context";
import { requestGeminiEditor } from "@/lib/ai/gemini";
import type {
  AIEditAction,
  AIEditProposal,
  AIEditKind,
  AISelectionContext,
} from "@/lib/ai/editorTypes";

const MAX_USER_REQUEST = 2000;
const MAX_FILE_CHARS = 60000;
const VALID_ACTIONS = new Set<AIEditAction>(["explain", "fix", "refactor", "optimize", "ask"]);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asPositiveNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function parseSelection(raw: unknown): AISelectionContext | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;

  const selectedText = asString(record.selectedText);
  const startLine = asPositiveNumber(record.startLine);
  const startColumn = asPositiveNumber(record.startColumn);
  const endLine = asPositiveNumber(record.endLine);
  const endColumn = asPositiveNumber(record.endColumn);

  if (!selectedText || startLine < 1 || startColumn < 1 || endLine < 1 || endColumn < 1) {
    throw new Error("The selection is invalid.");
  }

  return { selectedText, startLine, startColumn, endLine, endColumn };
}

function parseRequestBody(body: unknown): {
  action: AIEditAction;
  userRequest?: string;
  workspaceId: string;
  workspaceName: string;
  activeFile: { id: string; path: string; language: string; content: string };
  selection: AISelectionContext | null;
} | null {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const record = body as Record<string, unknown>;

const rawAction = record.action;
  if (typeof rawAction !== "string" || !VALID_ACTIONS.has(rawAction as AIEditAction)) {
    throw new Error("A valid AI action is required.");
  }
  const action = rawAction as AIEditAction;

  const workspaceId = asString(record.workspaceId).trim();
  const workspaceName = asString(record.workspaceName).trim();
  if (!workspaceId || !workspaceName) {
    throw new Error("Workspace id and name are required.");
  }

  const rawActiveFile = record.activeFile;
  if (typeof rawActiveFile !== "object" || rawActiveFile === null) {
    throw new Error("An active file is required.");
  }
  const activeFileRecord = rawActiveFile as Record<string, unknown>;
  const activeFile = {
    id: asString(activeFileRecord.id),
    path: asString(activeFileRecord.path),
    language: asString(activeFileRecord.language, "plaintext"),
    content: asString(activeFileRecord.content),
  };
  if (!activeFile.id || !activeFile.path) {
    throw new Error("Active file must include valid id and path values.");
  }
  if (activeFile.content.length > MAX_FILE_CHARS) {
    throw new Error("The active file is too large for an AI edit.");
  }

  const userRequest = asString(record.userRequest).trim();
  if (action === "ask" && !userRequest) {
    throw new Error("A custom instruction is required for the Ask AI action.");
  }
  if (userRequest.length > MAX_USER_REQUEST) {
    throw new Error("The custom instruction is too long.");
  }

  const selection = parseSelection(record.selection);

  return {
    action,
    ...(userRequest ? { userRequest } : {}),
    workspaceId,
    workspaceName,
    activeFile,
    selection,
  };
}

async function verifySupabaseAuth(authorization: string | null) {
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new Error("Authentication is required.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase authentication is not configured.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Authentication failed.");
  }

  return token;
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate (server-side).
    const authToken = await verifySupabaseAuth(request.headers.get("authorization"));

    // 2. Validate the request body strictly.
    const body = await request.json().catch(() => {
      throw new Error("Malformed JSON body.");
    });
    const parsed = parseRequestBody(body);
    if (!parsed) {
      throw new Error("Invalid request payload.");
    }

    // 3. Reuse the existing workspace-aware context builder. The LIVE
    //    active-file content is passed explicitly so it overrides the stale
    //    Supabase copy and is not duplicated.
    const resolvedContext = await loadWorkspaceAiContext({
      workspaceId: parsed.workspaceId,
      accessToken: authToken,
      prompt: parsed.userRequest ?? `Perform the ${parsed.action} action.`,
      activeFile: {
        id: parsed.activeFile.id,
        path: parsed.activeFile.path,
        language: parsed.activeFile.language,
        content: parsed.activeFile.content,
      },
      selection: parsed.selection
        ? {
            selectedText: parsed.selection.selectedText,
            startLine: parsed.selection.startLine,
            endLine: parsed.selection.endLine,
          }
        : null,
    });

    // The server re-derives the role from the workspace/membership. If the
    // user is a viewer, they may only request Explain (read-only).
    if (resolvedContext.role === "viewer" && parsed.action !== "explain") {
      throw new Error(
        "Viewers can only request explanations. Editing requires an owner or editor role."
      );
    }

    // 4. Ask Gemini for a structured proposal.
    const proposal: AIEditProposal = await requestGeminiEditor(
      resolvedContext,
      parsed.action,
      parsed.userRequest,
      parsed.selection
    );

    // 5. Validate the returned edit kind against the request context.
    if (proposal.edit) {
      if (parsed.selection && proposal.edit.type !== "replace_selection") {
        throw new Error("Gemini returned an invalid edit type for a selection.");
      }
      if (!parsed.selection && proposal.edit.type !== "replace_file") {
        throw new Error("Gemini returned an invalid edit type for a whole-file change.");
      }
    }

    const editKind: AIEditKind | null = proposal.edit?.type ?? null;
    const replacement = proposal.edit?.replacement ?? "";

    return NextResponse.json({
      explanation: proposal.explanation,
      editKind,
      replacement,
    });
  } catch (error) {
    console.error("/api/ai/editor error:", error instanceof Error ? error.message : error);

    let status = 400;
    let message = "Something went wrong while generating the AI edit.";

    if (error instanceof Error) {
      if (
        error.message === "Authentication is required." ||
        error.message === "Authentication failed."
      ) {
        status = 401;
        message = "Authentication is required to use EPSILON AI.";
      } else if (error.message === "Gemini API key is not configured.") {
        status = 503;
        message = "EPSILON AI is temporarily unavailable.";
      } else if (/viewer/i.test(error.message)) {
        status = 403;
        message = error.message;
      } else if (
        /workspace.*(denied|access)|workspace.*not accessible|not accessible to this user/i.test(
          error.message
        )
      ) {
        status = 403;
        message = "This workspace is not available to your account.";
      } else if (/rate limit|quota|temporarily unavailable/i.test(error.message)) {
        status = 503;
        message = error.message;
      } else if (
        /invalid|missing|required|too large|too long|malformed|selection/i.test(error.message)
      ) {
        status = 400;
        message = error.message;
      }
    }

    return NextResponse.json({ error: message }, { status });
  }
}
