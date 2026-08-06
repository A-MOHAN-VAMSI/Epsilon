"use client";

import { ArrowUp } from "lucide-react";

export default function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors duration-200 hover:text-[#C8FF3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF3D]/60"
      aria-label="Back to top"
    >
      Back to top
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
