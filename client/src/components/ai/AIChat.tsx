import { useMemo, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import AIComposer from "./AIComposer";
import AIContextSelector from "./AIContextSelector";
import AIMessage from "./AIMessage";
import AIQuickActions from "./AIQuickActions";
import { getSession } from "@/lib/supabaseAuth";
import type { Workspace } from "@/lib/workspaceService";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [contextWorkspace, setContextWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextLabel = useMemo(() => {
    if (!contextWorkspace) return "No workspace selected";
    return contextWorkspace.name;
  }, [contextWorkspace]);

  async function submitPrompt() {
    const trimmed = draft.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: trimmed,
    };

    const loadingMessage: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: "EPSILON AI is thinking...",
    };

    setMessages((current) => [...current, userMessage, loadingMessage]);
    setDraft("");
    setError(null);
    setIsLoading(true);

    try {
      const session = getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : undefined;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          history: [...messages, userMessage].slice(-12).map((message) => ({
            role: message.role,
            content: message.content,
          })),
          workspaceContext: contextWorkspace
            ? { id: contextWorkspace.id, name: contextWorkspace.name }
            : null,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "Something went wrong while generating the response.");
      }

      const assistantText = typeof result.assistantText === "string" ? result.assistantText : "";
      setMessages((current) =>
        current.map((message) =>
          message.id === loadingMessage.id
            ? { ...message, content: assistantText || "EPSILON AI did not return a response." }
            : message
        )
      );
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Something went wrong while generating the response.";
      setError(message);
      setMessages((current) =>
        current.map((message) =>
          message.id === loadingMessage.id
            ? { ...message, content: "EPSILON AI could not complete the request. Please try again." }
            : message
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickAction(prompt: string) {
    setDraft(prompt);
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-6 lg:p-8">
      <div className="rounded-[24px] border border-white/10 bg-[#07111b]/90 p-5 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-2 py-10 text-center sm:py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/[0.1] text-[var(--color-primary)]">
              <Bot size={26} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">How can I help you code?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              Ask questions, generate code, debug errors, explain logic, or improve your implementation.
            </p>
            <div className="mt-6 w-full max-w-3xl">
              <AIQuickActions onSelect={handleQuickAction} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <AIMessage key={message.id} message={message} />
            ))}
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            <Sparkles size={13} className="text-[var(--color-primary)]" />
            Workspace-aware preparation
          </div>
          <AIContextSelector value={contextWorkspace?.id ?? ""} onChange={setContextWorkspace} />
          <div className="rounded-2xl border border-white/10 bg-[#08101c]/70 px-3 py-3 text-sm text-white/60">
            <span className="font-medium text-white/80">Context:</span> {contextLabel}
          </div>
          <AIComposer value={draft} onChange={setDraft} onSubmit={submitPrompt} disabled={isLoading} />
        </div>
      </div>
    </section>
  );
}
