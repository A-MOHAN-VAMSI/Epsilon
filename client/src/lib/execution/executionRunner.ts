import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExecutionLanguage, ExecutionResult } from "./executionTypes";

/**
 * ============================================================================
 * EPSILON Execution Runner — Local Development Adapter
 * ----------------------------------------------------------------------------
 * SECURITY DISCLAIMER (READ FIRST):
 *
 * This adapter runs user code in a child process on the HOST machine. It is
 * intended ONLY for local development and is NOT production-safe on its own.
 * Arbitrary user code can read/write the host filesystem and consume network
 * resources within the constraints below.
 *
 * The abstractions in this file are structured so that a future production
 * deployment can swap this adapter for an isolated runtime (Docker sandbox,
 * Judge0, Piston, an isolated worker, etc.) WITHOUT changing the API route or
 * the client. The route only ever calls `runCode()`; it never constructs a
 * shell command or names an executable from the browser.
 *
 * Protections applied here (defense in depth):
 *   - No arbitrary executable/command from the client. The language is mapped
 *     to a fixed, allow-listed runtime binary by the server.
 *   - Source is written to a unique, random temp directory (mkdtemp) with a
 *     safe, allow-listed filename, never a client-chosen path.
 *   - A hard execution timeout kills the process group.
 *   - Stdout/stderr are capped in bytes to bound memory.
 *   - The temp directory is removed after execution (cleanup).
 *   - The child runs with a stripped environment (no secrets/process env vars
 *     are inherited), so executed code cannot read server secrets.
 * ============================================================================
 */

/** Hard timeout (ms) for a single execution. */
export const EXECUTION_TIMEOUT_MS = 10_000;

/** Maximum source size (bytes) accepted for execution. */
export const MAX_SOURCE_BYTES = 64 * 1024; // 64 KB

/** Maximum accumulated stdout/stderr captured per run (bytes). */
export const MAX_OUTPUT_BYTES = 128 * 1024; // 128 KB

/** Safe filename used inside the temp dir (never client-controlled). */
const SAFE_MAIN_FILENAME = "main";

/** Map a server-approved language to its file extension + flag args. */
const RUNTIMES: Record<
  ExecutionLanguage,
  { args: string[]; ext: string }
> = {
  javascript: { args: [], ext: ".js" },
  python: { args: ["-u"], ext: ".py" },
};

/** User-facing message when a runtime executable cannot be found on PATH. */
const PYTHON_NOT_FOUND =
  "Python is not installed or is not available on PATH.";

/**
 * Resolve the Python executable in a platform-aware way.
 *
 * - Windows prefers `python`, then falls back to `py` (the Microsoft Store
 *   launcher). `python3` is often absent on Windows even when Python is
 *   installed, so it is intentionally the LAST fallback.
 * - Linux/macOS prefer `python3`, then fall back to `python`.
 *
 * Resolution uses `where` (Windows) / `command -v` (Unix) so the command is
 * verified to exist on PATH before we spawn it, avoiding confusing raw errors
 * like Windows exit code 9009.
 */
