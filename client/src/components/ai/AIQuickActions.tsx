import { Bot, Bug, Code2, Sparkles } from "lucide-react";

type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: typeof Bot;
  prompt: string;
};

type AIQuickActionsProps = {
  onSelect: (prompt: string) => void;
};

const actions: QuickAction[] = [
  {
    id: "explain",
    title: "Explain Code",
    description: "Understand what your code does.",
    icon: Code2,
    prompt: "Explain the following code:",
  },
  {
    id: "debug",
    title: "Debug Error",
    description: "Find bugs and suggest fixes.",
    icon: Bug,
    prompt: "Help me debug the following error:",
  },
  {
    id: "generate",
    title: "Generate Code",
    description: "Create code from a description.",
    icon: Sparkles,
    prompt: "Generate code for:",
  },
  {
    id: "refactor",
    title: "Refactor Code",
    description: "Improve structure and readability.",
    icon: Bot,
    prompt: "Refactor and improve the following code:",
  },
];

export default function AIQuickActions({ onSelect }: AIQuickActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onSelect(action.prompt)}
            className="group rounded-2xl border border-white/10 bg-[#07111b]/80 p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)]/35 hover:bg-[#0b1621]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#08101c]/80 text-[var(--color-primary)]">
                <Icon size={16} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">{action.title}</h3>
                <p className="mt-1 text-xs leading-5 text-white/55">{action.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
