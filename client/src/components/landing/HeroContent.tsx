export default function HeroContent() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
      <p className="mb-8 rounded-full border border-white/10 bg-white/[0.025] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-primary)] sm:text-xs"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />v2.0 — live collaboration, now with AI pairing</p>
      <h1 className="mx-auto text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[5.9rem]">Write code <span className="bg-gradient-to-r from-[#c7ff24] to-[#55e989] bg-clip-text text-transparent">together,</span><br />in real time.</h1>
      <p className="mt-9 max-w-3xl text-lg leading-8 text-[var(--color-text-muted)]">EPSILON is a collaborative workspace where your whole team edits, reviews, runs and deploys from the same living codebase. No setup. No merge pain.</p>
    </div>
  );
}
