import { Bot } from "lucide-react";
import { Fragment, type ReactNode } from "react";

type AIMessageProps = {
  message: {
    role: "user" | "assistant";
    content: string;
  };
};

function formatInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(`[^`]*`)/g).map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code key={index} className="rounded px-1 font-mono text-[.92em] text-[var(--color-primary)] bg-white/10">
          {segment.slice(1, -1)}
        </code>
      );
    }
    return segment;
  });
}

function renderMarkdown(content: string): ReactNode {
  const nodes: ReactNode[] = [];
  const codeBlockRegex = /```([^\n\r]*)\r?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, language, codeText] = match;
    const before = content.slice(lastIndex, match.index);
    if (before) {
      nodes.push(
        <p key={`text-${keyIndex++}`} className="whitespace-pre-wrap break-words text-sm leading-7">
          {before.split(/\r?\n/).map((line, lineIndex) => (
            <Fragment key={`${keyIndex}-${lineIndex}`}>
              {lineIndex > 0 ? <br /> : null}
              {formatInlineMarkdown(line)}
            </Fragment>
          ))}
        </p>
      );
    }

    const safeLanguage = language.trim().replace(/[^a-zA-Z0-9_-]/g, "") || "code";
    nodes.push(
      <div key={`code-${keyIndex++}`} className="overflow-x-auto rounded-2xl border border-white/10 bg-[#020712]/95 px-4 py-4 text-sm text-white">
        <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-white/45">{safeLanguage}</div>
        <pre className="whitespace-pre-wrap font-mono leading-6 text-[0.95em]">
          <code>{codeText.replace(/\r?\n$/, "")}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + fullMatch.length;
  }

  const remaining = content.slice(lastIndex);
  if (remaining) {
    nodes.push(
      <p key={`text-${keyIndex++}`} className="whitespace-pre-wrap break-words text-sm leading-7">
        {remaining.split(/\r?\n/).map((line, lineIndex) => (
          <Fragment key={`${keyIndex}-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {formatInlineMarkdown(line)}
          </Fragment>
        ))}
      </p>
    );
  }

  return <div className="space-y-4">{nodes}</div>;
}

export default function AIMessage({ message }: AIMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl border px-4 py-3 text-sm leading-7 shadow-[0_10px_24px_rgba(0,0,0,0.12)] sm:px-4.5 ${
          isUser
            ? "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.12] text-white"
            : "border-white/10 bg-[#07131f]/90 text-white/80"
        }`}
      >
        {!isUser && (
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.12]">
              <Bot size={14} />
            </span>
            EPSILON AI
          </div>
        )}
        {renderMarkdown(message.content)}
      </div>
    </div>
  );
}
