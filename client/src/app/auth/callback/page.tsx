"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getCallbackSession,
  isEmailConfirmationCallback,
  saveSession,
} from "@/lib/supabaseAuth";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function completeAuthentication() {
      const callbackUrl = new URL(window.location.href);

      try {
        const session = await getCallbackSession(callbackUrl);

        if (session) {
          saveSession(session);
          router.replace("/dashboard");
          return;
        }

        router.replace(
          isEmailConfirmationCallback(callbackUrl)
            ? "/login?notice=confirmed"
            : "/login?notice=missing-session"
        );
      } catch {
        router.replace("/login?notice=callback-error");
      }
    }

    void completeAuthentication();
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#090d0a] text-sm text-white/65">
      Completing sign in...
    </main>
  );
}
