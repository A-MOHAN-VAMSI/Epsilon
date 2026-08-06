export type FileType = "file" | "folder";

export type StarterFile = {
  name: string;
  language: string;
  content: string;
};

/** Map a file name to a Monaco language id. */
export function languageFromFileName(name: string): string {
  const lower = name.toLowerCase();

  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs")) return "javascript";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".cxx") || lower.endsWith(".hpp") || lower.endsWith(".hh")) return "cpp";
  if (lower.endsWith(".c") || lower.endsWith(".h")) return "c";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".txt")) return "plaintext";
  if (lower.endsWith(".sql")) return "sql";
  if (lower.endsWith(".sh") || lower.endsWith(".bash")) return "shell";
  if (lower.endsWith(".xml")) return "xml";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".rb")) return "ruby";
  if (lower.endsWith(".php")) return "php";

  return "plaintext";
}

/** Human-friendly language label for the status bar. */
export function languageLabel(fileName: string, fallback?: string | null): string {
  if (fallback) return fallback;
  const id = languageFromFileName(fileName);
  const map: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    json: "JSON",
    html: "HTML",
    css: "CSS",
    markdown: "Markdown",
    plaintext: "Plain Text",
    sql: "SQL",
    shell: "Shell",
    xml: "XML",
    yaml: "YAML",
    rust: "Rust",
    go: "Go",
    ruby: "Ruby",
    php: "PHP",
  };
  return map[id] ?? "Plain Text";
}

/** Starter file for a new workspace based on its language. */
export function starterFileForWorkspace(workspaceLanguage: string | null | undefined): StarterFile {
  switch (workspaceLanguage) {
    case "JavaScript":
      return { name: "index.js", language: "javascript", content: "console.log('Hello, EPSILON');\n" };
    case "TypeScript":
      return { name: "index.ts", language: "typescript", content: "const message: string = 'Hello, EPSILON';\nconsole.log(message);\n" };
    case "Python":
      return { name: "main.py", language: "python", content: "print('Hello, EPSILON')\n" };
    case "Java":
      return { name: "Main.java", language: "java", content: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, EPSILON\");\n    }\n}\n" };
    case "C++":
      return { name: "main.cpp", language: "cpp", content: "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, EPSILON\" << std::endl;\n    return 0;\n}\n" };
    case "Blank":
    default:
      return { name: "README.md", language: "markdown", content: "# Welcome to EPSILON\n\nStart writing your code here.\n" };
  }
}
