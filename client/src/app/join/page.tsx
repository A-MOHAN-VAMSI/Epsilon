"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { clearSession, getCurrentUser } from "@/lib/supabaseAuth";
import { acceptInvite } from "@/lib/memberService";

type Status = "loading" | "done" | "unauthorized" | "invalid";

export default function JoinPage() {
  return (
    <Suspense fallback={<PageFallback />}> 
      <JoinPageContent />
    </Suspense>
  );
}

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("invite") ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus("invalid");
        setMessage("This invite link is invalid.");
        return;
      }

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        clearSession();
        router.replace(`/login?next=/join?invite=${encodeURIComponent(token)}`);
        return;
      }

      try {
        const result = await acceptInvite(token);
        if (!result) {
          setStatus("invalid");
          setMessage("This invite link is invalid or has expired.");
          return;
        }
        setStatus("done");
        setMessage(
          result.alreadyMember
            ? "You are already a member of this workspace."
            : "You have joined the workspace."
        );
        setTimeout(() => router.replace(`/workspace/${result.workspaceId}`), 1200);
      } catch {
        setStatus("invalid");
        setMessage("We could not accept this invite. Please try again.");
      }
    }

    void run();
  }, [token, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-background)] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_28px_80px_rgba(0,0,0,0.4)]">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <LoaderCircle size={28} className="animate-spin text-[var(--color-primary)]" />
            <p className="mt-4 text-sm text-white/60">Joining workspace...</p>
          </div>
        )}

        {status === "done" && (
          <div className="flex flex-col items-center">
            <CheckCircle2 size={32} className="text-[var(--color-primary)]" />
            <h1 className="mt-4 text-lg font-semibold text-white">Invite accepted</h1>
            <p className="mt-2 text-sm text-white/55">{message}</p>
            <p className="mt-4 text-xs text-white/35">Redirecting to workspace...</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="flex flex-col items-center">
            <XCircle size={32} className="text-red-400" />
            <h1 className="mt-4 text-lg font-semibold text-white">Invite not valid</h1>
            <p className="mt-2 text-sm text-white/55">{message}</p>
            <button
              type="button"
              onClick={() => router.replace("/dashboard")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-all hover:brightness-105"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        )}

        {status === "unauthorized" && (
          <div className="flex flex-col items-center">
            <XCircle size={32} className="text-red-400" />
            <h1 className="mt-4 text-lg font-semibold text-white">Sign in required</h1>
            <p className="mt-2 text-sm text-white/55">Please sign in to accept this invite.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function PageFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-background)] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_28px_80px_rgba(0,0,0,0.4)]">
        <p className="text-sm text-white/60">Preparing workspace join...</p>
      </div>
    </main>
  );
}
