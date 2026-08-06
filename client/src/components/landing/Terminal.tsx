const output = ["Connected to workspace / epsilon-live", "Workspace synced — 3 collaborators online", "Alice joined #main.tsx", "AI assistant initialized", "Ready for changes"];

export default function Terminal() {
  return <div className="h-[126px] shrink-0 border-t border-white/10 bg-[#080c13] px-4 py-2.5 font-mono text-[10px] leading-5 sm:px-5 sm:text-xs"><div className="mb-1.5 flex items-center justify-between text-white/45"><span className="font-sans text-[10px] font-semibold tracking-[0.12em]">TERMINAL</span><span>bash</span></div><div className="space-y-0.5 text-white/55">{output.map((line, index) => <div key={line} className={index === output.length - 1 ? "text-[var(--color-primary)]" : ""}><span className="mr-2 text-emerald-400">✓</span>{line}</div>)}<div className="mt-0.5"><span className="mr-2 text-[var(--color-primary)]">$</span><span className="inline-block h-3 w-[1px] animate-pulse bg-[var(--color-primary)] align-middle" /></div></div></div>;
}
