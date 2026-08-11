"use client";

import Link from "next/link";
import { ChevronDown, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Logo, NavLinks } from "@/components/layout";
import { clearSession, isAuthenticated } from "@/lib/supabaseAuth";

export default function Navbar() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [menuOpen]);

  function handleLogout() {
    clearSession();
    setMenuOpen(false);
    setAuthenticated(false);
    router.push("/");
  }

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/[0.09] bg-[#090d0a]/90 backdrop-blur-xl">
      <Container className="max-w-[1520px]">
        <nav className="flex h-20 items-center justify-between">
          <Logo />
          <NavLinks />

          <div className="hidden items-center gap-6 lg:flex">
            {authenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold !text-[#07100b] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(199,255,36,0.25)]"
                >
                  Dashboard
                </Link>

                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label="Open profile menu"
                    className="flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-white/70 transition-colors hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
                  >
                    <User size={16} aria-hidden="true" />
                    <ChevronDown
                      size={14}
                      aria-hidden="true"
                      className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-3 w-40 rounded-xl border border-white/10 bg-[#090d0a] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.4)]"
                    >
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold !text-[#07100b] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(199,255,36,0.25)]"
                >
                  Start Building
                </Link>
              </>
            )}
          </div>
        </nav>
      </Container>
    </header>
  );
}