function resolvePythonCommand(): { command: string; args: string[] } | null {
  const isWindows = process.platform === "win32";
  const candidates = isWindows
    ? [
        { command: "python", pyLauncher: false },
        { command: "py", pyLauncher: true },
        { command: "python3", pyLauncher: false },
      ]
    : [
        { command: "python3", pyLauncher: false },
        { command: "python", pyLauncher: false },
      ];

  const locateArgs = isWindows ? ["where"] : ["-v"];

  for (const candidate of candidates) {
    const probe = spawnSync(locateArgs[0], [candidate.command], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const found = probe.status === 0 && (probe.stdout || "").trim().length > 0;
    if (found) {
      // The `py` launcher requires a version flag; `python`/`python3` do not.
      const args = candidate.pyLauncher ? ["-3", ...RUNTIMES.python.args] : RUNTIMES.python.args;
      return { command: candidate.command, args };
    }
  }

  return null;
}

/** Resolve the runtime command for a language, or null if unavailable. */
function resolveRuntimeCommand(
  language: ExecutionLanguage
): { command: string; args: string[] } | null {
  if (language === "javascript") {
    return { command: "node", args: RUNTIMES.javascript.args };
  }
  return resolvePythonCommand();
}

// A static kill signal used to terminate the process group on timeout/stop.
const KILL_SIGNAL = "SIGKILL";

type RunOptions = {
  language: ExecutionLanguage;
  content: string;
  /** Millisecond timeout; defaults to EXECUTION_TIMEOUT_MS. */
  timeoutMs?: number;
  /** When true, the caller has requested cancellation (Stop). */
  shouldCancel?: () => boolean;
};

const BYTE_ENCODER = new TextEncoder();

function byteLength(value: string): number {
  return BYTE_ENCODER.encode(value).length;
}

/**
 * Run user code through the allow-listed local adapter.
 *
 * Returns a structured ExecutionResult. Throws an Error with a user-safe
 * message (no internal paths) only for infrastructure failures; runtime
 * failures come back in the result (stderr + non-zero exit code).
 */
export async function runCode(options: RunOptions): Promise<ExecutionResult> {
  const { language, content } = options;
  const runtime = RUNTIMES[language];
  if (!runtime) {
    throw new Error("Execution is not currently supported for this language.");
  }

  // Resolve the executable in a platform-aware way. This prevents raw errors
  // like Windows 9009 when `python3` is absent even though `python` exists.
  const resolved = resolveRuntimeCommand(language);
  if (!resolved) {
    throw new Error(PYTHON_NOT_FOUND);
  }

  if (byteLength(content) > MAX_SOURCE_BYTES) {
    throw new Error("The source file is too large to execute.");
  }

  const timeoutMs = options.timeoutMs ?? EXECUTION_TIMEOUT_MS;
  const startedAt = Date.now();

  // Unique temp dir + safe filename. The client never supplies a path.
  const dir = await mkdtemp(join(tmpdir(), "epsilon-exec-"));
  const filePath = join(dir, SAFE_MAIN_FILENAME + runtime.ext);

  try {
    await writeFile(filePath, content, "utf8");

return await new Promise<ExecutionResult>((resolve, reject) => {
      // Cast to NodeJS.ProcessEnv: we intentionally provide a stripped
      // environment (no secrets/process env vars are inherited), so the
      // missing NODE_ENV is expected and safe.
      const env = {
        PATH: process.env.PATH ?? "",
        LANG: "C.UTF-8",
      } as unknown as NodeJS.ProcessEnv;
      // Cast to ChildProcess to avoid the strict stdio-overload `never`
      // intersection. The streams are piped, so stdout/stderr will be present;
      // optional chaining guards against any edge case.
      const child = spawn(resolved.command, [...resolved.args, filePath], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
        // Detach so we can kill the whole process group on timeout/stop.
        detached: true,
      }) as ChildProcess;

      let stdout = "";
      let stderr = "";
      let outputTruncated = false;
      let settled = false;
      let timedOut = false;
      let cancelled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        timedOut = true;
        settle();
      }, timeoutMs);

      const capture = (chunk: Buffer, field: "stdout" | "stderr") => {
        if (field === "stdout") {
          if (byteLength(stdout + chunk.toString()) > MAX_OUTPUT_BYTES) {
            outputTruncated = true;
            return;
          }
          stdout += chunk.toString();
        } else {
          if (byteLength(stderr + chunk.toString()) > MAX_OUTPUT_BYTES) {
            outputTruncated = true;
            return;
          }
          stderr += chunk.toString();
        }
      };

      child.stdout?.on("data", (chunk: Buffer) => capture(chunk, "stdout"));
      child.stderr?.on("data", (chunk: Buffer) => capture(chunk, "stderr"));

      child.on("error", (err) => {
        if (settled) return;
        clearTimeout(timer);
        settled = true;
        reject(new Error("The execution service could not start the runtime."));
      });

      child.on("close", (code) => {
        if (settled) return;
        clearTimeout(timer);
        settled = true;

        const truncatedNote = outputTruncated
          ? "\n[output truncated: limit reached]"
          : "";
        const wasCancelled = options.shouldCancel?.() ?? false;

        if (wasCancelled || cancelled) {
          resolve({
            stdout: stdout + truncatedNote,
            stderr,
            exitCode: null,
            durationMs: Date.now() - startedAt,
            timedOut: false,
            cancelled: true,
            status: "cancelled",
          });
          return;
        }

        if (timedOut) {
          resolve({
            stdout: stdout + truncatedNote,
            stderr,
            exitCode: null,
            durationMs: Date.now() - startedAt,
            timedOut: true,
            cancelled: false,
            status: "timeout",
          });
          return;
        }

        resolve({
          stdout,
          stderr,
          exitCode: code ?? null,
          durationMs: Date.now() - startedAt,
          timedOut: false,
          cancelled: false,
          status: code === 0 ? "success" : "error",
        });
      });

      function settle() {
        if (settled) return;
        // Kill the whole detached process group.
        try {
          process.kill(-child.pid!, KILL_SIGNAL);
        } catch {
          try {
            child.kill(KILL_SIGNAL);
          } catch {
            /* already gone */
          }
        }
        // If the process group didn't emit 'close' synchronously, resolve now.
        setTimeout(() => {
          if (!settled) {
            settled = true;
            const truncatedNote = outputTruncated
              ? "\n[output truncated: limit reached]"
              : "";
            resolve({
              stdout: stdout + truncatedNote,
              stderr,
              exitCode: null,
              durationMs: Date.now() - startedAt,
              timedOut,
              cancelled,
              status: timedOut ? "timeout" : cancelled ? "cancelled" : "error",
            });
          }
        }, 50);

        // Poll cancellation so the Promise settles even if the child lingers.
        const poll = setInterval(() => {
          if (options.shouldCancel?.()) {
            cancelled = true;
          }
        }, 100);
        // Ensure the interval is cleared once 'close' fires.
        child.once("close", () => clearInterval(poll));
      }
    });
  } finally {
    // Cleanup the temp dir regardless of outcome.
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
