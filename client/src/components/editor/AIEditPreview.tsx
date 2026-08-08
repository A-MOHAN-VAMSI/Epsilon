"use client";

import dynamic from "next/dynamic";
import { LoaderCircle } from "lucide-react";

const DiffEditor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.DiffEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2 text-xs text-white/50">
      <LoaderCircle size={14} className="animate-spin text-[var(--color-primary)]" />
      Loading diff...
    </div>
  ),
});

type AIEditPreviewProps = {
  original: string;
  modified: string;
  language: string;
  path: string;
  lineRange?: { startLine: number; endLine: number } | null;
};

export default function AIEditPreview({
  original,
  modified,
  language,
  path,
  lineRange,
}: AIEditPreviewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0d141c]/90 px-3 py-2">
        <span className="truncate text-xs font-medium text-white/70">{path}</span>
        {lineRange ? (
          <span className="shrink-0 text-[11px] uppercase tracking-[0.15em] text-white/40">
            Lines {lineRange.startLine}–{lineRange.endLine}
          </span>
        ) : (
          <span className="shrink-0 text-[11px] uppercase tracking-[0.15em] text-white/40">
            Whole file
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <DiffEditor
          language={language}
          original={original}
          modified={modified}
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
                "diffEditor.insertedTextBackground": "#22c55e1A",
                "diffEditor.removedTextBackground": "#ef44441A",
              },
            });
            monaco.editor.setTheme("epsilon-dark");
          }}
          options={{
            readOnly: true,
            renderSideBySide: true,
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "off",
            renderOverviewRuler: true,
            enableSplitViewResizing: false,
            originalEditable: false,
            padding: { top: 10 },
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
}}
        />
      </div>
    </div>
  );
}
