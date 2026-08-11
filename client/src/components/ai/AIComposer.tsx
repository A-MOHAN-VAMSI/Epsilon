import { useEffect, useRef, type KeyboardEvent } from "react";
import { Paperclip, SendHorizonal } from "lucide-react";

type AIComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function AIComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask EPSILON AI about your code...",
  disabled = false,
}: AIComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#07111b]/90 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      <label className="sr-only" htmlFor="ai-prompt">
        AI prompt
      </label>
      <textarea
        ref={textareaRef}
        id="ai-prompt"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={4}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-[#08101c]/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--color-primary)]/50 disabled:cursor-not-allowed disabled:opacity-70"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white/45">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#08101c]/70 text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Attach context"
            disabled={disabled}
          >
            <Paperclip size={15} />
          </button>
          <span className="text-xs uppercase tracking-[0.2em]">Enter to send · Shift + Enter for new line</span>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendHorizonal size={15} />
          Send
        </button>
      </div>
    </div>
  );
}
