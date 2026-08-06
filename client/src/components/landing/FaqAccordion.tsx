"use client";

import { useState } from "react";
import AccordionItem from "./AccordionItem";
import { faqs } from "./faqData";

/**
 * Accordion list component.
 *
 * Manages the open/close state so only one item is expanded at a time
 * (a standard accordion contract). Clicking an already-open item closes it.
 *
 * Accepts no props — reads directly from faqData.ts.
 * To make it generic, pass items as a prop and lift state.
 */
export default function FaqAccordion() {
  const [openId, setOpenId] = useState<string | null>(faqs[0].id);

  function handleToggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col gap-4" role="list">
      {faqs.map((item) => (
        <div key={item.id} role="listitem">
          <AccordionItem
            item={item}
            isOpen={openId === item.id}
            onToggle={handleToggle}
          />
        </div>
      ))}
    </div>
  );
}
