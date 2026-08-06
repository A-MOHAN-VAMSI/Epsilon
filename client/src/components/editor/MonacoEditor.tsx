"use client";

import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

type MonacoEditorProps = {
  value: string;
  language: string;
  path: string;
  onChange: (value: string) => void;
  onMount?: (editor: unknown) => void;
};

export default function MonacoEditor({ value, language, path, onChange, onMount }: MonacoEditorProps) {
  const onMountRef = useRef(onMount);
  onMountRef.current = onMount;

  // Debounced value changes should not reset cursor position when switching tabs.
  const handleMount: OnMount = (editor) => {
    onMountRef.current?.(editor);
  };

  useEffect(() => {
    return () => {
      // no-op cleanup; Monaco instance is managed by the wrapper
    };
  }, []);

  return (
    <Editor
      height="100%"
      width="100%"
      path={path}
      language={language}
      value={value}
      onChange={(val) => onChange(val ?? "")}
      onMount={handleMount}
      theme="vs-dark"
      beforeMount={(monaco) => {
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
      }}
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
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      }}
    />
  );
}
