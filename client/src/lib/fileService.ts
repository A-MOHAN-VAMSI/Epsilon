import { getSession } from "./supabaseAuth";

export type WorkspaceFile = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  type: "file" | "folder";
  language: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function config() {
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured for this environment.");
  }
  return { url, anonKey };
}

function authHeaders(anonKey: string, accessToken: string) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function parseError(status: number, payload: unknown): string {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.msg === "string") return record.msg;
    if (typeof record.error === "string") return record.error;
  }
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status >= 500) return "Something went wrong on the server. Please try again.";
  return "An unexpected error occurred. Please try again.";
}

async function fileRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
  expectEmpty?: boolean
): Promise<T> {
  const session = getSession();

  if (!session) {
    throw new Error("You must be signed in to continue.");
  }

  const auth = config();

  const response = await fetch(`${auth.url}/rest/v1${path}`, {
    method,
    headers: authHeaders(auth.anonKey, session.access_token),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => ({}));
    throw new Error(parseError(response.status, payload));
  }

  if (expectEmpty || response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
const selectColumns = "id,workspace_id,parent_id,name,type,language,content,created_at,updated_at";

/** Fetch all files/folders for a workspace. */
export async function getWorkspaceFiles(workspaceId: string): Promise<WorkspaceFile[]> {
  const rows = await fileRequest<WorkspaceFile[]>(
    "GET",
    `/workspace_files?select=${selectColumns}&workspace_id=eq.${encodeURIComponent(workspaceId)}&order=created_at.asc`
  );
  return rows ?? [];
}

type CreateFileInput = {
  workspaceId: string;
  parentId?: string | null;
  name: string;
  type: "file" | "folder";
  language?: string | null;
  content?: string | null;
};

/** Create a file or folder. */
export async function createFile(input: CreateFileInput): Promise<WorkspaceFile> {
  const payload: Record<string, unknown> = {
    workspace_id: input.workspaceId,
    parent_id: input.parentId ?? null,
    name: input.name.trim(),
    type: input.type,
    language: input.language ?? null,
    content: input.content ?? null,
  };

  const [file] = (await fileRequest<WorkspaceFile[]>(
    "POST",
    `/workspace_files?select=${selectColumns}`,
    payload
  )) as WorkspaceFile[];
  if (!file) {
    throw new Error("The item could not be created.");
  }
  return file;
}

/** Persist edited file content. */
export async function updateFileContent(
  id: string,
  content: string
): Promise<void> {
  await fileRequest<void>(
    "PATCH",
    `/workspace_files?id=eq.${encodeURIComponent(id)}`,
    { content },
    true
  );
}
/** Rename a file or folder. */
export async function renameFile(
  id: string,
  name: string
): Promise<void> {
  await fileRequest<void>(
    "PATCH",
    `/workspace_files?id=eq.${encodeURIComponent(id)}`,
    { name: name.trim() },
    true
  );
}

/** Delete a file or folder (cascades to children). */
export async function deleteFile(id: string): Promise<boolean> {
  await fileRequest<void>(
    "DELETE",
    `/workspace_files?id=eq.${encodeURIComponent(id)}`,
    undefined,
    true
  );
  return true;
}
