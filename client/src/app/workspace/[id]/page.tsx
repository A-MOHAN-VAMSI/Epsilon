"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileQuestion, LoaderCircle } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import WorkspaceEditor from "@/components/editor/WorkspaceEditor";
import { clearSession, getCurrentUser } from "@/lib/supabaseAuth";
import { getWorkspace, getWorkspaceAccess } from "@/lib/workspaceService";
import type { Workspace } from "@/lib/workspaceService";

type Status = "loading" | "ready" | "not-found" | "error";

export default function WorkspacePage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <WorkspacePageContent />
    </Suspense>
  );
}

function WorkspacePageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id;
  const initialFileId = searchParams.get("file");

const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [access, setAccess] = useState<{ role: "owner" | "editor" | "viewer"; isOwner: boolean } | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!id) {
      setStatus("not-found");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          clearSession();
          router.replace("/login");
          return;
        }

        const ws = await getWorkspace(id);
        if (cancelled) return;

        if (!ws) {
          setStatus("not-found");
          return;
        }

        // Determine the user's role (owner via ownership, else membership).
        const wsAccess = await getWorkspaceAccess(id);
        if (cancelled) return;

        if (!wsAccess) {
          // Not a member/owner — the RLS layer already blocks read.
          setStatus("not-found");
          return;
        }

        setUser({
          id: currentUser.id,
          name: currentUser.displayName ?? currentUser.email,
          email: currentUser.email,
        });
        setWorkspace(ws);
        setAccess(wsAccess);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (status === "loading" || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-background)]" aria-busy="true">
        <div className="flex items-center gap-3 text-sm text-white/55">
          <LoaderCircle size={18} className="animate-spin text-[var(--color-primary)]" />
          Loading workspace...
        </div>
      </main>
    );
  }

  if (status === "not-found") {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-background)] px-6">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/50">
            <FileQuestion size={28} />
          </span>
          <h1 className="mt-6 text-2xl font-semibold text-white">Workspace not found</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
            This workspace does not exist, or you do not have access to it.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[#07100b] transition-all hover:brightness-105"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

if (status === "error" || !workspace || !access) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-background)] px-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
            We could not load this workspace. Please try again.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[#07100b] transition-all hover:brightness-105"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

return (
    <AppShell title={workspace.name} user={user}>
<WorkspaceEditor
        workspaceId={workspace.id}
        workspaceLanguage={workspace.language}
        workspaceName={workspace.name}
        initialFileId={initialFileId}
        userId={user.id}
        userName={user.name}
        role={access.role}
        isOwner={access.isOwner}
        onBack={() => router.replace("/dashboard")}
      />
    </AppShell>
  );
}
function PageFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-background)] px-6">
      <div className="flex items-center gap-3 text-sm text-white/55">
        <LoaderCircle size={18} className="animate-spin text-[var(--color-primary)]" />
        <span>Loading workspace...</span>
      </div>
    </main>
  );
}