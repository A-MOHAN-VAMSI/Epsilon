"use client";

import { CloudOff, CloudUpload, LoaderCircle, Save, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/lib/collabProvider";

export type SaveStatus = "saved" | "saving" | "dirty" | "error";

type EditorStatusBarProps = {
  languageLabel: string;
  line: number;
  column: number;
  saveStatus: SaveStatus;
  connectionStatus: ConnectionStatus;
};

export default function EditorStatusBar({
  languageLabel,
  line,
  column,
  saveStatus,
  connectionStatus,
}: EditorStatusBarProps) {
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-white/10 bg-[#0a0f16] px-3 text-[11px] text-white/45">
      <span className="flex items-center gap-1.5 text-[var(--color-primary)]">
        {saveStatus === "saving" && <LoaderCircle size={12} className="animate-spin" />}
        {saveStatus === "saved" && <CloudUpload size={12} />}
        {saveStatus === "dirty" && <Save size={12} />}
        {saveStatus === "error" && <CloudOff size={12} className="text-red-400" />}
        {saveStatus === "saving" && "Saving..."}
        {saveStatus === "saved" && "Saved"}
        {saveStatus === "dirty" && "Unsaved changes"}
        {saveStatus === "error" && "Save failed"}
      </span>

      <span
        className={`ml-auto flex items-center gap-1.5 ${
          connectionStatus === "offline" || connectionStatus === "reconnecting"
            ? "text-amber-300"
            : "text-white/40"
        }`}
      >
        {(connectionStatus === "offline" || connectionStatus === "reconnecting") && (
          <WifiOff size={12} />
        )}
        {connectionStatus === "connected" && "Live"}
        {connectionStatus === "connecting" && "Connecting..."}
        {connectionStatus === "reconnecting" && "Reconnecting..."}
        {connectionStatus === "offline" && "Offline"}
      </span>

      <span className="flex items-center gap-1.5">
        <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5">{languageLabel}</span>
        <span className="hidden sm:inline">Ln {line}, Col {column}</span>
      </span>
    </footer>
  );
}
