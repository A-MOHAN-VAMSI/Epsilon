"use client";

import { useEffect, useRef } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import type { CollabSession } from "@/lib/collabProvider";
import type { AISelectionContext } from "@/lib/ai/editorTypes";
import { positionToOffset } from "@/lib/ai/aiEditUtils";

export type EditorApplyInput = {
  text: Y.Text;
  kind: "replace_selection" | "replace_file";
  replacement: string;
  selection: AISelectionContext | null;
};

type CollaborativeEditorProps = {
  session: CollabSession;
  language: string;
  path: string;
  onCursorChange: (line: number, column: number) => void;
  onSelectionChange?: (selection: AISelectionContext | null) => void;
  /** Imperative handle for applying accepted AI edits + reading live content. */
  editorApiRef?: React.MutableRefObject<{
    getEditor: () => unknown;
    getLiveContent: () => string;
    getSelection: () => AISelectionContext | null;
    applyAISelectionEdit: (input: EditorApplyInput) => void;
    applyAIWholeFileEdit: (input: EditorApplyInput) => void;
  } | null>;
};

export default function CollaborativeEditor({
  session,
  language,
  path,
  onCursorChange,
  onSelectionChange,
  editorApiRef,
}: CollaborativeEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);
  const editorRef = useRef<unknown>(null);
  const onCursorChangeRef = useRef(onCursorChange);
  onCursorChangeRef.current = onCursorChange;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  // Track the current selection without triggering re-renders on cursor move.
  const selectionRef = useRef<AISelectionContext | null>(null);

  // Cleanup the Yjs<->Monaco binding when the session/file changes.
  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [session.roomId]);

  // ---- AI edit application helpers (Yjs-centric) ----

  /**
   * Apply a selection-based AI edit through the Y.Text in a single Yjs
   * transaction. MonacoBinding observes the change and updates Monaco, and
   * y-websocket broadcasts it to collaborators.
   */
  function applySelectionEdit(input: EditorApplyInput) {
    const { text, selection } = input;
    if (!selection) return;

    const current = text.toString();
    const startOffset = positionToOffset(current, selection.startLine, selection.startColumn);
    const endOffset = positionToOffset(current, selection.endLine, selection.endColumn);
    if (endOffset < startOffset || endOffset > current.length) return;

    text.doc?.transact(() => {
      text.delete(startOffset, endOffset - startOffset);
      if (input.replacement) {
        text.insert(startOffset, input.replacement);
      }
    });
  }

  /**
   * Apply a whole-file AI replacement in a single Yjs transaction. This
   * replaces the entire Y.Text content, which MonacoBinding + y-websocket
   * propagate to all collaborators.
   */
  function applyWholeFileEdit(input: EditorApplyInput) {
    const { text } = input;
    const current = text.toString();
    text.doc?.transact(() => {
      if (current.length > 0) text.delete(0, current.length);
      if (input.replacement) text.insert(0, input.replacement);
    });
  }

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Bind the Yjs text to Monaco. y-monaco handles bidirectional sync,
    // remote selections, and undo/redo integration.
    const binding = new MonacoBinding(
      session.text,
      editor.getModel()!,
      new Set([editor]),
      session.provider.awareness
    );
    bindingRef.current = binding;

    // Viewer read-only enforcement.
    editor.updateOptions({ readOnly: !session.canWrite });

    // Cursor position reporting.
    const onCursor = () => {
      const pos = editor.getPosition();
      if (pos) onCursorChangeRef.current(pos.lineNumber, pos.column);
    };
    editor.onDidChangeCursorPosition(onCursor);

    // Selection tracking (only when the selection actually changes).
    const onSelection = () => {
      const model = editor.getModel();
      if (!model) return;
      const sel = editor.getSelection();
      if (!sel || sel.isEmpty()) {
        selectionRef.current = null;
        onSelectionChangeRef.current?.(null);
        return;
      }
      const selectedText = model.getValueInRange({
        startLineNumber: sel.startLineNumber,
        startColumn: sel.startColumn,
        endLineNumber: sel.endLineNumber,
        endColumn: sel.endColumn,
      });
      const next: AISelectionContext = {
        selectedText,
        startLine: sel.startLineNumber,
        startColumn: sel.startColumn,
        endLine: sel.endLineNumber,
        endColumn: sel.endColumn,
      };
      // Avoid re-broadcasting identical selections.
      if (
        selectionRef.current &&
        selectionRef.current.selectedText === next.selectedText &&
        selectionRef.current.startLine === next.startLine &&
        selectionRef.current.startColumn === next.startColumn &&
        selectionRef.current.endLine === next.endLine &&
        selectionRef.current.endColumn === next.endColumn
      ) {
        return;
      }
      selectionRef.current = next;
      onSelectionChangeRef.current?.(next);
    };
    editor.onDidChangeCursorSelection(onSelection);

    // Expose an imperative handle so WorkspaceEditor can apply AI edits and
    // read the live content without prop-drilling.
    if (editorApiRef) {
      editorApiRef.current = {
        getEditor: () => editor,
        getLiveContent: () => session.text.toString(),
        getSelection: () => selectionRef.current,
        applyAISelectionEdit: (input) => applySelectionEdit(input),
        applyAIWholeFileEdit: (input) => applyWholeFileEdit(input),
      };
    }
  };

  const beforeMount = (monaco: Monaco) => {
    monaco.editor.defineTheme("epsilon-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b7a6b", fontStyle: "italic" },
        { token: "keyword", foreground: "c7ff24" },
        { token: "string", foreground: "a3e635" },
        { token: "number", foreground: "00d4ff" },
        { token: "type", foreground: "7c5cff" },
        { token: "identifier", foreground: "e5e7eb" },
        { token: "delimiter", foreground: "9ca3af" },
      ],
      colors: {
        "editor.background": "#0B1118",
        "editor.foreground": "#E5E7EB",
        "editor.lineHighlightBackground": "#FFFFFF0A",
        "editorCursor.foreground": "#c7ff24",
        "editor.selectionBackground": "#c7ff2422",
        "editorLineNumber.foreground": "#3d4a3d",
        "editorLineNumber.activeForeground": "#c7ff24",
        "editorIndentGuide.background": "#FFFFFF12",
        "editorIndentGuide.activeBackground": "#FFFFFF22",
        "editorWhitespace.foreground": "#FFFFFF18",
        "editorGutter.background": "#0B1118",
      },
    });
    monaco.editor.setTheme("epsilon-dark");
  };

  return (
    <Editor
      height="100%"
      width="100%"
      path={path}
      language={language}
      theme="vs-dark"
      beforeMount={beforeMount}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
        fontLigatures: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "off",
        renderLineHighlight: "all",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        padding: { top: 14 },
        glyphMargin: false,
        folding: true,
        lineNumbersMinChars: 4,
        readOnly: !session.canWrite,
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      }}
    />
  );
}
