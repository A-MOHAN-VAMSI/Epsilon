"use client";

import { getSession } from "@/lib/supabaseAuth";
import type {
  ExecutionLanguage,
  ExecutionRequest,
  ExecutionResult,
} from "./executionTypes";

/**
 * Client-side execution service. Sends ONLY the necessary fields to the
 * server; the server never trusts client permissions or arbitrary commands.
 */
export async function runExecution(
  input: Omit<ExecutionRequest, "workspaceId" | "fileId"> & {
    workspaceId: string;
    fileId: string;
  }
): Promise<ExecutionResult> {
  const session = getSession();
  const authHeader = session?.access_token ? `Bearer ${session.access_token}` : undefined;

  const response = await fetch("/api/execution/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      fileId: input.fileId,
      filename: input.filename,
      language: input.language,
      content: input.content,
    } satisfies ExecutionRequest),
  });

  const result: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const record = (typeof result === "object" && result !== null ? result : {}) as Record<
      string,
      unknown
    >;
    const message =
      typeof record.error === "string"
        ? record.error
        : "Something went wrong while executing the code.";
    throw new ExecutionError(message, response.status);
  }

  if (typeof result !== "object" || result === null) {
    throw new ExecutionError("The execution service returned an invalid response.", 500);
  }

  const record = result as Record<string, unknown>;
  const stdout = typeof record.stdout === "string" ? record.stdout : "";
  const stderr = typeof record.stderr === "string" ? record.stderr : "";
  const exitCode = typeof record.exitCode === "number" ? record.exitCode : null;
  const durationMs = typeof record.durationMs === "number" ? record.durationMs : 0;
  const timedOut = typeof record.timedOut === "boolean" ? record.timedOut : false;
  const cancelled = typeof record.cancelled === "boolean" ? record.cancelled : false;
  const statusValue = record.status;

  const status: ExecutionResult["status"] =
    statusValue === "success" ||
    statusValue === "error" ||
    statusValue === "timeout" ||
    statusValue === "cancelled"
      ? statusValue
      : exitCode === 0
        ? "success"
        : "error";

  return { stdout, stderr, exitCode, durationMs, timedOut, cancelled, status };
}

/** A typed error carrying an HTTP status for the execution service. */
export class ExecutionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ExecutionError";
    this.status = status;
  }
}

/** Map a language to a display label for the terminal. */
export function executionLanguageLabel(language: string | null): string {
  switch (language) {
    case "javascript":
      return "JavaScript";
    case "python":
      return "Python";
    default:
      return language ?? "Unknown";
  }
}

/** Convenience re-export for callers. */
export type { ExecutionLanguage };
