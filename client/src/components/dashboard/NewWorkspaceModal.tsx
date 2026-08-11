"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import Modal from "./Modal";
import { createWorkspace } from "@/lib/workspaceService";
import { WORKSPACE_LANGUAGES } from "@/lib/workspaceLabels";

type NewWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function NewWorkspaceModal({ open, onClose, onCreated }: NewWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<string>("JavaScript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setDescription("");
    setLanguage("JavaScript");
    setError("");
  }

  function handleClose() {
    if (loading) return;
    reset();
    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Workspace name is required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createWorkspace({ name: trimmed, description: description || undefined, language });
      reset();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} labelledBy="new-workspace-title">
      <div className="p-6 sm:p-7">
        <div className="mb-6">
          <h2 id="new-workspace-title" className="text-lg font-semibold text-white">New Workspace</h2>
          <p className="mt-1 text-sm text-white/50">Create a fresh collaborative space.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium text-white/85">
            Workspace Name <span className="text-[var(--color-primary)]">*</span>
            <input
              required
              autoFocus
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Aurora API"
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--color-primary)]/60"
            />
          </label>

          <label className="block text-sm font-medium text-white/85">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="What is this workspace about?"
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--color-primary)]/60"
            />
          </label>

          <label className="block text-sm font-medium text-white/85">
            Language / Template
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0a100a] px-4 text-sm text-white outline-none transition focus:border-[var(--color-primary)]/60"
            >
              {WORKSPACE_LANGUAGES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-all hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
              {loading ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
