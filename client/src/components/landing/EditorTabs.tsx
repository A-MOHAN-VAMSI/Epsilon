const tabs = ["main.tsx", "auth.tsx", "workspace.ts", "settings.ts"];

export default function EditorTabs() {
  return (
    <div className="flex h-[74px] min-w-0 flex-1 items-center overflow-hidden">
      <div className="flex h-full items-end">
        {tabs.map((tab) => {
          const active = tab === "main.tsx";
          return <div key={tab} className={`flex h-11 shrink-0 items-center gap-2 border-r border-white/[0.06] px-3 text-xs transition-colors sm:px-4 sm:text-sm ${active ? "border-t-2 border-t-[var(--color-primary)] bg-[#111925] text-[var(--color-text)]" : "bg-[#0b1018]/40 text-white/40 hover:bg-white/[0.03] hover:text-white/70"}`}><span className={active ? "text-[#4FC3F7]" : "text-white/30"}>TS</span>{tab}{active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />}</div>;
        })}
      </div>
    </div>
  );
}
