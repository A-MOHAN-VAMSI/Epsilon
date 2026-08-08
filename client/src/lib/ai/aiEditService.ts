"use client";

import { getSession } from "@/lib/supabaseAuth";
import type {
  AIEditAction,
  AICodeEditRequest,
  AISelectionContext,
  StoredAIProposal,
} from "@/lib/ai/editorTypes";
import { hashContent } from "@/lib/ai/aiEditUtils";

export type EditorAIResponse = {
  explanation: string;
  editKind: "replace_selection" | "replace_file" | null;
  replacement: string;
};

/**
 * Request a structured AI edit proposal from the server. The server validates
 * auth, rebuilds workspace context, calls Gemini, and returns a validated
 * proposal. The client never sees raw Gemini output.
 */
export async function requestEditorAI(
  input: AICodeEditRequest
): Promise<EditorAIResponse> {
  const session = getSession();
  const authHeader = session?.access_token ? `Bearer ${session.access_token}` : undefined;

  const response = await fetch("/api/ai/editor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(input),
  });

  const result: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const record = (typeof result === "object" && result !== null ? result : {}) as Record<
      string,
      unknown
    >;
    const message =
      typeof record.error === "string"
        ? record.error
        : "Something went wrong while generating the AI edit.";
    throw new Error(message);
  }

  if (typeof result !== "object" || result === null) {
    throw new Error("The AI returned an invalid response.");
  }

  const record = result as Record<string, unknown>;
  const explanation = typeof record.explanation === "string" ? record.explanation : "";
  const replacement = typeof record.replacement === "string" ? record.replacement : "";
  const editKindValue = record.editKind;

  const editKind: EditorAIResponse["editKind"] =
    editKindValue === "replace_selection" || editKindValue === "replace_file"
      ? editKindValue
      : null;

  return { explanation, editKind, replacement };
}

/**
 * Capture stale-edit protection data for a proposal. Stores the base content
 * and selection snapshot at request time so Accept can verify nothing changed.
 */
export function buildStoredProposal(input: {
  action: AIEditAction;
  explanation: string;
  editKind: "replace_selection" | "replace_file" | null;
  replacement: string;
  baseContent: string;
  baseSelection: AISelectionContext | null;
}): StoredAIProposal {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action: input.action,
    explanation: input.explanation,
    editKind: input.editKind,
    replacement: input.replacement,
    baseContent: input.baseContent,
    baseSelection: input.baseSelection,
    baseHash: hashContent(input.baseContent),
  };
}

/**
 * Check whether a proposal is still safe to apply against the current live
 * content. Returns true when the base state still matches.
 */
export function isProposalStale(
  proposal: StoredAIProposal,
  currentContent: string,
  currentSelection: AISelectionContext | null
): boolean {
  // Whole-file edits: the entire file must match the base snapshot.
  if (proposal.editKind === "replace_file") {
    return hashContent(currentContent) !== proposal.baseHash;
  }

  // Selection edits: the targeted selected region must still match.
  if (proposal.editKind === "replace_selection") {
    if (!proposal.baseSelection) return true;
    if (!currentSelection) return true;
    // The selection range must still exist and its text must match.
    if (
      currentSelection.startLine !== proposal.baseSelection.startLine ||
      currentSelection.startColumn !== proposal.baseSelection.startColumn ||
      currentSelection.endLine !== proposal.baseSelection.endLine ||
      currentSelection.endColumn !== proposal.baseSelection.endColumn
    ) {
      return true;
    }
    return currentSelection.selectedText !== proposal.baseSelection.selectedText;
  }

  // Explanation-only proposals need no staleness check.
  return false;
}
