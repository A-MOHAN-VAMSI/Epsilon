"use client";

import { useEffect, useRef } from "react";
import { LoaderCircle, Sparkles, TerminalSquare, Trash2, X } from "lucide-react";
import type { ExecutionRunMetadata } from "@/lib/execution/executionTypes";
import { executionLanguageLabel } from "@/lib/execution/executionService";

type ExecutionPanelProps = {
  runs: ExecutionRunMetadata[];
  running: boolean;
  onClear: () => void;
  onClose: () => void;
  onFixWithAI: (run: ExecutionRunMetadata) => void;
};

function StatusLine({ run }: { run: ExecutionRunMetadata }) {
  if (run.status === "running") {
    return (
      <div className="flex items-center gap-2 text-[var(--color-primary)]">
        <LoaderCircle size={13} className="animate-spin" />
        <span>Running {run.filename}...</span>
      </div>
    );
  }
  if (run.status === "timeout") {
    return (
      <div className="text-amber-300">Process timed out after {run.result?.durationMs ?? 0} ms</div>
    );
  }
  if (run.status === "cancelled") {
    return <div className="text-amber-300">Execution cancelled.</div>;
  }
  if (run.status === "unsupported") {
    return <div className="text-amber-300">Execution is not currently supported for this language.</div>;
  }
  if (run.status === "error") {
    return (
      <div className="text-red-300">
        Process finished with exit code {run.result?.exitCode ?? "?"} · Execution time: {run.result?.durationMs ?? 0} ms
      </div>
    );
  }
  return (
    <div className="text-[var(--color-primary)]">
      ✓ Process finished with exit code {run.result?.exitCode ?? 0} · Execution time: {run.result?.durationMs ?? 0} ms
    </div>
  );
}

export default function ExecutionPanel({
  runs,
  running,
  onClear,
  onClose,
  onFixWithAI,
}: ExecutionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest output as new content arrives.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [runs, running]);

  const lastRun = runs.length > 0 ? runs[runs.length - 1] : null;
  const canFix =
    lastRun !== null &&
    (lastRun.status === "error" || lastRun.status === "timeout");

  return (
    <div className="flex h-56 shrink-0 flex-col overflow-hidden border-t border-white/10 bg-[#0a0f16]">
      {/* Panel header with tabs */}
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-white/10 px-2">
        <div className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
          <TerminalSquare size={12} />
          Output
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {canFix && (
            <button
              type="button"
              onClick={() => lastRun && onFixWithAI(lastRun)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/[0.16]"
            >
              <Sparkles size={12} />
              Fix with EPSILON AI
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear output"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Trash2 size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close output"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[#060b12] px-3 py-2 font-mono text-[12px] leading-6 text-white/80"
      >
        {runs.length === 0 && !running ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-white/30">
            <TerminalSquare size={22} className="mb-2" />
            <span>Run a supported file to see its output here.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.timestamp} className="space-y-1">
                <div className="flex items-center gap-2 text-white/45">
                  <span className="text-[10px] uppercase tracking-[0.16em]">
                    {run.language ? executionLanguageLabel(run.language) : "Unknown"} · {run.filename}
                  </span>
                </div>

{run.status === "running" ? (
                  <div className="flex items-center gap-2 text-[var(--color-primary)]">
                    <LoaderCircle size={12} className="animate-spin" />
                    <span>{"> Running "}{run.filename}...</span>
                  </div>
                ) : (
                  <div>{"> Running "}{run.filename}...</div>
                )}

                {run.errorMessage ? (
                  <div className="whitespace-pre-wrap break-words text-amber-300">
                    {run.errorMessage}
                  </div>
                ) : null}

                {run.result?.stdout ? (
                  <pre className="whitespace-pre-wrap break-words text-white/85">{run.result.stdout}</pre>
                ) : null}

                {run.result?.stderr ? (
                  <pre className="whitespace-pre-wrap break-words text-red-300">{run.result.stderr}</pre>
                ) : null}

                <StatusLine run={run} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
