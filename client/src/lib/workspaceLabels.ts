export type WorkspaceLanguage = "JavaScript" | "TypeScript" | "Python" | "Java" | "C++" | "Blank";

export const WORKSPACE_LANGUAGES: WorkspaceLanguage[] = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "Blank",
];

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f7df1e",
  TypeScript: "#4FC3F7",
  Python: "#4B8BBE",
  Java: "#E76F00",
  "C++": "#659AD2",
  Blank: "#9ca3af",
};

export function languageColor(language: string | null | undefined): string {
  if (!language) return LANGUAGE_COLORS.Blank;
  return LANGUAGE_COLORS[language] ?? LANGUAGE_COLORS.Blank;
}

export function formatUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return "Recently updated";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently updated";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `Updated ${days} day${days === 1 ? "" : "s"} ago`;

  return `Updated ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  })}`;
}

