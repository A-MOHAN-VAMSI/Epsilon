"use client";

import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import Modal from "./Modal";
import type { Workspace } from "@/lib/workspaceService";
import { deleteWorkspace } from "@/lib/workspaceService";

type DeleteConfirmModalProps = {
  workspace: Workspace | null;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteConfirmModal({ workspace, onClose, onDeleted }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    if (loading) return;
    setError("");
    onClose();
  }

  async function confirmDelete() {
    if (!workspace || loading) return;

    setLoading(true);
    setError("");
    try {
      await deleteWorkspace(workspace.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the workspace. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Modal open={workspace !== null} onClose={handleClose} labelledBy="delete-workspace-title">
      <div className="p-6 sm:p-7">
        <div className="mb-6">
          <h2 id="delete-workspace-title" className="text-lg font-semibold text-white">Delete Workspace</h2>
          <p className="mt-1 text-sm text-white/50">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">{workspace?.name}</span>? This action cannot be undone.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={confirmDelete}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
