import { Circle, Share2 } from "lucide-react";
import EditorTabs from "./EditorTabs";

export default function EditorHeader() {
  return (
    <div className="relative flex h-[74px] items-start border-b border-white/10 bg-[#0d131e]/95">
      <div className="flex h-11 w-[104px] shrink-0 items-center gap-2 px-5">
        <Circle size={11} fill="#ff5f57" color="#ff5f57" />
        <Circle size={11} fill="#febc2e" color="#febc2e" />
        <Circle size={11} fill="#28c840" color="#28c840" />
      </div>
      <EditorTabs />
      <div className="ml-auto flex h-11 shrink-0 items-center gap-3 px-4 text-xs">
        <span className="hidden items-center gap-1.5 text-[var(--color-primary)] sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-primary)]" />Online</span>
        <button className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 transition-colors hover:border-[var(--color-primary)] hover:bg-white/[0.07]"><Share2 size={12} /><span className="hidden sm:inline">Share</span></button>
      </div>
    </div>
  );
}
