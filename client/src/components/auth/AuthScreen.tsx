"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { googleSignInUrl, saveSession, signIn, signUp } from "@/lib/supabaseAuth";
import { AuthLayout, AuthCard, AuthHeader, AuthTabs } from "./index";

type AuthMode = "login" | "register";
type AuthScreenProps = { mode: AuthMode };

export default function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const notice = new URLSearchParams(window.location.search).get("notice");

    if (notice === "confirmed") {
      setMessage("Email confirmed successfully. Please sign in.");
    } else if (notice === "missing-session") {
      setMessage("Email confirmation completed. Please sign in to continue.");
    } else if (notice === "callback-error") {
      setMessage("We could not complete authentication. Please sign in again.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const name = String(form.get("name") || "");
    setLoading(true); setMessage("");
    try {
      const result = isRegister ? await signUp(name, email, password) : await signIn(email, password);
      if (result.access_token && result.refresh_token) { saveSession(result); router.push("/dashboard"); return; }
      setMessage("Check your email to confirm your account, then sign in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title={isRegister ? "Create your workspace" : "Welcome back"}
          subtitle={
            isRegister
              ? "Start collaborating in real time — free forever tier, no credit card."
              : "Sign in to jump back into your team's codebase."
          }
        />

        <AuthTabs activeTab={mode} />

        <form onSubmit={submit} className="mt-8 space-y-4">
          {isRegister && (
            <label className="block text-sm font-medium">
              Display name
              <input
                required
                name="name"
                placeholder="Ada Lovelace"
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/10 px-4 text-white outline-none transition placeholder:text-white/35 focus:border-[var(--color-primary)]/60"
              />
            </label>
          )}

          <label className="block text-sm font-medium">
            Email
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/10 px-4 text-white outline-none transition placeholder:text-white/35 focus:border-[var(--color-primary)]/60"
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              required
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={6}
              placeholder="••••••••"
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/10 px-4 text-white outline-none transition placeholder:text-white/35 focus:border-[var(--color-primary)]/60"
            />
          </label>

          {message && (
            <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75" role="status">
              {message}
            </p>
          )}

          <button
            disabled={loading}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[#0a0e0a] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
          >
            {loading && <LoaderCircle size={16} className="animate-spin" />}
            {isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-7 flex items-center gap-3 text-xs text-white/35 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
          or
        </div>

        <button
          type="button"
          onClick={() => { window.location.assign(googleSignInUrl(window.location.origin)); }}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] text-sm font-medium transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          <span className="text-lg font-bold text-[#4285F4]">G</span>
          Continue with Google
        </button>

        <p className="mt-7 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
          SOC 2 Type II · Your code stays yours
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
