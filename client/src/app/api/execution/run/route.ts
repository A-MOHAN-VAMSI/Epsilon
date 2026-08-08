import { NextResponse } from "next/server";
import {
  runCode,
  MAX_SOURCE_BYTES,
} from "@/lib/execution/executionRunner";
import type { ExecutionLanguage, ExecutionResult } from "@/lib/execution/executionTypes";

/** Maximum request body we are willing to parse (source + overhead). */
const MAX_BODY_BYTES = MAX_SOURCE_BYTES + 16 * 1024;

const ALLOWED_LANGUAGES: readonly ExecutionLanguage[] = ["javascript", "python"];

type ErrorResponse = {
  error: string;
};

function errorResponse(message: string, status: number): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Verify the Supabase session and return the access token, or throw.
 */
async function verifySupabaseAuth(authorization: string | null): Promise<string> {
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new AuthError("Authentication is required.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthError("Execution service is not configured.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new AuthError("Authentication failed.");
  }

  return token;
}

class AuthError extends Error {}

/**
 * Look up the workspace owner and the user's role. Returns only a boolean
 * indicating whether the user may execute (owner or editor). Viewers are NOT
 * allowed to execute code (read-only policy, matching the collaboration
 * server's read-only enforcement), and non-members are denied.
 */
async function resolveExecutionPermission(
  workspaceId: string,
  accessToken: string
): Promise<{ allowed: boolean }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { allowed: false };
  }

  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
  };

  // Resolve the authenticated user id.
  const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, { headers });
  if (!userResp.ok) return { allowed: false };
  const userPayload = (await userResp.json()) as { id?: string };
  const userId = userPayload.id;
  if (!userId) return { allowed: false };

  // Ownership is authoritative.
  const wsResp = await fetch(
    `${supabaseUrl}/rest/v1/workspaces?select=owner_id&id=eq.${encodeURIComponent(workspaceId)}&limit=1`,
    { headers }
  );
  if (!wsResp.ok) return { allowed: false };
  const wsRows = (await wsResp.json()) as Array<{ owner_id?: string }>;
  const ws = wsRows[0];
  if (!ws) return { allowed: false };
  if (ws.owner_id === userId) return { allowed: true };

  // Otherwise check membership role.
  const memberResp = await fetch(
    `${supabaseUrl}/rest/v1/workspace_members?select=role&workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    { headers }
  );
  if (!memberResp.ok) return { allowed: false };
  const memberRows = (await memberResp.json()) as Array<{ role?: string }>;
  const member = memberRows[0];
  if (!member) return { allowed: false };

  return { allowed: member.role === "owner" || member.role === "editor" };
}

/**
 * Validate the request body and return a typed payload, or throw.
 */
function parseExecutionRequest(body: unknown): {
  workspaceId: string;
  fileId: string;
  filename: string;
  language: ExecutionLanguage;
  content: string;
} {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const record = body as Record<string, unknown>;

  const workspaceId = record.workspaceId;
  const fileId = record.fileId;
  const filename = record.filename;
  const language = record.language;
  const content = record.content;

  if (typeof workspaceId !== "string" || !workspaceId.trim()) {
    throw new Error("A valid workspace is required.");
  }
  if (typeof fileId !== "string" || !fileId.trim()) {
    throw new Error("A valid file is required.");
  }
  if (typeof filename !== "string" || !filename.trim()) {
    throw new Error("A valid filename is required.");
  }
  if (typeof content !== "string") {
    throw new Error("File content must be a string.");
  }

  if (typeof language !== "string" || !(ALLOWED_LANGUAGES as readonly string[]).includes(language)) {
    throw new Error("Execution is not currently supported for this language.");
  }

  return {
    workspaceId: workspaceId.trim(),
    fileId: fileId.trim(),
    filename: filename.trim(),
    language: language as ExecutionLanguage,
    content,
  };
}

export async function POST(request: Request) {
  try {
    // 1. Verify Supabase JWT (never trust client permissions).
    const accessToken = await verifySupabaseAuth(request.headers.get("authorization"));

    // 2. Bound the body before parsing.
    const rawBody = await request.arrayBuffer();
    if (rawBody.byteLength > MAX_BODY_BYTES) {
      return errorResponse("The request is too large.", 413);
    }
    const decoder = new TextDecoder("utf-8");
    const body = JSON.parse(decoder.decode(rawBody)) as unknown;

    // 3. Validate request.
    let parsed: {
      workspaceId: string;
      fileId: string;
      filename: string;
      language: ExecutionLanguage;
      content: string;
    };
    try {
      parsed = parseExecutionRequest(body);
    } catch (err) {
      return errorResponse(
        err instanceof Error ? err.message : "Invalid request.",
        400
      );
    }

    // 4. Verify workspace access (server-authoritative).
    const permission = await resolveExecutionPermission(parsed.workspaceId, accessToken);
    if (!permission.allowed) {
      return errorResponse(
        "You do not have permission to execute code in this workspace.",
        403
      );
    }

    // 5. Execute through the abstraction.
    let result: ExecutionResult;
    try {
      result = await runCode({
        language: parsed.language,
        content: parsed.content,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Execution failed.";
      if (/not currently supported/i.test(message)) {
        return errorResponse(
          "Execution is not currently supported for this language.",
          400
        );
      }
      if (/too large/i.test(message)) {
        return errorResponse("The source file is too large to execute.", 413);
      }
      // The compiler/interpreter is not installed/available on PATH. Surface a
      // clear, user-facing message (e.g. instead of a raw Windows 9009 error)
      // rather than a generic 503. Treated as an execution error so the client
      // can still offer "Fix with EPSILON AI".
      if (/not installed|not available on PATH/i.test(message)) {
        return errorResponse(message, 400);
      }
      // Do not leak internal runtime paths/messages.
      return errorResponse(
        "The execution service is temporarily unavailable.",
        503
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, 401);
    }

    console.error("/api/execution/run error:", error instanceof Error ? error.message : error);
    return errorResponse("Something went wrong while executing the code.", 500);
  }
}

export const dynamic = "force-dynamic";
// Static value (seconds) so Next.js can statically analyze the route config.
// Kept in sync with EXECUTION_TIMEOUT_MS (10s) + margin for the server to
// start the runtime and settle the response.
export const maxDuration = 20;
