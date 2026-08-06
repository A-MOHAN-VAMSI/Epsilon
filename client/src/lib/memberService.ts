import { getSession } from "./supabaseAuth";

export type MemberRole = "owner" | "editor" | "viewer";

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
};

export type WorkspaceInvite = {
  id: string;
  workspace_id: string;
  token: string;
  role: MemberRole;
  created_by: string;
  created_at: string;
  expires_at: string | null;
};

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured for this environment.");
  }
  return { url, anonKey };
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
  if (status === 404) return "The requested item could not be found.";
  if (status >= 500) return "Something went wrong on the server. Please try again.";
  return "An unexpected error occurred. Please try again.";
}

function authHeaders(
  anonKey: string,
  accessToken: string,
  preferRepresentation = false
): HeadersInit {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...(preferRepresentation
      ? { Prefer: "return=representation" }
      : {}),
  };
}

async function memberRequest<T>(
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

  // POST/PATCH need the inserted/updated row back because several
  // functions below expect WorkspaceInvite[] / WorkspaceMember[].
  const needsRepresentation =
    method === "POST" || method === "PATCH";

  const response = await fetch(`${auth.url}/rest/v1${path}`, {
    method,
    headers: authHeaders(
      auth.anonKey,
      session.access_token,
      needsRepresentation
    ),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const payload: unknown = await response
      .json()
      .catch(() => ({}));

    throw new Error(parseError(response.status, payload));
  }

  if (expectEmpty || response.status === 204) {
    return undefined as T;
  }

  // Avoid "Unexpected end of JSON input" if PostgREST
  // returns a successful response with no body.
  const text = await response.text();

  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

const memberColumns =
  "id,workspace_id,user_id,role,created_at";
const inviteColumns =
  "id,workspace_id,token,role,created_by,created_at,expires_at";

/** Fetch all members for a workspace (owners + joined users). */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const rows = await memberRequest<WorkspaceMember[]>(
    "GET",
    `/workspace_members?select=${memberColumns}&workspace_id=eq.${encodeURIComponent(workspaceId)}&order=created_at.asc`
  );
  return rows ?? [];
}

/** Fetch the current user's role in a workspace, or null if not a member/owner. */
export async function getMyRole(workspaceId: string): Promise<{ role: MemberRole; isOwner: boolean } | null> {
  const session = getSession();
  if (!session) return null;
  const auth = config();

  const userResp = await fetch(`${auth.url}/auth/v1/user`, {
    headers: {
      apikey: auth.anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!userResp.ok) return null;
  const user: unknown = await userResp.json().catch(() => null);
  if (typeof user !== "object" || user === null) return null;
  const userId = (user as Record<string, unknown>).id;
  if (typeof userId !== "string") return null;

  const rows = await memberRequest<WorkspaceMember[]>(
    "GET",
    `/workspace_members?select=${memberColumns}&workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`
  );
  const member = rows?.[0];
  if (member) {
    return { role: member.role, isOwner: member.role === "owner" };
  }

  // Not in the members table — check ownership.
  const wsResp = await fetch(`${auth.url}/rest/v1/workspaces?select=owner_id&id=eq.${encodeURIComponent(workspaceId)}&limit=1`, {
    headers: {
      apikey: auth.anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!wsResp.ok) return null;
  const workspaces: unknown = await wsResp.json().catch(() => []);
  const ws = Array.isArray(workspaces) ? workspaces[0] : null;
  if (ws && (ws as Record<string, unknown>).owner_id === userId) {
    return { role: "owner", isOwner: true };
  }

  return null;
}

/** Create an invite link (owner only). Returns the full shareable URL. */
export async function createInvite(
  workspaceId: string,
  role: "editor" | "viewer" = "editor",
  expiresInHours?: number
): Promise<WorkspaceInvite> {
  const token = generateToken();
  const payload: Record<string, unknown> = {
    workspace_id: workspaceId,
    token,
    role,
    created_by: (await getMyUserId()) ?? null,
    ...(expiresInHours
      ? { expires_at: new Date(Date.now() + expiresInHours * 3600_000).toISOString() }
      : {}),
  };

  const [invite] = (await memberRequest<WorkspaceInvite[]>(
    "POST",
    `/workspace_invites?select=${inviteColumns}`,
    payload
  )) as WorkspaceInvite[];
  if (!invite) {
    throw new Error("Invite could not be created.");
  }
  return invite;
}

/** Resolve an invite token to its workspace (used to accept a join). */
export async function getInviteByToken(token: string): Promise<WorkspaceInvite | null> {
  const rows = await memberRequest<WorkspaceInvite[]>(
    "GET",
    `/workspace_invites?select=${inviteColumns}&token=eq.${encodeURIComponent(token)}&limit=1`
  );
  const invite = rows?.[0] ?? null;

  if (invite && invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return null;
  }
  return invite;
}

/** Accept an invite and add the current user as a member (idempotent). */
export async function acceptInvite(token: string): Promise<{ workspaceId: string; role: MemberRole; alreadyMember: boolean } | null> {
  const invite = await getInviteByToken(token);
  if (!invite) return null;

  const userId = await getMyUserId();
  if (!userId) return null;

  // Ensure we can read the workspace row (to verify existence/ownership).
  const existing = await memberRequest<WorkspaceMember[]>(
    "GET",
    `/workspace_members?select=${memberColumns}&workspace_id=eq.${encodeURIComponent(invite.workspace_id)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`
  );

  if (existing?.[0]) {
    return { workspaceId: invite.workspace_id, role: existing[0].role, alreadyMember: true };
  }

  try {
  await memberRequest<WorkspaceMember[]>(
    "POST",
    `/workspace_members?select=${memberColumns}`,
    {
      workspace_id: invite.workspace_id,
      user_id: userId,
      role: invite.role,
    }
  );
} catch (err) {
  console.error("Failed to join workspace:", err);
  throw err;
}

  return { workspaceId: invite.workspace_id, role: invite.role, alreadyMember: false };
}

/** Look up a member row (used to check role before removing, etc.). */
export async function removeMember(workspaceId: string, userId: string): Promise<boolean> {
  await memberRequest<void>(
    "DELETE",
    `/workspace_members?workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(userId)}`,
    undefined,
    true
  );
  return true;
}

/** Update a member's role (owner only). */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: MemberRole
): Promise<WorkspaceMember | null> {
  const [member] = (await memberRequest<WorkspaceMember[]>(
    "PATCH",
    `/workspace_members?select=${memberColumns}&workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(userId)}`,
    { role }
  )) as WorkspaceMember[];
  return member ?? null;
}

async function getMyUserId(): Promise<string | null> {
  const session = getSession();
  if (!session) return null;
  const auth = config();
  const response = await fetch(`${auth.url}/auth/v1/user`, {
    headers: {
      apikey: auth.anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!response.ok) return null;
  const user: unknown = await response.json().catch(() => null);
  if (typeof user !== "object" || user === null) return null;
  const id = (user as Record<string, unknown>).id;
  return typeof id === "string" ? id : null;
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

