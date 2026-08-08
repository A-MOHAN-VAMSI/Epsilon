export type AIWorkspaceRole = "owner" | "editor" | "viewer";

export type AIFileContext = {
  id: string;
  path: string;
  language: string | null;
  content: string;
};

export type AISelectionContext = {
  selectedText: string;
  startLine: number;
  endLine: number;
};

export type AIActiveFileContext = {
  id: string;
  path: string;
  language: string;
  content?: string | null;
};

export type AIWorkspaceContext = {
  id: string;
  name: string;
  role: AIWorkspaceRole;
  files: AIFileContext[];
  activeFile?: AIActiveFileContext | null;
  selection?: AISelectionContext | null;
  truncated: boolean;
};

type WorkspaceFileRow = {
  id: string;
  workspace_id: string;
  name: string;
  type: "file" | "folder";
  language: string | null;
  content: string | null;
};

type WorkspaceRow = {
  id: string;
  name: string;
  owner_id: string;
};

type WorkspaceMemberRow = {
  role: AIWorkspaceRole;
};

const MAX_FILES = 12;
const MAX_CHARS_PER_FILE = 14000;
const MAX_TOTAL_CHARS = 60000;

const GENERATED_PATH_RE = /(^|\/)(node_modules|\.next|dist|build|coverage|out|vendor|\.git|\.venv|venv|__pycache__|cache)(\/|$)/i;
const IGNORE_EXTENSION_RE = /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|tar|gz|bz2|xz|mp4|mov|avi|mp3|wav|woff2?|ttf|eot|bin|db|sqlite|class|pyc|wasm|lock)$/i;
const IGNORE_FILE_NAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "Cargo.lock",
  "poetry.lock",
  "requirements.txt",
  "Pipfile.lock",
]);

function normalizePath(value: string) {
  return value.replace(/\\/g, "/").replace(/^\/+/, "");
}

function isCodeLikeFile(path: string, type: string | null, language: string | null) {
  if (type !== "file") return false;
  const normalized = normalizePath(path);
  if (!normalized || GENERATED_PATH_RE.test(normalized)) return false;
  if (IGNORE_FILE_NAMES.has(normalized.split("/").at(-1) ?? "")) return false;
  if (IGNORE_EXTENSION_RE.test(normalized)) return false;
  if (!language && !/\.[A-Za-z0-9]+$/.test(normalized)) {
    return false;
  }
  return true;
}

function scoreFileRelevance(filePath: string, prompt: string, activePath?: string) {
  const normalizedPath = normalizePath(filePath).toLowerCase();
  const promptTokens = prompt.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const scoringPath = activePath ? normalizePath(activePath).toLowerCase() : "";

  let score = 0;

  if (scoringPath && normalizedPath === scoringPath) score += 1000;
  if (scoringPath && normalizedPath.endsWith(scoringPath)) score += 200;

  for (const token of promptTokens) {
    if (!token) continue;
    if (normalizedPath.includes(token)) score += 50;
    if (normalizedPath.split("/").some((segment) => segment.includes(token))) score += 10;
  }

  if (normalizedPath.includes("auth")) score += 12;
  if (normalizedPath.includes("config")) score += 8;
  if (normalizedPath.includes("route")) score += 8;
  if (normalizedPath.includes("service")) score += 6;
  if (normalizedPath.includes("component")) score += 6;

  return score;
}

function truncateContent(content: string, maxLength: number) {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 40).trim()}\n\n...[truncated]`;
}

async function fetchSupabaseJson<T>(url: string, token: string): Promise<T> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase authentication is not configured.");
  }

  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function loadWorkspaceAiContext(input: {
  workspaceId: string;
  accessToken: string;
  prompt: string;
  activeFile?: { id: string; path: string; language: string; content?: string | null } | null;
  selection?: { selectedText: string; startLine: number; endLine: number } | null;
}): Promise<AIWorkspaceContext> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase authentication is not configured.");
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${input.accessToken}`,
    },
    cache: "no-store",
  });

  if (!userResponse.ok) {
    throw new Error("Authentication failed.");
  }

  const userPayload = (await userResponse.json()) as { id?: string };
  const userId = userPayload.id;
  if (!userId) {
    throw new Error("Authenticated user could not be resolved.");
  }

  const workspaceQuery = `${supabaseUrl}/rest/v1/workspaces?select=id,name,owner_id&id=eq.${encodeURIComponent(input.workspaceId)}&limit=1`;
  const workspaceRows = await fetchSupabaseJson<WorkspaceRow[]>(workspaceQuery, input.accessToken);
  const workspace = workspaceRows[0];

  if (!workspace) {
    throw new Error("Workspace is not accessible to this user.");
  }

  let role: AIWorkspaceRole = "viewer";
  if (workspace.owner_id === userId) {
    role = "owner";
  } else {
    const memberQuery = `${supabaseUrl}/rest/v1/workspace_members?select=role&workspace_id=eq.${encodeURIComponent(input.workspaceId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`;
    const memberRows = await fetchSupabaseJson<WorkspaceMemberRow[]>(memberQuery, input.accessToken);
    const member = memberRows[0];
    if (!member) {
      throw new Error("Workspace access denied.");
    }
    role = member.role;
  }

  const filesQuery = `${supabaseUrl}/rest/v1/workspace_files?select=id,workspace_id,name,type,language,content&workspace_id=eq.${encodeURIComponent(input.workspaceId)}`;
  const fileRows = await fetchSupabaseJson<WorkspaceFileRow[]>(filesQuery, input.accessToken);

  const relevantFiles = fileRows
    .filter((file) => isCodeLikeFile(file.name, file.type, file.language))
    .map((file) => ({
      id: file.id,
      path: normalizePath(file.name),
      language: file.language,
      content: file.content ?? "",
    }))
    .sort((left, right) => {
      const leftScore = scoreFileRelevance(left.path, input.prompt, input.activeFile?.path);
      const rightScore = scoreFileRelevance(right.path, input.prompt, input.activeFile?.path);
      return rightScore - leftScore;
    });

  const activeFile = input.activeFile
    ? {
        id: input.activeFile.id,
        path: normalizePath(input.activeFile.path),
        language: input.activeFile.language || "plaintext",
        content: truncateContent(input.activeFile.content ?? "", MAX_CHARS_PER_FILE),
      }
    : null;

  const fileList: AIFileContext[] = [];
  let totalChars = 0;
  let truncated = false;

  const seeded = new Set<string>();

  if (activeFile) {
    fileList.push({
      id: activeFile.id,
      path: activeFile.path,
      language: activeFile.language,
      content: activeFile.content,
    });
    seeded.add(activeFile.id);
    totalChars += activeFile.content.length;
  }

  for (const file of relevantFiles) {
    if (seeded.has(file.id)) continue;
    const content = truncateContent(file.content, MAX_CHARS_PER_FILE);
    const nextChars = totalChars + content.length;
    if (nextChars > MAX_TOTAL_CHARS) {
      truncated = true;
      break;
    }
    fileList.push({
      id: file.id,
      path: file.path,
      language: file.language,
      content,
    });
    seeded.add(file.id);
    totalChars = nextChars;
    if (fileList.length >= MAX_FILES) break;
  }

  if (fileList.length === 0 && activeFile) {
    fileList.push({
      id: activeFile.id,
      path: activeFile.path,
      language: activeFile.language,
      content: activeFile.content,
    });
  }

  return {
    id: workspace.id,
    name: workspace.name,
    role,
    files: fileList,
    activeFile,
    selection: input.selection ?? null,
    truncated,
  };
}
