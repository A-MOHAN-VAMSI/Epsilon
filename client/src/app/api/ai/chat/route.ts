import { NextResponse } from "next/server";
import { loadWorkspaceAiContext } from "@/lib/ai/context";
import { requestGeminiAssistant } from "@/lib/ai/gemini";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 6;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseRequestBody(body: unknown): {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  workspaceContext?: {
    id: string;
    name: string;
    activeFile?: { id: string; path: string; language: string; content?: string | null } | null;
    selection?: { selectedText: string; startLine: number; endLine: number } | null;
  } | null;
} {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const message = (body as Record<string, unknown>).message;
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("A valid non-empty message is required.");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error("The message is too long. Please shorten your prompt.");
  }

  const history = (body as Record<string, unknown>).history;
  if (history !== undefined && !Array.isArray(history)) {
    throw new Error("History must be an array.");
  }

  const parsedHistory = Array.isArray(history)
    ? history
        .slice(-MAX_HISTORY_ITEMS)
        .map((item) => {
          if (typeof item !== "object" || item === null) {
            throw new Error("Each history entry must be an object.");
          }

          const role = (item as Record<string, unknown>).role;
          const content = (item as Record<string, unknown>).content;

          if (role !== "user" && role !== "assistant") {
            throw new Error("Each history entry role must be 'user' or 'assistant'.");
          }
          if (typeof content !== "string" || !content.trim()) {
            throw new Error("Each history entry content must be a non-empty string.");
          }

          if (content.length > MAX_MESSAGE_LENGTH) {
            throw new Error("A history entry is too long.");
          }

          return { role: role as "user" | "assistant", content: content.trim() };
        })
    : [];

  const workspaceContext = (body as Record<string, unknown>).workspaceContext;
  if (workspaceContext !== undefined && workspaceContext !== null) {
    if (typeof workspaceContext !== "object" || workspaceContext === null) {
      throw new Error("workspaceContext must be an object or null.");
    }
    const id = (workspaceContext as Record<string, unknown>).id;
    const name = (workspaceContext as Record<string, unknown>).name;
    if (typeof id !== "string" || !id.trim() || typeof name !== "string" || !name.trim()) {
      throw new Error("workspaceContext must include a valid id and name.");
    }

    const rawActiveFile = (workspaceContext as Record<string, unknown>).activeFile;
    const rawSelection = (workspaceContext as Record<string, unknown>).selection;

    const activeFile: { id: string; path: string; language: string; content: string | null } | null =
      rawActiveFile !== undefined && rawActiveFile !== null && typeof rawActiveFile === "object"
        ? (() => {
            const activeFileRecord = rawActiveFile as Record<string, unknown>;
            const contentValue = activeFileRecord.content;
            return {
              id: asString(activeFileRecord.id),
              path: asString(activeFileRecord.path),
              language: asString(activeFileRecord.language, "plaintext"),
              content: typeof contentValue === "string" ? contentValue : null,
            } satisfies { id: string; path: string; language: string; content: string | null };
          })()
        : null;

    if (activeFile && (!activeFile.id || !activeFile.path)) {
      throw new Error("workspaceContext.activeFile must include valid id and path values.");
    }

    const selection: { selectedText: string; startLine: number; endLine: number } | null =
      rawSelection !== undefined && rawSelection !== null && typeof rawSelection === "object"
        ? {
            selectedText: asString((rawSelection as Record<string, unknown>).selectedText),
            startLine: asNumber((rawSelection as Record<string, unknown>).startLine),
            endLine: asNumber((rawSelection as Record<string, unknown>).endLine),
          }
        : null;

    return {
      message: message.trim(),
      history: parsedHistory,
      workspaceContext: {
        id: id.trim(),
        name: name.trim(),
        ...(activeFile ? { activeFile } : {}),
        ...(selection ? { selection } : {}),
      },
    };
  }

  return { message: message.trim(), history: parsedHistory };
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
    const authToken = await verifySupabaseAuth(request.headers.get("authorization"));

    const body = await request.json().catch(() => {
      throw new Error("Malformed JSON body.");
    });

    const { message, history, workspaceContext } = parseRequestBody(body);
    const resolvedWorkspaceContext = workspaceContext
      ? await loadWorkspaceAiContext({
          workspaceId: workspaceContext.id,
          accessToken: authToken,
          prompt: message,
          activeFile: workspaceContext.activeFile ?? null,
          selection: workspaceContext.selection ?? null,
        })
      : null;

    const normalizedWorkspaceContext = resolvedWorkspaceContext ?? {
      id: workspaceContext?.id ?? "",
      name: workspaceContext?.name ?? "",
      role: "viewer" as const,
      files: [],
      activeFile: workspaceContext?.activeFile ?? null,
      selection: workspaceContext?.selection ?? null,
      truncated: false,
    };

    const response = await requestGeminiAssistant(message, history, normalizedWorkspaceContext);
    return NextResponse.json({ assistantText: response.assistantText });
  } catch (error) {
    console.error("/api/ai/chat error:", error instanceof Error ? error.message : error);

    let status = 400;
    let message = "Something went wrong while generating the response.";

    if (error instanceof Error) {
        if (error.message === "Authentication is required." || error.message === "Authentication failed.") {
          status = 401;
          message = "Authentication is required to use EPSILON AI.";
        } else if (error.message === "Gemini API key is not configured.") {
          status = 503;
          message = "EPSILON AI is temporarily unavailable.";
        } else if (/workspace.*(denied|access)|workspace.*not accessible|not accessible to this user/i.test(error.message)) {
          status = 403;
          message = "This workspace is not available to your account.";
        } else if (/too long|valid non-empty message|malformed JSON|history must be an array|workspaceContext/.test(error.message)) {
          status = 400;
          message = error.message;
        } else if (/rate limit|quota|temporarily unavailable/i.test(error.message)) {
          status = 503;
          message = error.message;
        }
    }

    return NextResponse.json({ error: message }, { status });
  }
}
