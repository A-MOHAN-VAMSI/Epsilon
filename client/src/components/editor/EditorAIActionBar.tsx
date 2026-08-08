"use client";

import { useState } from "react";
import { Bug, Code2, MessageSquareText, RefreshCcw, Wand2, Zap } from "lucide-react";
import type { AIEditAction } from "@/lib/ai/editorTypes";

type EditorAIActionBarProps = {
  hasSelection: boolean;
  canWrite: boolean;
  onAction: (action: AIEditAction, request?: string) => void;
  disabled?: boolean;
};

const ACTIONS: Array<{
  id: AIEditAction;
  label: string;
  icon: typeof Bug;
  writable: boolean;
}> = [
  { id: "explain", label: "Explain", icon: Code2, writable: false },
  { id: "fix", label: "Fix", icon: Bug, writable: true },
  { id: "refactor", label: "Refactor", icon: Wand2, writable: true },
  { id: "optimize", label: "Optimize", icon: Zap, writable: true },
];

export default function EditorAIActionBar({
  hasSelection,
  canWrite,
  onAction,
  disabled,
}: EditorAIActionBarProps) {
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState("");

  function submitAsk() {
    const trimmed = askText.trim();
    if (!trimmed || disabled) return;
    onAction("ask", trimmed);
    setAskText("");
    setAskOpen(false);
  }

  return (
    <div className="ai-action-bar absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0a111b]/95 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur">
        {ACTIONS.map((action) => {
          if (action.writable && !canWrite) return null;
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => onAction(action.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              title={
                hasSelection
                  ? `${action.label} selected code`
                  : `${action.label} active file`
              }
            >
              <Icon size={13} className="text-[var(--color-primary)]" />
              {action.label}
            </button>
          );
        })}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAskOpen((open) => !open)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            askOpen
              ? "bg-white/[0.08] text-white"
              : "text-white/70 hover:bg-white/[0.06] hover:text-white"
          } disabled:cursor-not-allowed disabled:opacity-50`}
          title="Ask EPSILON AI a custom question about this file"
        >
          <MessageSquareText size={13} className="text-[var(--color-primary)]" />
          Ask AI
        </button>
      </div>

      {askOpen && (
        <div className="flex w-72 flex-col gap-2 rounded-xl border border-white/10 bg-[#0a111b]/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <RefreshCcw size={11} className="text-[var(--color-primary)]" />
            Ask EPSILON AI
          </span>
          <textarea
            value={askText}
            onChange={(event) => setAskText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitAsk();
              }
            }}
            rows={2}
            placeholder={
              hasSelection
                ? "e.g. Convert this to async/await"
                : "e.g. Add error handling to this file"
            }
            className="w-full resize-none rounded-lg border border-white/10 bg-[#08101c]/80 px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-[var(--color-primary)]/50"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAskOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitAsk}
              disabled={!askText.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[#07100b] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wand2 size={12} />
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
