"use client";

import { useEffect, useRef } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import type { CollabSession } from "@/lib/collabProvider";

type CollaborativeEditorProps = {
  session: CollabSession;
  language: string;
  path: string;
  onCursorChange: (line: number, column: number) => void;
};

export default function CollaborativeEditor({
  session,
  language,
  path,
  onCursorChange,
}: CollaborativeEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);
  const editorRef = useRef<unknown>(null);
  const onCursorChangeRef = useRef(onCursorChange);
  onCursorChangeRef.current = onCursorChange;

  // Cleanup the Yjs<->Monaco binding when the session/file changes.
  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [session.roomId]);

  const handleMount: OnMount = (editor, monaco) => {
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
