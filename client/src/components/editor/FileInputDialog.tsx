"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

type FileInputDialogProps = {
  open: boolean;
  title: string;
  label: string;
  placeholder: string;
  initialValue?: string;
  submitLabel: string;
  loading?: boolean;
  error?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export default function FileInputDialog({
  open,
  title,
  label,
  placeholder,
  initialValue = "",
  submitLabel,
  loading = false,
  error = "",
  onSubmit,
  onCancel,
}: FileInputDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-input-dialog-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#0c120c] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.6)]">
        <h2 id="file-input-dialog-title" className="text-base font-semibold text-white">{title}</h2>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-white/85">
            {label}
            <input
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--color-primary)]/60"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <LoaderCircle size={15} className="animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
