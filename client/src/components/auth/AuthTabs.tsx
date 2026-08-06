import Link from "next/link";

type AuthTab = "login" | "register";

interface AuthTabsProps {
  activeTab: AuthTab;
}

export default function AuthTabs({ activeTab }: AuthTabsProps) {
  const tabs: { label: string; href: string; key: AuthTab }[] = [
    { label: "Sign in", href: "/login", key: "login" },
    { label: "Create account", href: "/register", key: "register" },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/10 p-1 text-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-xl px-3 py-3 text-center transition-colors ${
            activeTab === tab.key
              ? "bg-[var(--color-primary)] font-medium text-[#0a0e0a]"
              : "text-white/55 hover:text-white"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

