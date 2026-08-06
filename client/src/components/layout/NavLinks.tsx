"use client";

import Link from "next/link";

const links = [
  {
    label: "Features",
    href: "#features",
  },
  {
    label: "Editor",
    href: "#editor",
  },
  {
    label: "Architecture",
    href: "#architecture",
  },
  {
    label: "GitHub",
    href: "https://github.com",
  },
];

export default function NavLinks() {
  return (
    <nav className="hidden items-center gap-10 lg:flex">
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className="
            relative
            text-sm
            font-medium
            tracking-wide
            text-[var(--color-text-muted)]
            transition-all
            duration-300
            hover:text-[var(--color-text)]
            after:absolute
            after:-bottom-2
            after:left-0
            after:h-px
            after:w-0
            after:bg-[var(--color-primary)]
            after:transition-all
            after:duration-300
            hover:after:w-full
          "
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}