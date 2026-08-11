"use client";

import { Play, Square } from "lucide-react";

type RunButtonProps = {
  running: boolean;
  disabled?: boolean;
  supported: boolean;
  onClick: () => void;
};

export default function RunButton({
  running,
  disabled = false,
  supported,
  onClick,
}: RunButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !supported}
      title={supported ? (running ? "Stop execution" : "Run code (Ctrl+Enter)") : "Execution not supported"}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
        running
          ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
          : supported
            ? "bg-[var(--color-primary)] !text-[#07100b] hover:brightness-105"
            : "cursor-not-allowed bg-white/[0.04] text-white/30"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {running ? <Square size={13} /> : <Play size={13} />}
      {running ? "Stop" : "Run"}
    </button>
  );
}
