"use client";

import { Fragment, type ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  LoaderCircle,
  RefreshCcw,
  Sparkles,
  X,
} from "lucide-react";
import AIEditPreview from "./AIEditPreview";
import type { StoredAIProposal } from "@/lib/ai/editorTypes";
import { replaceSelection } from "@/lib/ai/aiEditUtils";

export type EditorAIPanelState =
  | { kind: "idle" }
  | { kind: "generating"; action: string }
  | { kind: "explanation"; explanation: string }
  | { kind: "proposal"; proposal: StoredAIProposal }
  | { kind: "stale"; message: string }
  | { kind: "error"; message: string }
  | { kind: "applied" };

type EditorAIPanelProps = {
  open: boolean;
  state: EditorAIPanelState;
  filePath: string;
  language: string;
  canWrite: boolean;
  onAccept: (proposal: StoredAIProposal) => void;
  onReject: () => void;
  onRegenerate: () => void;
  onClose: () => void;
};

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(`[^`]*`)/g).map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-white/10 px-1 font-mono text-[.92em] text-[var(--color-primary)]"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }
    return segment;
  });
}

function renderExplanation(content: string): ReactNode {
  const nodes: ReactNode[] = [];
  const codeBlockRegex = /```([^\n\r]*)\r?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let key = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, language, codeText] = match;
    const before = content.slice(lastIndex, match.index);
    if (before) {
      nodes.push(
        <p key={`t-${key++}`} className="whitespace-pre-wrap break-words text-sm leading-6">
          {before.split(/\r?\n/).map((line, lineIndex) => (
            <Fragment key={`${key}-${lineIndex}`}>
              {lineIndex > 0 ? <br /> : null}
              {renderInlineMarkdown(line)}
            </Fragment>
          ))}
        </p>
      );
    }
    const safeLanguage = language.trim().replace(/[^a-zA-Z0-9_-]/g, "") || "code";
    nodes.push(
      <div
        key={`c-${key++}`}
        className="overflow-x-auto rounded-xl border border-white/10 bg-[#020712]/95 px-3 py-3 text-sm text-white"
      >
        <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/45">
          {safeLanguage}
        </div>
        <pre className="whitespace-pre-wrap font-mono leading-6 text-[0.95em]">
          <code>{codeText.replace(/\r?\n$/, "")}</code>
        </pre>
      </div>
    );
    lastIndex = match.index + fullMatch.length;
  }

  const remaining = content.slice(lastIndex);
  if (remaining) {
    nodes.push(
      <p key={`t-${key++}`} className="whitespace-pre-wrap break-words text-sm leading-6">
        {remaining.split(/\r?\n/).map((line, lineIndex) => (
          <Fragment key={`${key}-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {renderInlineMarkdown(line)}
          </Fragment>
        ))}
      </p>
    );
  }

  return <div className="space-y-3">{nodes}</div>;
}

const ACTION_LABEL: Record<string, string> = {
  explain: "Explain",
  fix: "Fix",
  refactor: "Refactor",
  optimize: "Optimize",
  ask: "Ask AI",
};

export default function EditorAIPanel({
  open,
  state,
  filePath,
  language,
  canWrite,
  onAccept,
  onReject,
  onRegenerate,
  onClose,
}: EditorAIPanelProps) {
  if (!open) return null;

  // Compute the "modified" side of the diff preview:
  // - replace_file → the replacement is the whole new file.
  // - replace_selection → apply the replacement to the base content.
  const modifiedContent =
    state.kind === "proposal" && state.proposal.editKind === "replace_file"
      ? state.proposal.replacement
      : state.kind === "proposal" &&
          state.proposal.editKind === "replace_selection" &&
          state.proposal.baseSelection
        ? replaceSelection(
            state.proposal.baseContent,
            state.proposal.baseSelection,
            state.proposal.replacement
          )
        : state.kind === "proposal"
          ? state.proposal.baseContent
          : "";

  return (
    <aside className="flex h-full w-full flex-col border-l border-white/10 bg-[#0a0f16]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/[0.1] text-[var(--color-primary)]">
            <Bot size={14} />
          </span>
          EPSILON AI
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI panel"
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {state.kind === "idle" && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Sparkles size={18} className="text-[var(--color-primary)]" />
            <p className="mt-3 text-sm text-white/60">
              Select code and use an AI action to explain, fix, refactor, or optimize it.
            </p>
          </div>
        )}

        {state.kind === "generating" && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <LoaderCircle size={22} className="animate-spin text-[var(--color-primary)]" />
            <p className="text-sm text-white/70">
              {ACTION_LABEL[state.action] ?? "Processing"} with EPSILON AI…
            </p>
            <p className="text-xs text-white/40">Reviewing your code and workspace context.</p>
          </div>
        )}

        {state.kind === "explanation" && (
          <div className="space-y-3 px-4 py-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              <Sparkles size={12} className="text-[var(--color-primary)]" />
              Explanation
            </div>
            <div className="rounded-xl border border-white/10 bg-[#07131f]/80 px-4 py-3 text-white/80">
              {renderExplanation(state.explanation)}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onReject}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {state.kind === "proposal" && (
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 space-y-2 px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                <Sparkles size={12} className="text-[var(--color-primary)]" />
                Proposed change
              </div>
              {state.proposal.explanation ? (
                <div className="rounded-xl border border-white/10 bg-[#07131f]/80 px-3 py-2 text-xs leading-5 text-white/70">
                  {state.proposal.explanation}
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1">
              <AIEditPreview
                original={state.proposal.baseContent}
                modified={modifiedContent}
                language={language}
                path={filePath}
                lineRange={
                  state.proposal.editKind === "replace_selection" && state.proposal.baseSelection
                    ? {
                        startLine: state.proposal.baseSelection.startLine,
                        endLine: state.proposal.baseSelection.endLine,
                      }
                    : null
                }
              />
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={onReject}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <X size={13} />
                Reject
              </button>
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <RefreshCcw size={13} />
                Regenerate
              </button>
              {canWrite ? (
                <button
                  type="button"
                  onClick={() => onAccept(state.proposal)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[#07100b] transition-all hover:brightness-105"
                >
                  <Check size={13} />
                  Accept
                </button>
              ) : (
                <span className="text-[11px] text-white/40">Viewers cannot apply edits</span>
              )}
            </div>
          </div>
        )}

        {state.kind === "stale" && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <AlertTriangle size={22} className="text-[var(--color-warning)]" />
            <p className="text-sm font-medium text-white/80">The code changed while AI worked</p>
            <p className="text-xs leading-5 text-white/50">{state.message}</p>
            <button
              type="button"
              onClick={onRegenerate}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[#07100b] transition-all hover:brightness-105"
            >
              <RefreshCcw size={13} />
              Regenerate against latest code
            </button>
          </div>
        )}

        {state.kind === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <AlertTriangle size={22} className="text-[var(--color-danger)]" />
            <p className="text-sm font-medium text-white/80">Something went wrong</p>
            <p className="text-xs leading-5 text-white/50">{state.message}</p>
            <button
              type="button"
              onClick={onReject}
              className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              Close
            </button>
          </div>
        )}

        {state.kind === "applied" && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]">
              <Check size={22} />
            </span>
            <p className="text-sm font-medium text-white/85">Change applied</p>
            <p className="text-xs leading-5 text-white/50">
              The accepted edit was applied to the live collaborative document. Collaborators will
              see it in real time.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
