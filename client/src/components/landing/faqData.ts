export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqs: FaqItem[] = [
  {
    id: "faq-what-is-epsilon",
    question: "What exactly is EPSILON?",
    answer:
      "EPSILON is a real-time collaborative code editor that runs entirely in the browser. It is powered by Monaco Editor — the same engine behind VS Code — and lets multiple developers write, review, and run code together in a shared workspace with zero installation required.",
  },
  {
    id: "faq-how-many-collaborators",
    question: "How many people can collaborate at the same time?",
    answer:
      "There is no hard ceiling per session. Each collaborator gets a unique live cursor and presence indicator, so the entire team can see who is online, where they are working, and what they are typing — all in real time.",
  },
  {
    id: "faq-setup",
    question: "Do I need to install anything to get started?",
    answer:
      "Nothing at all. Open a session link in any modern browser and you are in. EPSILON handles the environment, the sync, and the state automatically. There are no extensions, no CLI tools, and no configuration files to deal with.",
  },
  {
    id: "faq-cloud-sync",
    question: "Is my code saved automatically?",
    answer:
      "Yes. Every keystroke is persisted to the cloud in real time. If you close the tab, lose your connection, or switch devices, your work is exactly where you left it when you come back. No manual saves, no lost progress.",
  },
  {
    id: "faq-ai",
    question: "Does EPSILON support AI-assisted coding?",
    answer:
      "AI integration is on the roadmap and will land soon. The architecture is designed to support native AI assistants that can generate snippets, explain selected code, and auto-complete entire functions — all inside the same collaborative session your team is already in.",
  },
  {
    id: "faq-security",
    question: "How does EPSILON handle security and privacy?",
    answer:
      "All sessions are encrypted in transit. Access controls let you decide who can view, edit, or share a workspace. Private sessions are never indexed or visible to third parties. Enterprise plans add SSO, audit logs, and fine-grained permission management.",
  },
];
