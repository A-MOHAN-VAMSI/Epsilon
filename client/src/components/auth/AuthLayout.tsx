import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/layout/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-background)] px-5 py-6 text-[var(--color-text)]">
      {/* Subtle Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:linear-gradient(to_right,#b9c4b6_1px,transparent_1px),linear-gradient(to_bottom,#b9c4b6_1px,transparent_1px)] [background-size:72px_72px]" />

      {/* Radial Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(199,255,36,0.08),transparent_70%)] blur-3xl" />

      {/* Header */}
      <header className="relative mx-auto flex max-w-[1520px] items-center justify-between">
        <Logo />
        <Link
          href="/"
          className="hidden items-center gap-2 text-sm text-white/55 transition-colors hover:text-white sm:flex"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </header>

      {/* Centered Content */}
      <div className="relative flex min-h-[calc(100vh-104px)] items-center justify-center py-12">
        {children}
      </div>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
    </main>
  );
}

