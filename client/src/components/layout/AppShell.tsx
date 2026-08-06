import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  user: { name: string; email: string };
};

export default function AppShell({ children, title, user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <Sidebar user={user} />
      <div className="lg:pl-72">
        <TopNavbar title={title} user={user} />
        <main className="min-h-[calc(100vh-4.5rem)] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
