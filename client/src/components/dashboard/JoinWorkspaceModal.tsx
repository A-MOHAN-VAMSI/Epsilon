"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Modal from "./Modal";

type JoinWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Lets the user paste a workspace invite link (or token) to join a shared
 * workspace. Accepting the invite creates the appropriate workspace_members
 * row via the /join flow.
 */
export default function JoinWorkspaceModal({ open, onClose }: JoinWorkspaceModalProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste an invite link or token first.");
      return;
    }

    setLoading(true);
    setError("");

    // Extract the token from a full URL like
    // https://app.epsilon.dev/join?invite=<token>
    let token = trimmed;
    if (trimmed.includes("/join")) {
      try {
        const url = new URL(trimmed);
        token = url.searchParams.get("invite") ?? "";
      } catch {
        token = "";
      }
    }
    if (!token) {
      setError("That doesn't look like a valid invite link.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
    router.push(`/join?invite=${encodeURIComponent(token)}`);
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="join-workspace-modal-title">
      <div className="p-6">
        <h2 id="join-workspace-modal-title" className="text-base font-semibold text-white">
          Join a workspace
        </h2>
        <p className="mt-1 text-sm text-white/50">
          Paste an invite link you received from a workspace owner.
        </p>

        <div className="mt-5">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="https://.../join?invite=... or the invite token"
            autoFocus
            className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 font-mono text-xs text-white/80 outline-none focus:border-[var(--color-primary)]/50"
          />
          {error && (
            <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[#07100b] transition-all hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            Continue
          </button>
        </div>

        <p className="mt-4 text-[11px] leading-5 text-white/40">
          You will be asked to sign in (if needed) and then added to the workspace.
        </p>
      </div>
    </Modal>
  );
}
