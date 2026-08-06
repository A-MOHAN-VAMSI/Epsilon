export default function LineNumbers({ count = 30 }: { count?: number }) {
  return <div className="select-none border-r border-white/10 px-3 py-4 text-right font-mono text-xs leading-6 text-white/25 sm:px-4">{Array.from({ length: count }, (_, i) => <div key={i}>{i + 1}</div>)}</div>;
}
