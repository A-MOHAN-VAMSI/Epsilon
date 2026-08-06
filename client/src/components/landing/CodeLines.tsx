type Token = { text: string; cls: string };

const code: Token[][] = [
  [{ text: "import", cls: "text-[#C678DD]" }, { text: " { useMemo } ", cls: "text-white" }, { text: "from", cls: "text-[#C678DD]" }, { text: ' "react";', cls: "text-[#98C379]" }],
  [{ text: "import", cls: "text-[#C678DD]" }, { text: " { Workspace, Presence } ", cls: "text-white" }, { text: "from", cls: "text-[#C678DD]" }, { text: ' "@epsilon/core";', cls: "text-[#98C379]" }],
  [],
  [{ text: "interface", cls: "text-[#C678DD]" }, { text: " EditorPreviewProps ", cls: "text-[#E5C07B]" }, { text: "{", cls: "text-white" }],
  [{ text: "  workspaceId", cls: "text-[#56B6C2]" }, { text: ": ", cls: "text-white" }, { text: "string", cls: "text-[#E5C07B]" }],
  [{ text: "  isLive", cls: "text-[#56B6C2]" }, { text: ": ", cls: "text-white" }, { text: "boolean", cls: "text-[#E5C07B]" }],
  [{ text: "}", cls: "text-white" }], [],
  [{ text: "export", cls: "text-[#C678DD]" }, { text: " function", cls: "text-[#C678DD]" }, { text: " EditorPreview", cls: "text-[#61AFEF]" }, { text: "({ workspaceId, isLive }", cls: "text-white" }, { text: ": ", cls: "text-white" }, { text: "EditorPreviewProps", cls: "text-[#E5C07B]" }, { text: ") {", cls: "text-white" }],
  [{ text: "  ", cls: "text-white" }, { text: "const", cls: "text-[#C678DD]" }, { text: " collaborators ", cls: "text-[#56B6C2]" }, { text: "= ", cls: "text-white" }, { text: "useMemo", cls: "text-[#61AFEF]" }, { text: "(() ", cls: "text-white" }, { text: "=>", cls: "text-[#C678DD]" }, { text: " [\"Alice\", \"Bob\", \"Emma\"], []);", cls: "text-[#98C379]" }], [],
  [{ text: "  ", cls: "text-white" }, { text: "// Keep every teammate in sync in real time.", cls: "text-white/40" }],
  [{ text: "  ", cls: "text-white" }, { text: "return", cls: "text-[#C678DD]" }, { text: " (", cls: "text-white" }],
  [{ text: "    <", cls: "text-white" }, { text: "Workspace", cls: "text-[#E06C75]" }, { text: " id={workspaceId} live={isLive}>", cls: "text-[#56B6C2]" }],
  [{ text: "      <", cls: "text-white" }, { text: "Presence", cls: "text-[#E06C75]" }, { text: " users={collaborators} />", cls: "text-[#56B6C2]" }],
  [{ text: "      <", cls: "text-white" }, { text: "main", cls: "text-[#E06C75]" }, { text: " className=", cls: "text-[#56B6C2]" }, { text: '"editor-shell"', cls: "text-[#98C379]" }, { text: ">", cls: "text-white" }],
  [{ text: "        <", cls: "text-white" }, { text: "Editor", cls: "text-[#E06C75]" }, { text: " language=", cls: "text-[#56B6C2]" }, { text: '"typescript"', cls: "text-[#98C379]" }, { text: " />", cls: "text-white" }],
  [{ text: "      </", cls: "text-white" }, { text: "main", cls: "text-[#E06C75]" }, { text: ">", cls: "text-white" }],
  [{ text: "    </", cls: "text-white" }, { text: "Workspace", cls: "text-[#E06C75]" }, { text: ">", cls: "text-white" }],
  [{ text: "  );", cls: "text-white" }],
  [{ text: "}", cls: "text-white" }], [], [], [], [], [], [], [], [], [],
];

export default function CodeLines() {
  return <div className="min-w-max flex-1 px-4 py-4 font-mono text-[11px] leading-6 tracking-[0.01em] sm:px-5 sm:text-[13px]">{code.map((line, index) => <div key={index} className="whitespace-pre">{line.length ? line.map((token, tokenIndex) => <span key={tokenIndex} className={token.cls}>{token.text}</span>) : <span>&nbsp;</span>}</div>)}</div>;
}
