import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 select-none"
    >
      <div
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          border
          border-white/10
          bg-white/[0.03]
          text-lg
          font-semibold
          text-[var(--color-primary)]
          transition-all
          duration-300
          hover:border-[var(--color-primary)]
        "
      >
        ε
      </div>

      <span
        className="
          text-lg
          font-medium
          tracking-[0.25em]
          text-[var(--color-text)]
        "
      >
        EPSILON
      </span>
    </Link>
  );
}