"use client";

import { useState } from "react";
import { Check, Copy, Link2, LoaderCircle } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import { createInvite } from "@/lib/memberService";

type InviteModalProps = {
  open: boolean;
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
};

export default function InviteModal({ open, workspaceId, workspaceName, onClose }: InviteModalProps) {
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const invite = await createInvite(workspaceId, "editor");
      const url = `${window.location.origin}/join?invite=${invite.token}`;
      setInviteUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create an invite link.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard. Please copy manually.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="invite-modal-title">
      <div className="p-6">
        <h2 id="invite-modal-title" className="text-base font-semibold text-white">
          Invite collaborators
        </h2>
        <p className="mt-1 text-sm text-white/50">
          Share this link to let collaborators join <span className="text-white/80">{workspaceName}</span>.
        </p>

        <div className="mt-5">
          {!inviteUrl ? (
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[#07100b] transition-all hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Link2 size={16} />}
              Generate invite link
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteUrl}
                aria-label="Invite link"
                onFocus={(e) => e.currentTarget.select()}
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 font-mono text-xs text-white/80 outline-none focus:border-[var(--color-primary)]/50"
              />
              <button
                type="button"
                onClick={copy}
                aria-label="Copy invite link"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                {copied ? <Check size={16} className="text-[var(--color-primary)]" /> : <Copy size={16} />}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="mt-4 text-[11px] leading-5 text-white/40">
          Invited users join as editors. Only workspace owners can generate invites.
        </p>
      </div>
    </Modal>
  );
}
