/**
 * Strict, reusable types for the EPSILON Code Runner milestone.
 *
 * These describe the contract between the Monaco editor, the client-side
 * execution service, the server API route, and the local execution runner.
 */

/** Languages currently supported by the execution runner. */
export type ExecutionLanguage = "javascript" | "python";

/** High-level UI status of an execution. */
export type ExecutionStatus =
  | "idle"
  | "running"
  | "success"
  | "error"
  | "timeout"
  | "cancelled"
  | "unsupported";

/** What the browser sends to `/api/execution/run`. */
export type ExecutionRequest = {
  workspaceId: string;
  fileId: string;
  filename: string;
  language: ExecutionLanguage;
  content: string;
};

/** The structured result returned by the execution runner. */
export type ExecutionResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  /** True when the user requested cancellation (Stop). */
  cancelled: boolean;
  status: "success" | "error" | "timeout" | "cancelled";
};

/** Machine-readable error categories for the execution API. */
export type ExecutionErrorKind =
  | "unsupported"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "too_large"
  | "service_unavailable"
  | "internal";

/** A terminal entry associated with a specific file at a point in time. */
export type ExecutionRunMetadata = {
  fileId: string;
  filename: string;
  language: string;
  status: ExecutionStatus;
  result: ExecutionResult | null;
  errorMessage: string;
  timestamp: number;
};

/**
 * Detect the execution language from a filename. Returns null when the file
 * is not supported by the runner. Language is derived from the extension only
 * (never from client-supplied arbitrary executables).
 */
export function detectExecutionLanguage(filename: string): ExecutionLanguage | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) {
    return "javascript";
  }
  if (lower.endsWith(".py")) {
    return "python";
  }
  return null;
}
