import Link from "next/link";

export default function HeroButtons() {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
      <Link
        href="/register"
        className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-7 py-3.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(199,255,36,0.28)]"
      >
        Start building free&nbsp;&rarr;
      </Link>
      <Link
        href="#editor"
        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-7 py-3.5 text-sm font-medium text-[var(--color-text)] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
      >
        Watch 90s demo
      </Link>
    </div>
  );
}
