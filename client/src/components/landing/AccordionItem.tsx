"use client";

import { useRef, useState } from "react";
import { FaqItem } from "./faqData";

interface Props {
  item: FaqItem;
  /** Whether this item is the currently-open one */
  isOpen: boolean;
  /** Notify the parent which id was toggled */
  onToggle: (id: string) => void;
}

export default function AccordionItem({ item, isOpen, onToggle }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  function handleToggle() {
    onToggle(item.id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  }

  const panelId = `${item.id}-panel`;
  const triggerId = `${item.id}-trigger`;

  return (
    <div
      className={`
        group
        rounded-2xl
        border
        transition-colors
        duration-300
        ${isOpen
          ? "border-[#C8FF3D]/30 bg-[#C8FF3D]/[0.04]"
          : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12]"}
      `}
    >
      {/* Trigger */}
      <button
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="
          flex
          w-full
          items-center
          justify-between
          gap-5
          p-8
          text-left
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#C8FF3D]/60
          focus-visible:ring-offset-2
          focus-visible:ring-offset-[#050816]
          rounded-2xl
        "
      >
        <span
          className={`
            text-[0.9375rem]
            font-semibold
            leading-snug
            transition-colors
            duration-300
            ${isOpen ? "text-[#C8FF3D]" : "text-white"}
          `}
        >
          {item.question}
        </span>

        {/* Animated chevron — pure CSS rotation, no library */}
        <span
          aria-hidden="true"
          className={`
            flex
            h-6
            w-6
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            transition-all
            duration-300
            ${isOpen
              ? "border-[#C8FF3D]/40 bg-[#C8FF3D]/10 text-[#C8FF3D]"
              : "border-white/10 bg-white/5 text-white/40"}
          `}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/*
        Answer panel — uses CSS grid-template-rows trick for smooth height
        animation without needing to know the content height upfront.
        grid-rows-[0fr] → grid-rows-[1fr] transitions the inner div
        from zero height to its natural height with no JS measurement.
      */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        <div
          ref={contentRef}
          className="overflow-hidden"
        >
          <p className="px-8 pb-8 pt-1 text-sm leading-7 text-white/60">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}
