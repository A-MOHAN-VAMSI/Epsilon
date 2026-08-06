import { getCurrentUser, getSession } from "./supabaseAuth";

export type Workspace = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  language: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceCreateInput = {
  name: string;
  description?: string;
  language?: string;
};

export type WorkspaceUpdateInput = {
  name?: string;
  description?: string;
  language?: string;
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
  if (status === 404) return "The requested workspace could not be found.";
  if (status >= 500) return "Something went wrong on the server. Please try again later.";
  return "An unexpected error occurred. Please try again.";
}

async function workspaceRequest<T>(
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

  return (await response.json()) as T;
}

const selectColumns = "id,name,description,owner_id,language,created_at,updated_at";

/** Create a new workspace owned by the authenticated user. */
export async function createWorkspace(input: WorkspaceCreateInput): Promise<Workspace> {
  const user = await getCurrentUserId();
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    owner_id: user,
    description: input.description?.trim() || null,
    language: input.language || null,
  };

  const [workspace] = (await workspaceRequest<Workspace[]>("POST", "/workspaces?select=" + selectColumns, payload)) as Workspace[];
  if (!workspace) {
    throw new Error("Workspace could not be created. Please try again.");
  }
  return workspace;
}

export type WorkspaceAccess = {
  role: "owner" | "editor" | "viewer";
  isOwner: boolean;
};

/** Fetch every workspace the authenticated user can access (owned OR shared). */
export async function getUserWorkspaces(): Promise<Workspace[]> {
  const workspaces = await workspaceRequest<Workspace[]>(
    "GET",
    `/workspaces?select=${selectColumns}&order=updated_at.desc`
  );
  return workspaces ?? [];
}

/**
 * Determine the current user's access level for a workspace.
 * Ownership is authoritative (workspaces.owner_id). Otherwise the role
 * comes from workspace_members. Returns null if the user has no access.
 */
export async function getWorkspaceAccess(
  workspaceId: string
): Promise<WorkspaceAccess | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const session = getSession();
  if (!session) return null;
  const auth = config();

  // 1. Check ownership first (authoritative).
  const wsResp = await fetch(
    `${auth.url}/rest/v1/workspaces?select=owner_id&id=eq.${encodeURIComponent(workspaceId)}&limit=1`,
    {
      headers: authHeaders(auth.anonKey, session.access_token),
    }
  );
  if (!wsResp.ok) return null;
  const workspaces: unknown = await wsResp.json().catch(() => []);
  const ws = Array.isArray(workspaces) ? workspaces[0] : null;
  if (ws && (ws as Record<string, unknown>).owner_id === user.id) {
    return { role: "owner", isOwner: true };
  }

  // 2. Otherwise check membership.
  const memberResp = await fetch(
    `${auth.url}/rest/v1/workspace_members?select=role&workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
    {
      headers: authHeaders(auth.anonKey, session.access_token),
    }
  );
  if (!memberResp.ok) return null;
  const members: unknown = await memberResp.json().catch(() => []);
  const member = Array.isArray(members) ? members[0] : null;
  if (member && (member as Record<string, unknown>).role) {
    const role = (member as Record<string, unknown>).role as "owner" | "editor" | "viewer";
    return { role, isOwner: role === "owner" };
  }

  return null;
}

/** Fetch a single workspace owned by the authenticated user (null if not found / not owned). */
export async function getWorkspace(id: string): Promise<Workspace | null> {
  const rows = await workspaceRequest<Workspace[]>(
    "GET",
    `/workspaces?select=${selectColumns}&id=eq.${encodeURIComponent(id)}&limit=1`
  );
  return rows?.[0] ?? null;
}

/** Update name, description and/or language of an owned workspace. */
export async function updateWorkspace(
  id: string,
  input: WorkspaceUpdateInput
): Promise<Workspace | null> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description.trim() || null;
  if (input.language !== undefined) payload.language = input.language || null;

  const [workspace] = (await workspaceRequest<Workspace[]>(
    "PATCH",
    `/workspaces?select=${selectColumns}&id=eq.${encodeURIComponent(id)}`,
    payload
  )) as Workspace[];
  return workspace ?? null;
}

/** Delete an owned workspace. Returns true when deleted. */
export async function deleteWorkspace(id: string): Promise<boolean> {
  await workspaceRequest<void>(
    "DELETE",
    `/workspaces?id=eq.${encodeURIComponent(id)}`,
    undefined,
    true
  );
  return true;
}

async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Your session has expired. Please sign in again.");
  return user.id;
}

