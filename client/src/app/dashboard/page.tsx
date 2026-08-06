"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AppShell from "@/components/layout/AppShell";
import { clearSession, getCurrentUser } from "@/lib/supabaseAuth";

type DashboardUser = {
  name: string;
  email: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);

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
    return <main className="min-h-screen bg-[var(--color-background)]" aria-busy="true" />;
  }

  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <AppShell title="Dashboard" user={user}>
      <DashboardLayout name={firstName} />
    </AppShell>
  );
}
