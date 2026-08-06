export type ReasonIcon =
  | "users"
  | "zap"
  | "globe"
  | "cloud"
  | "brain"
  | "shield";

export interface Reason {
  id: string;
  label: string;
  description: string;
  icon: ReasonIcon;
}

export const reasons: Reason[] = [
  {
    id: "realtime-collaboration",
    label: "Real-time collaboration",
    description:
      "Share a live editing session with your entire team. See every keystroke, every cursor — zero lag, zero friction.",
    icon: "users",
  },
  {
    id: "developer-first",
    label: "Developer-first experience",
    description:
      "Powered by Monaco Editor — the same engine behind VS Code. Every shortcut, every refactor tool, right in the browser.",
    icon: "zap",
  },
  {
    id: "zero-setup",
    label: "Zero setup",
    description:
      "Open a link and start coding. No installs, no config files, no wasted time. Your environment is ready in seconds.",
    icon: "globe",
  },
  {
    id: "cloud-synchronization",
    label: "Cloud synchronization",
    description:
      "Your work is always safe. Every change is persisted and synced automatically across every connected device.",
    icon: "cloud",
  },
  {
    id: "ai-ready",
    label: "AI-ready architecture",
    description:
      "Integrate AI assistants natively. Generate code, explain logic, or auto-complete entire functions with one keystroke.",
    icon: "brain",
  },
  {
    id: "remote-teams",
    label: "Built for remote teams",
    description:
      "Designed for distributed teams working across time zones. Async reviews, live sessions, and shared workspaces — all in one place.",
    icon: "shield",
  },
];
