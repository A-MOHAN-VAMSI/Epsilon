"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import AIChat from "@/components/ai/AIChat";
import { clearSession, getCurrentUser } from "@/lib/supabaseAuth";

type AssistantUser = {
  name: string;
  email: string;
};

export default function AssistantPage() {
  const router = useRouter();
  const [user, setUser] = useState<AssistantUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          clearSession();
          router.replace("/login");
          return;
        }

        const name = currentUser.displayName ?? currentUser.email;
        setUser({ name, email: currentUser.email });
      } catch {
        clearSession();
        router.replace("/login");
      }
    }

    void loadUser();
  }, [router]);

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--color-background)]" aria-busy="true">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.035] px-8 py-10 text-center shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/[0.1] text-[var(--color-primary)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 7h8" />
                <path d="M8 12h8" />
                <path d="M8 17h4" />
              </svg>
            </div>
            <h1 className="mt-6 text-xl font-semibold text-white">Preparing AI Assistant</h1>
            <p className="mt-2 text-sm leading-6 text-white/55">Checking your session and loading the assistant experience.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AppShell title="AI Assistant" user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">AI Assistant</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">
                Your AI pair programmer for understanding, debugging, and improving code.
              </p>
            </div>
          </div>
        </div>
        <AIChat />
      </div>
    </AppShell>
  );
}
