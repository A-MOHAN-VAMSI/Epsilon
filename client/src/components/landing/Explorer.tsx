import { ChevronDown, ChevronRight, FileCode2, Folder } from "lucide-react";

const tree = [
  { name: "src", open: true }, { name: "app", indent: 1, open: true }, { name: "main.tsx", indent: 2, file: true, active: true },
  { name: "components", indent: 1, open: true }, { name: "editor", indent: 2, open: true }, { name: "Presence.tsx", indent: 3, file: true },
  { name: "hooks", indent: 1 }, { name: "services", indent: 1 }, { name: "lib", indent: 1 }, { name: "utils", indent: 1 }, { name: "types", indent: 1 }, { name: "styles", indent: 1 }, { name: "workspace.ts", indent: 2, file: true },
];

export default function Explorer() {
  return (
    <aside className="w-[19%] min-w-[158px] max-w-[220px] border-r border-white/10 bg-white/[0.02] px-3 py-4">
      <div className="mb-4 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">Explorer</div>
      <div className="space-y-0.5">
        {tree.map((item) => <div key={`${item.indent}-${item.name}`} className="flex items-center gap-2 rounded py-1 pr-2 text-xs text-white/55 transition-colors hover:bg-white/5 hover:text-white/90" style={{ paddingLeft: `${8 + (item.indent ?? 0) * 13}px` }}>
          {item.file ? <FileCode2 size={13} className={item.active ? "text-[#4FC3F7]" : "text-white/40"} /> : item.open ? <ChevronDown size={13} className="text-white/45" /> : <ChevronRight size={13} className="text-white/35" />}
          {!item.file && <Folder size={13} className="-ml-1 text-[var(--color-primary)]/80" />}
          <span className={item.active ? "font-medium text-[var(--color-text)]" : "truncate"}>{item.name}</span>
        </div>)}
      </div>
    </aside>
  );
}
