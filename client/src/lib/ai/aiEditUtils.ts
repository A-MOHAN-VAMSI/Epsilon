import type { AISelectionContext } from "./editorTypes";

/**
 * Convert a 1-based line/column position into a character offset in `content`.
 * Newlines are counted as a single `\n` character.
 */
export function positionToOffset(
  content: string,
  line: number,
  column: number
): number {
  const lines = content.split("\n");
  let offset = 0;
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1; // +1 for the newline
  }
  return offset + Math.max(0, column - 1);
}

/** Extract the substring covered by a selection (from the given content). */
export function sliceSelection(
  content: string,
  selection: AISelectionContext
): string {
  const start = positionToOffset(content, selection.startLine, selection.startColumn);
  const end = positionToOffset(content, selection.endLine, selection.endColumn);
  return content.slice(start, end);
}

/** Replace the selected region in `content` with `replacement`. */
export function replaceSelection(
  content: string,
  selection: AISelectionContext,
  replacement: string
): string {
  const start = positionToOffset(content, selection.startLine, selection.startColumn);
  const end = positionToOffset(content, selection.endLine, selection.endColumn);
  return content.slice(0, start) + replacement + content.slice(end);
}

/** Lightweight non-cryptographic hash for stale-edit detection. */
export function hashContent(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = (hash * 33) ^ content.charCodeAt(i);
    hash |= 0;
  }
  return String(hash >>> 0);
}
