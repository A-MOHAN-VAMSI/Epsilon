"use client";

import { ArrowLeft, Code2, Eye, Link2, LoaderCircle, Save, CloudUpload, CloudOff } from "lucide-react";
import type { SaveStatus } from "./EditorStatusBar";
import type { ConnectionStatus, CollabPeer } from "@/lib/collabProvider";
import ConnectionBadge from "./ConnectionBadge";
import PresenceBar from "./PresenceBar";

type WorkspaceTopBarProps = {
  workspaceName: string;
  saveStatus: SaveStatus;
  connectionStatus: ConnectionStatus;
  peers: CollabPeer[];
  currentUser?: { name: string; isOwner: boolean };
  isViewer: boolean;
  onBack: () => void;
  onInvite: () => void;
};

export default function WorkspaceTopBar({
  workspaceName,
  saveStatus,
  connectionStatus,
  peers,
  currentUser,
  isViewer,
  onBack,
  onInvite,
}: WorkspaceTopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0a0f16]/95 px-3 sm:px-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to dashboard"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[#07100b]">
          <Code2 size={15} strokeWidth={2.5} />
        </span>
        <span className="hidden text-xs font-semibold tracking-[0.16em] text-white/80 sm:block">EPSILON</span>
      </div>

      <div className="mx-2 h-5 w-px bg-white/10" />

      <h1 className="min-w-0 truncate text-sm font-semibold text-white">{workspaceName}</h1>

      {isViewer && (
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-white/50">
          <Eye size={11} /> Read-only
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span
          className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:flex ${
            saveStatus === "error"
              ? "border-red-400/20 bg-red-400/10 text-red-300"
              : "border-white/10 bg-white/[0.03] text-white/55"
          }`}
        >
          {saveStatus === "saving" && <LoaderCircle size={12} className="animate-spin" />}
          {saveStatus === "saved" && <CloudUpload size={12} />}
          {saveStatus === "dirty" && <Save size={12} />}
          {saveStatus === "error" && <CloudOff size={12} />}
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "All changes saved"}
          {saveStatus === "dirty" && "Unsaved changes"}
          {saveStatus === "error" && "Save failed"}
        </span>

        <ConnectionBadge status={connectionStatus} />

        {currentUser?.isOwner && !isViewer && (
          <button
            type="button"
            onClick={onInvite}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <Link2 size={12} />
            <span className="hidden sm:inline">Invite</span>
          </button>
        )}

        <PresenceBar peers={peers} currentUser={currentUser} />
      </div>
    </header>
  );
}
